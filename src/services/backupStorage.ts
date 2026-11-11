import type { CalendarEvent } from "../type/calendar";
import type { Project, Task } from "../type/task";

const STORAGE_KEYS = {
  tasks: "protocol-tracker-tasks",
  projects: "protocol-tracker-projects",
  calendarEvents: "protocol-tracker-calendar-events",
} as const;

export type AppBackup = {
  format: "protocol-tracker-backup";
  version: 1;
  exportedAt: string;
  data: {
    tasks: Task[];
    projects: Project[];
    calendarEvents: CalendarEvent[];
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isProject = (value: unknown): value is Project => {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") return false;
  if (value.color !== undefined && typeof value.color !== "string") return false;
  if (value.progressNotes !== undefined && typeof value.progressNotes !== "string") return false;
  return value.actionItems === undefined || (
    Array.isArray(value.actionItems) && value.actionItems.every((item) =>
      isRecord(item) && typeof item.id === "string" && typeof item.text === "string" && typeof item.completed === "boolean"
    )
  );
};

const isTask = (value: unknown): value is Task => {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.projectId !== "string" ||
      typeof value.title !== "string" || typeof value.startDate !== "string" || typeof value.notes !== "string" ||
      (value.status !== "In Progress" && value.status !== "Completed") || !Array.isArray(value.timeline)) return false;

  return value.timeline.every((day) =>
    isRecord(day) && typeof day.id === "string" && typeof day.offset === "number" &&
    typeof day.date === "string" && Array.isArray(day.steps) && day.steps.every((step) =>
      isRecord(step) && typeof step.id === "string" && typeof step.title === "string" &&
      typeof step.completed === "boolean" && (step.startTime === undefined || typeof step.startTime === "string")
    )
  );
};

const isCalendarEvent = (value: unknown): value is CalendarEvent =>
  isRecord(value) && typeof value.id === "string" && typeof value.taskId === "string" &&
  typeof value.dayId === "string" && typeof value.stepId === "string" && typeof value.date === "string" &&
  (value.time === null || (typeof value.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time))) &&
  typeof value.duration === "number" && Number.isFinite(value.duration) && value.duration >= 15;

export const createBackup = (): AppBackup => ({
  format: "protocol-tracker-backup",
  version: 1,
  exportedAt: new Date().toISOString(),
  data: {
    tasks: JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) ?? "[]") as Task[],
    projects: JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) ?? "[]") as Project[],
    calendarEvents: JSON.parse(localStorage.getItem(STORAGE_KEYS.calendarEvents) ?? "[]") as CalendarEvent[],
  },
});

const textField = (value: string | number | boolean | null | undefined) =>
  JSON.stringify(value ?? null);

export const serializeTextBackup = (backup: AppBackup): string => {
  const lines = [
    "PROTOCOL TRACKER BACKUP",
    "Format: PT-BACKUP-TEXT",
    "Version: 1",
    `Exported at: ${backup.exportedAt}`,
    "",
    "Each data row is tab-separated. Quoted text values use standard escaping.",
    "PROJECT  id  name  color  progress notes",
    "ACTION_ITEM  project id  item id  text  completed",
    "TASK  id  project id  title  start date  notes  status",
    "DAY  task id  day id  offset  date",
    "STEP  task id  day id  step id  title  completed  start time",
    "CALENDAR_EVENT  id  task id  day id  step id  date  time  duration minutes",
    "",
  ];

  backup.data.projects.forEach((project) => {
    lines.push([
      "PROJECT", textField(project.id), textField(project.name), textField(project.color),
      textField(project.progressNotes),
    ].join("\t"));
    project.actionItems?.forEach((item) => {
      lines.push(["ACTION_ITEM", textField(project.id), textField(item.id), textField(item.text), String(item.completed)].join("\t"));
    });
  });

  backup.data.tasks.forEach((task) => {
    lines.push([
      "TASK", textField(task.id), textField(task.projectId), textField(task.title),
      textField(task.startDate), textField(task.notes), textField(task.status),
    ].join("\t"));
    task.timeline.forEach((day) => {
      lines.push(["DAY", textField(task.id), textField(day.id), String(day.offset), textField(day.date)].join("\t"));
      day.steps.forEach((step) => {
        lines.push([
          "STEP", textField(task.id), textField(day.id), textField(step.id), textField(step.title),
          String(step.completed), textField(step.startTime),
        ].join("\t"));
      });
    });
  });

  backup.data.calendarEvents.forEach((event) => {
    lines.push([
      "CALENDAR_EVENT", textField(event.id), textField(event.taskId), textField(event.dayId),
      textField(event.stepId), textField(event.date), textField(event.time), String(event.duration),
    ].join("\t"));
  });

  return `${lines.join("\n")}\n`;
};

