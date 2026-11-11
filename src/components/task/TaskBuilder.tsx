import { useEffect, useState } from "react";
import "../../style/task.css";
import { saveTask } from "../../services/taskStorage";
import {
  createEventsForTask,
} from "../../services/calendarStorage";
import type {
  Task,
  Project,
  Step,
  Day,
} from "../../type/task";

import {
  useLocation,
} from "react-router-dom";

import ProjectSelector from "./ProjectSelector";
import TaskInfo from "./TaskInfo";
import TimelineEditor from "./TimelineEditor";

import {
  getProjects,
  saveProject,
} from "../../services/projectStorage";

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

  const createInitialStep = (): Step => ({
    id: crypto.randomUUID(),
    title: "",
    completed: false,
  });

const createInitialDay = (
  date: string
): Day => ({

  id: crypto.randomUUID(),

  offset: 0,

  date,

  steps: [
    createInitialStep()
  ],

});

const addDays = (
  date: string,
  days: number
) => {
  const [year, month, day] =
    date.split("-").map(Number);

  const result = new Date(
    year,
    month - 1,
    day
  );

  result.setDate(
    result.getDate() + days
  );

  return getLocalDateString(result);
};

const createNewTask = (
  template?: Task
): Task => {

  const today =
    getLocalDateString(new Date());

  return {
    id: crypto.randomUUID(),

    projectId:
      template?.projectId || "",

    title: "",

    startDate: today,

    notes: "",

    status: "In Progress",

    timeline: template
      ? template.timeline.map(
          (day) => ({
            ...day,

            id: crypto.randomUUID(),

            date: addDays(
              today,
              day.offset
            ),

            steps:
              day.steps.map(
                (step) => ({
                  ...step,

                  id:
                    crypto.randomUUID(),

                  completed: false,
                })
              ),
          })
        )
      : [
          createInitialDay(today),
        ],
  };
};

export default function TaskBuilder() {

  const location = useLocation();


const templateTask =
  location.state?.templateTask;

  const [projects, setProjects] =
    useState<Project[]>([]);
    useEffect(() => {

  setProjects(
    getProjects()
  );

}, []);

const [task,setTask] =
useState<Task>(
 createNewTask(
   templateTask
 )
);

const [autoFocusAllowed, setAutoFocusAllowed] = useState(
  () => !window.matchMedia("(max-width: 620px)").matches
);

useEffect(() => {
  setAutoFocusAllowed(true);
}, []);


  const updateTask = (
    update: Partial<Task>
  ) => {

    setTask({
      ...task,
      ...update,
    });

  };

  const addTaskDay = () => {
    const offset = task.timeline.length;
    const newDay: Day = {
      id: crypto.randomUUID(),
      offset,
      date: addDays(task.startDate, offset),
      steps: [createInitialStep()],
    };
    updateTask({ timeline: [...task.timeline, newDay] });
  };

  const createProject = (
    name: string
  ) => {

    const newProject: Project = {

      id:
        crypto.randomUUID(),

      name,

    };

    saveProject(newProject);

    setProjects([
      ...projects,
      newProject,
    ]);


    updateTask({

      projectId:
        newProject.id,

    });

  };

  const [lastTaskTitle, setLastTaskTitle] =
  useState("");

  const updateTimeline = (
    timeline: Day[]
  ) => {

    updateTask({

      timeline,

    });

  };

  const [taskCreated, setTaskCreated] =
  useState(false);

const createTask = () => {

  saveTask(task);

  createEventsForTask(task);

  setLastTaskTitle(task.title);

  setTask(createNewTask());

  setTaskCreated(true);

  setTimeout(() => {
    setTaskCreated(false);
  }, 2000);

};

const handleShortcut = (event: React.KeyboardEvent<HTMLDivElement>) => {
  if (event.key !== "Enter") return;
  if (event.ctrlKey) {
    event.preventDefault();
    createTask();
  } else if (event.shiftKey) {
    event.preventDefault();
    addTaskDay();
  }
};
  
  return (

    <div className="task-builder" onKeyDown={handleShortcut}>


      <h1>
        Create Task
      </h1>



      <ProjectSelector

        projects={
          projects
        }


        selectedProjectId={
          task.projectId
        }


        onSelectProject={
          (id) =>
            updateTask({

              projectId:id,

            })
        }


        onCreateProject={
          createProject
        }

      />



      <TaskInfo

        taskName={
          task.title
        }


        startDate={
          task.startDate
        }


        onTaskNameChange={
          (value) =>
            updateTask({

              title:value,

            })
        }


        onStartDateChange={
          (value) =>
            updateTask({

              startDate:value,

            })
        }

      />



      <TimelineEditor

        timeline={
          task.timeline
        }

        autoFocusAllowed={autoFocusAllowed}

        startDate={task.startDate}

        onAddDay={addTaskDay}


        onUpdateTimeline={
          updateTimeline
        }

      />

      {taskCreated && (

        <div className="success-message">

          ✓ "{lastTaskTitle}" created!

        </div>

      )}

      <p className="keyboard-shortcut-hint">
        <kbd>Enter</kbd> add a step <span>·</span> <kbd>Shift+Enter</kbd> add a day <span>·</span> <kbd>Ctrl+Enter</kbd> create task
      </p>

      <button

        type="button"

        onClick={
          createTask
        }

      >

        Create Task

      </button>


    </div>

  );

}
