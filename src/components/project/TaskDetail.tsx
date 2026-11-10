import type { Task } from "../../type/task";

import {
  useEffect,
  useState,
} from "react";

interface TaskDetailProps {

  task: Task | null;

  onUpdateTask: (
    task: Task
  ) => void;

  onReuseProtocol: (
    task: Task
  ) => void;

  editNotes?: boolean;

}



export default function TaskDetail({

  task,

  onUpdateTask,

  onReuseProtocol,

  editNotes = false,

}: TaskDetailProps) {


  const [editingNotes, setEditingNotes] =
    useState(false);


  const [notes, setNotes] =
    useState("");

useEffect(() => {

  if (
    task &&
    editNotes
  ) {

    setNotes(
      task.notes || ""
    );

    setEditingNotes(true);

  }

}, [task, editNotes]);

  if (!task) {

    return (

      <div className="task-detail">

        <p>
          Select a task to view details.
        </p>

      </div>

    );

  }



  const startEditNotes = () => {

    setNotes(
      task.notes
    );

    setEditingNotes(true);

  };



  const saveNotes = () => {

    onUpdateTask({

      ...task,

      notes,

    });


    setEditingNotes(false);

  };



  return (

    <div className="task-detail">


      <h2>
        {task.title}
      </h2>


      <hr />



      {
        task.timeline.map(
          (day) => (

            <div
              key={day.id}
              className="task-day"
            >

              <h3>
                Day {day.offset + 1}
              </h3>


              {
                day.steps.map(
                  (step) => (

                    <div
                      key={step.id}
                    >

                      {
                        step.completed
                          ? "✓"
                          : "○"
                      }

                      {" "}

                      {step.title}

                    </div>

                  )
                )
              }


            </div>

          )
        )
      }




      <div className="task-notes">


        <h3>
          Notes
        </h3>



        {
          editingNotes ? (

            <>

              <textarea

                value={notes}

                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }

              />


              <button

                type="button"

                onClick={saveNotes}

              >

                Save Notes

              </button>


            </>


          ) : (

            <>


              <p>

                {
                  task.notes ||
                  "No notes added."
                }

              </p>



              <button

                type="button"

                onClick={startEditNotes}

              >

                Edit Notes

              </button>


            </>

          )

        }


      </div>




      <button

        type="button"

        onClick={() => {
            console.log("Reuse clicked", task);
          onReuseProtocol(task)
        }}

      >

        Reuse Protocol

      </button>



    </div>

  );

}