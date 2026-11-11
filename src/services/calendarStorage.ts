const STORAGE_KEY = "protocol-tracker-calendar-events";

export const getCalendarEvents = (): CalendarEvent[] => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  const events: CalendarEvent[] = JSON.parse(stored);
  const migratedEvents = events.map((event) =>
    event.time === "09:00" ? { ...event, time: null } : event
  );

  if (migratedEvents.some((event, index) => event !== events[index])) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedEvents));
  }

  return migratedEvents;
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

import type { Task } from "../type/task";
import type { CalendarEvent } from "../type/calendar";

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

const stepDate = new Date(
  task.startDate + "T00:00:00"
);

stepDate.setDate(
  stepDate.getDate() + day.offset
);

const year =
  stepDate.getFullYear();

const month =
  String(
    stepDate.getMonth() + 1
  ).padStart(2, "0");

const dayNumber =
  String(
    stepDate.getDate()
  ).padStart(2, "0");

const date =
  `${year}-${month}-${dayNumber}`;

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
