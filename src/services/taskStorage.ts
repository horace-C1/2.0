import type { Task } from "../type/task";

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
    return JSON.parse(data) as Task[];
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

}

/**
 * Load one task by ID.
 */
export function getTask(taskId: string): Task | undefined {

  return getTasks().find(
    (task) => task.id === taskId
  );

}