const parseTextBackup = (text: string): AppBackup => {
  const lines = text.split(/\r?\n/);
  const exportedAtLine = lines.find((line) => line.startsWith("Exported at: "));
  if (!lines.includes("Format: PT-BACKUP-TEXT") || !lines.includes("Version: 1") || !exportedAtLine) {
    throw new Error("This text file is not a supported Protocol Tracker backup.");
  }

  const decode = (value: string | undefined): unknown => {
    if (value === undefined) throw new Error("The backup is missing a field.");
    try {
      return JSON.parse(value);
    } catch {
      throw new Error("The backup has a text field that could not be read.");
    }
  };
  const asString = (value: string | undefined) => {
    const decoded = decode(value);
    if (typeof decoded !== "string") throw new Error("The backup contains an invalid text field.");
    return decoded;
  };
  const asOptionalString = (value: string | undefined) => {
    const decoded = decode(value);
    if (decoded !== null && typeof decoded !== "string") throw new Error("The backup contains an invalid optional text field.");
    return decoded ?? undefined;
  };
  const asBoolean = (value: string | undefined) => {
    if (value !== "true" && value !== "false") throw new Error("The backup contains an invalid checkbox value.");
    return value === "true";
  };
  const asNumber = (value: string | undefined) => {
    const decoded = Number(value);
    if (!Number.isFinite(decoded)) throw new Error("The backup contains an invalid number.");
    return decoded;
  };

  const projects: Project[] = [];
  const tasks: Task[] = [];
  const calendarEvents: CalendarEvent[] = [];

  lines.forEach((line) => {
    if (!line || line.startsWith("PROTOCOL TRACKER") || line.startsWith("Format:") ||
        line.startsWith("Version:") || line.startsWith("Exported at:") || line.startsWith("Each data") ||
        line.startsWith("PROJECT  ") || line.startsWith("ACTION_ITEM  ") || line.startsWith("TASK  ") ||
        line.startsWith("DAY  ") || line.startsWith("STEP  ") || line.startsWith("CALENDAR_EVENT  ")) return;

    const fields = line.split("\t");
    const [kind, ...values] = fields;
    if (kind === "PROJECT") {
      projects.push({
        id: asString(values[0]), name: asString(values[1]), color: asOptionalString(values[2]),
        progressNotes: asOptionalString(values[3]), actionItems: [],
      });
    } else if (kind === "ACTION_ITEM") {
      const project = projects.find((item) => item.id === asString(values[0]));
      if (!project) throw new Error("An action item refers to a project that is missing from the backup.");
      project.actionItems ??= [];
      project.actionItems.push({ id: asString(values[1]), text: asString(values[2]), completed: asBoolean(values[3]) });
    } else if (kind === "TASK") {
      tasks.push({
        id: asString(values[0]), projectId: asString(values[1]), title: asString(values[2]),
        startDate: asString(values[3]), notes: asString(values[4]), status: asString(values[5]) as Task["status"],
        timeline: [],
      });
    } else if (kind === "DAY") {
      const task = tasks.find((item) => item.id === asString(values[0]));
      if (!task) throw new Error("A task day refers to a task that is missing from the backup.");
      task.timeline.push({ id: asString(values[1]), offset: asNumber(values[2]), date: asString(values[3]), steps: [] });
    } else if (kind === "STEP") {
      const task = tasks.find((item) => item.id === asString(values[0]));
      const day = task?.timeline.find((item) => item.id === asString(values[1]));
      if (!day) throw new Error("A task step refers to a day that is missing from the backup.");
      const startTime = asOptionalString(values[5]);
      day.steps.push({
        id: asString(values[2]), title: asString(values[3]), completed: asBoolean(values[4]),
        ...(startTime === undefined ? {} : { startTime }),
      });
    } else if (kind === "CALENDAR_EVENT") {
      const time = asOptionalString(values[5]);
      calendarEvents.push({
        id: asString(values[0]), taskId: asString(values[1]), dayId: asString(values[2]),
        stepId: asString(values[3]), date: asString(values[4]), time: time ?? null, duration: asNumber(values[6]),
      });
    } else {
      throw new Error("The backup contains an unknown row type.");
    }
  });

  return parseBackup(JSON.stringify({
    format: "protocol-tracker-backup",
    version: 1,
    exportedAt: exportedAtLine.slice("Exported at: ".length),
    data: { tasks, projects, calendarEvents },
  }));
};

export const parseBackup = (text: string): AppBackup => {
  if (text.startsWith("PROTOCOL TRACKER BACKUP")) return parseTextBackup(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  if (!isRecord(parsed) || parsed.format !== "protocol-tracker-backup" || parsed.version !== 1 ||
      typeof parsed.exportedAt !== "string" || !isRecord(parsed.data)) {
    throw new Error("This file is not a Protocol Tracker backup.");
  }

  const { tasks, projects, calendarEvents } = parsed.data;
  if (!Array.isArray(tasks) || !tasks.every(isTask) || !Array.isArray(projects) || !projects.every(isProject) ||
      !Array.isArray(calendarEvents) || !calendarEvents.every(isCalendarEvent)) {
    throw new Error("The backup is incomplete or contains data this version cannot restore.");
  }

  return parsed as unknown as AppBackup;
};

export const restoreBackup = (backup: AppBackup): void => {
  const values = {
    [STORAGE_KEYS.tasks]: JSON.stringify(backup.data.tasks),
    [STORAGE_KEYS.projects]: JSON.stringify(backup.data.projects),
    [STORAGE_KEYS.calendarEvents]: JSON.stringify(backup.data.calendarEvents),
  };
  const previous = Object.fromEntries(
    Object.values(STORAGE_KEYS).map((key) => [key, localStorage.getItem(key)])
  );

  try {
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value));
  } catch (error) {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    });
    throw error;
  }
};
