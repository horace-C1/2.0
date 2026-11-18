import type { Task } from "../type/task";
import { getCalendarEvents, getTaskDayDefaultDate, saveCalendarEvents } from "./calendarStorage";

const TASK_STORAGE_KEY = "protocol-tracker-tasks";

/**
 * Load all tasks.
 */
export function getTasks(): Task[] {

  const data = localStorage.getItem(TASK_STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    const tasks = JSON.parse(data) as Task[];
    const events = getCalendarEvents();
    let migrated = false;
    tasks.forEach((task) => task.timeline.forEach((day) => day.steps.forEach((step) => {
      if (step.scheduledDate) return;
      const event = events.find((item) => item.taskId === task.id && item.dayId === day.id && item.stepId === step.id);
      if (event && event.date !== getTaskDayDefaultDate(task, day)) {
        step.scheduledDate = event.date;
        migrated = true;
      }
    })));
    if (migrated) saveTasks(tasks);
    return tasks;
  } catch (error) {
    console.error("Failed to load tasks:", error);
    return [];
  }

}

/**
 * Save the entire task list.
 */
function saveTasks(tasks: Task[]): void {

  localStorage.setItem(
    TASK_STORAGE_KEY,
    JSON.stringify(tasks)
  );

}

/**
 * Save one new task.
 */
export function saveTask(task: Task): void {

  const tasks = getTasks();

  tasks.push(task);

  saveTasks(tasks);

}

/**
 * Replace an existing task.
 */
export function updateTask(task: Task): void {

  const tasks = getTasks();

  const updatedTasks = tasks.map((t) =>
    t.id === task.id ? task : t
  );

  saveTasks(updatedTasks);

}

/**
 * Delete a task.
 */
export function deleteTask(taskId: string): void {

  const tasks = getTasks();

  const filteredTasks = tasks.filter(
    (task) => task.id !== taskId
  );

  saveTasks(filteredTasks);
  saveCalendarEvents(
    getCalendarEvents().filter((event) => event.taskId !== taskId)
  );

}

/**
 * Load one task by ID.
 */
export function getTask(taskId: string): Task | undefined {

  return getTasks().find(
    (task) => task.id === taskId
  );

}
