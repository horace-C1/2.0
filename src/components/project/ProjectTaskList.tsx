import type { Task } from "../../type/task";


interface ProjectTaskListProps {

  tasks: Task[];

  selectedProjectId: string;

  onSelectTask: (
    task: Task
  ) => void;

}



export default function ProjectTaskList({

  tasks,

  selectedProjectId,

  onSelectTask,

}: ProjectTaskListProps) {



  const projectTasks = tasks

    .filter(
      (task) =>
        task.projectId === selectedProjectId
    )

    .sort(
      (a, b) =>
        new Date(a.startDate).getTime()
        -
        new Date(b.startDate).getTime()
    );



  if (!selectedProjectId) {

    return (

      <p>
        Please select a project.
      </p>

    );

  }



  if (projectTasks.length === 0) {

    return (

      <p>
        No tasks in this project.
      </p>

    );

  }



  return (

    <div className="project-task-list">


      <h2>
        Tasks
      </h2>



      {
        projectTasks.map(
          (task) => (

            <button

              key={task.id}

              className="project-task-item"

              onClick={() =>
                onSelectTask(task)
              }

            >

              <span>

                {
                  task.status === "Completed"
                    ? "✓"
                    :
                  task.status === "In Progress"
                    ? "⌛"
                    :
                    "○"
                }

              </span>


              <span>

                {task.title}

              </span>


            </button>

          )
        )
      }


    </div>

  );

}