// ===============================
// Protocol Tracker v2.0
// Task Type Definitions
// ===============================


export type TaskStatus =
  | "In Progress"
  | "Completed";



export interface Project {

  id: string;

  name: string;

  color?: string;

  progressNotes?: string;

  actionItems?: ProjectActionItem[];

}

export interface ProjectActionItem {
  id: string;
  text: string;
  completed: boolean;
}



export interface Step {

  id: string;

  title: string;

  completed: boolean;

  startTime?: string;

}



export interface Day {

  id: string;

  // D0 = 0
  // D1 = 1
  // D2 = 2

  offset: number;
  
  date: string;

  steps: Step[];

}



export interface Task {

  id: string;

  projectId: string;

  title: string;

  startDate: string;

  notes: string;

  status: TaskStatus;

  timeline: Day[];

}



export type StepUpdate = Partial<Step>;
console.log("task.ts loaded");
