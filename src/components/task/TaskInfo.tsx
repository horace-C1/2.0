import type { ChangeEvent } from "react";


interface TaskInfoProps {

  taskName: string;

  startDate: string;

  onTaskNameChange: (
    value: string
  ) => void;


  onStartDateChange: (
    value: string
  ) => void;

}



export default function TaskInfo({

  taskName,

  startDate,

  onTaskNameChange,

  onStartDateChange,

}: TaskInfoProps) {



  return (

    <div className="task-info">


      <h2>
        Task Information
      </h2>



      <div>

        <label>
          Task Name
        </label>


        <input

          type="text"

          value={
            taskName
          }


          onChange={
            (
              e: ChangeEvent<HTMLInputElement>
            ) =>
              onTaskNameChange(
                e.target.value
              )
          }


          placeholder="Enter task name"

        />

      </div>




      <div>

        <label>
          Start Date
        </label>


        <input

          type="date"

          value={
            startDate
          }


          onChange={
            (
              e: ChangeEvent<HTMLInputElement>
            ) =>
              onStartDateChange(
                e.target.value
              )
          }

        />

      </div>


    </div>

  );

}