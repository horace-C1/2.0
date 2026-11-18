import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CalendarEvent } from "../type/calendar";
import type { Day, Project, Step, Task } from "../type/task";
import { getCalendarEvents, getTaskStepDate } from "../services/calendarStorage";
import { getProjects } from "../services/projectStorage";
import { getTasks, updateTask } from "../services/taskStorage";
import "../style/dashboard.css";

type StepEntry = {
  event: CalendarEvent;
  task: Task;
  day: Day;
  step: Step;
  dueDate: string;
};

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateHeading = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (minutes: number) =>
  new Date(2000, 0, 1, 0, minutes).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const getTimeRange = (event: CalendarEvent) => {
  if (!event.time) return "Unscheduled";
  const [hour, minute] = event.time.split(":").map(Number);
  const start = hour * 60 + minute;
  return `${formatTime(start)}–${formatTime(start + (event.duration ?? 60))}`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(() => getTasks());
  const [projects] = useState<Project[]>(() => getProjects());
  const [calendarEvents] = useState<CalendarEvent[]>(() => getCalendarEvents());
  const now = new Date();
  const today = getLocalDateString(now);
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const lastUpcomingDate = getLocalDateString(sevenDaysOut);

  const eventsByStep = new Map<string, CalendarEvent>(
    calendarEvents.map((event): [string, CalendarEvent] => [
      JSON.stringify([event.taskId, event.dayId, event.stepId]),
      event,
    ])
  );
  const entries: StepEntry[] = tasks.flatMap((task) =>
    task.timeline.flatMap((day) =>
      day.steps.map((step) => {
        const dueDate = getTaskStepDate(task, day, step);
        const eventKey = JSON.stringify([task.id, day.id, step.id]);
        const event: CalendarEvent = eventsByStep.get(eventKey) ?? {
          id: `unscheduled-${eventKey}`,
          taskId: task.id,
          dayId: day.id,
          stepId: step.id,
          date: dueDate,
          time: null,
          duration: 60,
        };

        return { event, task, day, step, dueDate };
      })
    )
  );

  const sortEntries = (items: StepEntry[]) => [...items].sort((a, b) => {
    const dateOrder = a.event.date.localeCompare(b.event.date);
    if (dateOrder !== 0) return dateOrder;
    return (a.event.time ?? "99:99").localeCompare(b.event.time ?? "99:99");
  });

  const dueToday = sortEntries(entries.filter((entry) => entry.event.date === today && !entry.step.completed));
  const overdue = entries
    .filter((entry) => entry.dueDate < today && !entry.step.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)
      || (a.event.time ?? "99:99").localeCompare(b.event.time ?? "99:99"));
  const upcoming = sortEntries(entries.filter((entry) =>
    !entry.step.completed && entry.event.date > today && entry.event.date <= lastUpcomingDate
  ));
  const activeTaskCount = tasks.filter((task) =>
    task.timeline.some((day) => day.steps.some((step) => !step.completed))
  ).length;
  const todaySteps = tasks.flatMap((task) =>
    task.timeline
      .flatMap((day) => day.steps.filter((step) => getTaskStepDate(task, day, step) === today))
  );
  const todayCompletedStepCount = todaySteps.filter((step) => step.completed).length;
  const todayRemainingStepCount = todaySteps.length - todayCompletedStepCount;
  const progressSegments = [
    { label: "Completed today", count: todayCompletedStepCount, color: "#22c55e" },
    { label: "Remaining today", count: todayRemainingStepCount, color: "#cbd5e1" },
  ];
  const visibleProgressTotal = todaySteps.length;
  const todayProgressPercentage = visibleProgressTotal
    ? Math.round((todayCompletedStepCount / visibleProgressTotal) * 100)
    : 0;
  const toggleStep = (entry: StepEntry) => {
    const updatedTask: Task = {
      ...entry.task,
      timeline: entry.task.timeline.map((day) => day.id !== entry.day.id ? day : {
        ...day,
        steps: day.steps.map((step) => step.id === entry.step.id
          ? { ...step, completed: !step.completed }
          : step
        ),
      }),
    };
    updateTask(updatedTask);
    setTasks((current) => current.map((task) => task.id === updatedTask.id ? updatedTask : task));
  };

  const renderStepRow = (
    entry: StepEntry,
    showDate = false,
    showSchedule = false,
    showTaskName = false,
    showDueDate = false
  ) => {
    const project = projects.find((item) => item.id === entry.task.projectId);
    return (
      <div className="dashboard-step" key={entry.event.id}>
        <input
          type="checkbox"
          aria-label={`Mark ${entry.step.title} complete`}
          checked={entry.step.completed}
          onChange={() => toggleStep(entry)}
        />
        <span className="dashboard-step-main">
          <span className="dashboard-step-title">
            {showTaskName ? entry.task.title : entry.step.title}
          </span>
          <span className="dashboard-step-meta">
            {showDate && <span>{new Date(`${showDueDate ? entry.dueDate : entry.event.date}T00:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>}
            <span>{getTimeRange(entry.event)}</span>
            {!showTaskName && <span>{entry.task.title}</span>}
            {project && <span>{project.name}</span>}
          </span>
        </span>
        {showSchedule && !entry.event.time && (
          <button type="button" className="dashboard-schedule-link" onClick={() => navigate("/calendar")}>
            Schedule
          </button>
        )}
      </div>
    );
  };

  const renderMoreLink = (count: number, destination = "/daily") => count > 0 && (
    <button type="button" className="dashboard-more-link" onClick={() => navigate(destination)}>
      +{count} more
    </button>
  );

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Protocol Tracker</p>
          <h1>Dashboard</h1>
          <p className="dashboard-date">{formatDateHeading(now)}</p>
        </div>
        <div className="dashboard-quick-actions">
          <button type="button" className="dashboard-primary-action" onClick={() => navigate("/tasks")}>Create Task</button>
          <button type="button" onClick={() => navigate("/calendar")}>Open Calendar</button>
        </div>
      </header>

      <section className="dashboard-metrics" aria-label="Work summary">
        <button type="button" className="dashboard-metric" onClick={() => navigate("/daily")}>
          <span>Due today</span><strong>{dueToday.length}</strong><small>incomplete steps</small>
        </button>
        <button type="button" className="dashboard-metric dashboard-metric-alert" onClick={() => navigate("/daily")}>
          <span>Overdue</span><strong>{overdue.length}</strong><small>need attention</small>
        </button>
        <button type="button" className="dashboard-metric" onClick={() => navigate("/projects")}>
          <span>Ongoing experiments</span><strong>{activeTaskCount}</strong><small>with unfinished steps</small>
        </button>
      </section>

      <section className="dashboard-progress-panel" aria-label="Today's step progress">
        <div className="dashboard-progress-heading">
          <h2>Today's progress</h2>
          <strong>{todayProgressPercentage}%</strong>
        </div>
        {visibleProgressTotal ? (
          <>
            <div
              className="dashboard-stacked-bar"
              role="img"
              aria-label={progressSegments.map((segment) => `${segment.label}: ${segment.count}`).join(", ")}
            >
              {progressSegments.map((segment) => segment.count > 0 && (
                <span
                  key={segment.label}
                  className="dashboard-stacked-segment"
                  style={{
                    width: `${(segment.count / visibleProgressTotal) * 100}%`,
                    backgroundColor: segment.color,
                  }}
                />
              ))}
            </div>
            <div className="dashboard-progress-legend">
              {progressSegments.map((segment) => (
                <div className="dashboard-progress-legend-item" key={segment.label}>
                  <span style={{ backgroundColor: segment.color }} />
                  <span>{segment.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="dashboard-stacked-bar dashboard-stacked-bar-empty" role="img" aria-label="No steps scheduled for today" />
        )}
      </section>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <h2>Today</h2>
            <button type="button" className="dashboard-text-link" onClick={() => navigate("/daily")}>View daily tasks</button>
          </div>
          {dueToday.length ? (
            <>
              <div className="dashboard-step-list">{dueToday.slice(0, 3).map((entry) => renderStepRow(entry))}</div>
              {renderMoreLink(dueToday.length - 3)}
            </>
          ) : (
            <p className="dashboard-empty">Nothing due today. You’re all caught up.</p>
          )}

          <div className="dashboard-panel-heading dashboard-overdue-heading">
            <h2>Overdue</h2>
          </div>
          {overdue.length ? (
            <>
              <div className="dashboard-step-list">{overdue.slice(0, 3).map((entry) => renderStepRow(entry, true, false, false, true))}</div>
              {renderMoreLink(overdue.length - 3)}
            </>
          ) : (
            <p className="dashboard-empty">No overdue steps.</p>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div><h2>Coming up</h2><p>Next seven days</p></div>
            <button type="button" className="dashboard-text-link" onClick={() => navigate("/calendar")}>Open calendar</button>
          </div>
          {upcoming.length ? (
            <>
              <div className="dashboard-step-list">{upcoming.slice(0, 3).map((entry) => renderStepRow(entry, true, true, true))}</div>
              {renderMoreLink(upcoming.length - 3, "/calendar")}
            </>
          ) : (
            <p className="dashboard-empty">No steps coming up in the next week.</p>
          )}
        </section>
      </div>
    </div>
  );
}
