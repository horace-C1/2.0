import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CalendarEvent } from "../type/calendar";
import type { Day, Project, Step, Task } from "../type/task";
import { getCalendarEvents } from "../services/calendarStorage";
import { getProjects } from "../services/projectStorage";
import { getTasks, updateTask } from "../services/taskStorage";
import "../style/dashboard.css";

type StepEntry = {
  event: CalendarEvent;
  task: Task;
  day: Day;
  step: Step;
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

  const entries: StepEntry[] = calendarEvents.flatMap((event) => {
    const task = tasks.find((item) => item.id === event.taskId);
    const day = task?.timeline.find((item) => item.id === event.dayId);
    const step = day?.steps.find((item) => item.id === event.stepId);
    return task && day && step ? [{ event, task, day, step }] : [];
  });

  const sortEntries = (items: StepEntry[]) => [...items].sort((a, b) => {
    const dateOrder = a.event.date.localeCompare(b.event.date);
    if (dateOrder !== 0) return dateOrder;
    return (a.event.time ?? "99:99").localeCompare(b.event.time ?? "99:99");
  });

  const dueToday = sortEntries(entries.filter((entry) => entry.event.date === today && !entry.step.completed));
  const overdue = sortEntries(entries.filter((entry) => entry.event.date < today && !entry.step.completed));
  const upcoming = sortEntries(entries.filter((entry) =>
    !entry.step.completed && entry.event.date > today && entry.event.date <= lastUpcomingDate
  ));
  const activeTaskCount = tasks.filter((task) =>
    task.timeline.some((day) => day.steps.some((step) => !step.completed))
  ).length;
  const totalStepCount = tasks.reduce(
    (total, task) => total + task.timeline.reduce((dayTotal, day) => dayTotal + day.steps.length, 0),
    0
  );
  const completedStepCount = tasks.reduce(
    (total, task) => total + task.timeline.reduce(
      (dayTotal, day) => dayTotal + day.steps.filter((step) => step.completed).length,
      0
    ),
    0
  );
  const progressSegments = [
    { label: "Completed", count: completedStepCount, color: "#22c55e" },
    { label: "Overdue", count: overdue.length, color: "#ef4444" },
    { label: "Due today", count: dueToday.length, color: "#f59e0b" },
  ];
  const visibleProgressTotal = progressSegments.reduce((total, segment) => total + segment.count, 0);
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
    showTaskName = false
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
            {showDate && <span>{new Date(`${entry.event.date}T00:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>}
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

      <section className="dashboard-progress-panel" aria-label="Overall step progress">
        <div className="dashboard-progress-heading">
          <h2>Overall progress</h2>
          <strong>{totalStepCount ? Math.round((completedStepCount / totalStepCount) * 100) : 0}%</strong>
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
          <div className="dashboard-stacked-bar dashboard-stacked-bar-empty" role="img" aria-label="No completed, overdue, or due today steps" />
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
              <div className="dashboard-step-list">{overdue.slice(0, 3).map((entry) => renderStepRow(entry, true))}</div>
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
