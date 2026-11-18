const STORAGE_KEY = "protocol-tracker-calendar-events";

export const getCalendarEvents = (): CalendarEvent[] => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  return JSON.parse(stored) as CalendarEvent[];
};

export const saveCalendarEvents = (
  events: CalendarEvent[]
) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(events)
  );
};

export const saveCalendarEvent = (
  event: CalendarEvent
) => {
  const events = getCalendarEvents();

  const existingIndex =
    events.findIndex(
      (e) => e.id === event.id
    );

  if (existingIndex >= 0) {

    events[existingIndex] = event;

  } else {

    events.push(event);

  }

  saveCalendarEvents(events);
};

export const updateCalendarEvent = (
  event: CalendarEvent
) => {
  saveCalendarEvent(event);
};

export const deleteCalendarEvent = (
  eventId: string
) => {

  const events =
    getCalendarEvents().filter(
      (event) =>
        event.id !== eventId
    );

  saveCalendarEvents(events);
};

import type { CalendarEvent } from "../type/calendar";
import type { Day, Step, Task } from "../type/task";

export const getTaskDayDefaultDate = (task: Task, day: Day) => {
  const date = new Date(`${task.startDate}T00:00:00`);
  date.setDate(date.getDate() + day.offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayNumber = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayNumber}`;
};

export const getTaskStepDate = (task: Task, day: Day, step: Step) =>
  step.scheduledDate || getTaskDayDefaultDate(task, day);

export const syncTaskStepDates = (task: Task, previousTask: Task) => {
  const events = getCalendarEvents();
  let changed = false;
  const updated = events.map((event) => {
    if (event.taskId !== task.id) return event;
    const day = task.timeline.find((item) => item.id === event.dayId);
    const step = day?.steps.find((item) => item.id === event.stepId);
    const oldDay = previousTask.timeline.find((item) => item.id === event.dayId);
    const oldStep = oldDay?.steps.find((item) => item.id === event.stepId);
    if (!day || !step || !oldDay || !oldStep) return event;
    const oldDate = getTaskStepDate(previousTask, oldDay, oldStep);
    const newDate = getTaskStepDate(task, day, step);
    if (oldDate === newDate) return event;
    changed = true;
    return { ...event, date: newDate };
  });
  if (changed) saveCalendarEvents(updated);
};

export const createEventsForTask = (
  task: Task
) => {

  const existingEvents =
    getCalendarEvents();

  const newEvents: CalendarEvent[] = [];

  task.timeline.forEach((day) => {

    day.steps.forEach((step) => {

      // Don't create a duplicate event
      const alreadyExists =
        existingEvents.some(
          (event) =>
            event.taskId === task.id &&
            event.dayId === day.id &&
            event.stepId === step.id
        );

      if (alreadyExists) {
        return;
      }

const date = getTaskStepDate(task, day, step);

newEvents.push({

  id: crypto.randomUUID(),

  taskId: task.id,

  dayId: day.id,

  stepId: step.id,

  date,

  time: null,

  duration: 60,

});

    });

  });

  if (newEvents.length > 0) {

    saveCalendarEvents([
      ...existingEvents,
      ...newEvents,
    ]);

  }

};
