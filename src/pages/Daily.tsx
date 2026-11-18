import { useEffect, useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import type {
  Task,
  Day,
  Step,
} from "../type/task";

import {
  getTasks,
  updateTask,
} from "../services/taskStorage";

import { createEventsForTask, getTaskStepDate, syncTaskStepDates } from "../services/calendarStorage";

import {
  getProjects,
} from "../services/projectStorage";

import type {
  Project,
} from "../type/task";

import TimelineEditor from "../components/task/TimelineEditor";

export default function Daily() {

  const navigate = useNavigate();

  const [editingTaskId, setEditingTaskId] =
  useState<string | null>(null);

  const [editingTask, setEditingTask] =
  useState<Task | null>(null);

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

const today =
  getLocalDateString(new Date());

const isStepToday = (
  task: Task,
  day: Day,
  step: Step
) => {
  return getTaskStepDate(task, day, step) === today;
};

const isPastDay = (
  task: Task,
  day: Day,
  step: Step
) => {
  return getTaskStepDate(task, day, step) < today;
};

const isStepOverdue = (
  task: Task,
  day: Day,
  step: Step
) => {

  return (
    isPastDay(task, day, step)
    &&
    !step.completed
  );

};    

const hasVisibleStepsInDay = (
    task: Task,
    day: Day
  ) => {

    return day.steps.some(
      (step) => {

        if (getTaskStepDate(task, day, step) > today) return false;

        // hide completed steps from past days
        if (
          step.completed &&
          isPastDay(task, day, step)
        ) {
          return false;
        }

        return true;

      }
    );

  };

const getProjectName = (
  projectId: string
) => {

  const project =
    projects.find(
      (p) =>
        p.id === projectId
    );

  return project
    ? project.name
    : "No Project";

};

const toggleStep = (
  task: Task,
  dayId: string,
  stepId: string
) => {

  const updatedTask = {

    ...task,

    timeline:
      task.timeline.map(
        (day) =>

          day.id === dayId

          ?

          {

            ...day,

            steps:
              day.steps.map(
                (step) =>

                  step.id === stepId

                  ?

                  {
                    ...step,
                    completed:
                      !step.completed,
                  }

                  :

                  step

              ),

          }

          :

          day

      ),

  };


  updateTask(
    updatedTask
  );


  setTasks(
    tasks.map(
      (t) =>
        t.id === task.id
        ?
        updatedTask
        :
        t
    )
  );

};


const [tasks, setTasks] =
  useState<Task[]>([]);

const [projects, setProjects] =
  useState<Project[]>([]);  

useEffect(() => {

  setTasks(
    getTasks()
  );

  setProjects(
    getProjects()
  );

}, []);

const dailyTasks =
tasks.filter(
(task) =>
task.timeline.some(
(day) =>
hasVisibleStepsInDay(
  task,
  day
)
)
);



  return (

    <div className="daily-page">


      <h1>
        Daily Tasks
      </h1>


      <h2>
        {new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </h2>



      {
        dailyTasks.length === 0 ? (

          <p>
            No tasks today.
          </p>


        ) : (


          dailyTasks.map(
            (task) => (

              <div
                key={task.id}
                className="daily-task"
              >


<div className="task-header">

  <h2>
    {task.title} ({getProjectName(task.projectId)})
  </h2>

  <div className="task-actions">

    <button
      type="button"
      onClick={() => {
        setEditingTaskId(task.id);
        setEditingTask(task);
      }}
    >
      Edit
    </button>

    <button
      type="button"
      onClick={() => {
        navigate("/projects", {
          state: {
            projectId: task.projectId,
            taskId: task.id,
            editNotes: true,
          },
        });
      }}
    >
      Notes
    </button>

  </div>

</div>

{
  editingTaskId === task.id && editingTask

    ?

    (
      <>
        <TimelineEditor
          timeline={editingTask.timeline}
          startDate={editingTask.startDate}
          showStepDates
          onUpdateTimeline={(timeline) => {

            setEditingTask({
              ...editingTask,
              timeline,
            });

          }}
        />

        <div className="edit-actions">

          <button
            type="button"
            onClick={() => {

              if (!editingTask) return;

              const previousTask = tasks.find((item) => item.id === editingTask.id);
              if (previousTask) syncTaskStepDates(editingTask, previousTask);
              updateTask(editingTask);
              createEventsForTask(editingTask);

              setTasks(
                tasks.map((t) =>
                  t.id === editingTask.id
                    ? editingTask
                    : t
                )
              );

              setEditingTask(null);
              setEditingTaskId(null);

            }}
          >
            Save Changes
          </button>


          <button
            type="button"
            onClick={() => {

              setEditingTask(null);
              setEditingTaskId(null);

            }}
          >
            Cancel
          </button>

        </div>
      </>
    )

    :

    (
      // NORMAL DAILY MODE
      task.timeline
        .filter(
          (day) => {

const isVisibleDate = day.steps.some((step) => getTaskStepDate(task, day, step) <= today);

            return (
              isVisibleDate &&
              hasVisibleStepsInDay(
                task,
                day
              )
            );

          }
        )
        .map(
          (day) => (

            <div
              key={day.id}
            >

              {
                day.steps
                  .filter(
                    (step) => {

                      // A calendar move changes one step's date, even when
                      // its neighboring steps still belong to another day.
                      if (getTaskStepDate(task, day, step) > today) {
                        return false;
                      }

                      if (
                        step.completed &&
                        isPastDay(task, day, step)
                      ) {
                        return false;
                      }

                      return true;

                    }
                  )
                  .map(
                    (step) => (

                      <label
                        key={step.id}
                        className={
                          step.completed &&
                          isStepToday(task, day, step)

                            ?

                          "completed-step"

                            :

                          isStepOverdue(
                            task,
                            day,
                            step
                          )

                            ?

                          "overdue-step"

                            :

                          ""
                        }
                      >

                        <input
                          type="checkbox"
                          checked={
                            step.completed
                          }
                          onChange={() =>
                            toggleStep(
                              task,
                              day.id,
                              step.id
                            )
                          }
                        />

                        {" "}

                        {step.title}

                      </label>

                    )
                  )
              }

            </div>

          )
        )
    )
}


              </div>

            )

          )

        )
      }


    </div>

  );

}
