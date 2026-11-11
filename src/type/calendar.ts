export type CalendarEvent = {
  id: string;

  taskId: string;

  dayId: string;

  stepId: string;

  date: string;

  time: string | null;

  duration: number;
};
