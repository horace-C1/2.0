import type {
  Day,
  Step,
} from "../../type/task";

import DayCard from "./DayCard";


interface TimelineEditorProps {

  timeline: Day[];

  startDate: string;

  onAddDay?: () => void;

  onUpdateTimeline: (
    timeline: Day[]
  ) => void;

}



export default function TimelineEditor({

  timeline,

  startDate,

  onAddDay,

  onUpdateTimeline,

}: TimelineEditorProps) {

  const getDateAtOffset = (dateString: string, offset: number) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };



  const createInitialStep = (): Step => ({

    id: crypto.randomUUID(),

    title: "",

    completed: false,

  });



  const updateDay = (

    dayId: string,

    update: Partial<Day>

  ) => {


    const updatedTimeline =

      timeline.map((day) =>

        day.id === dayId

          ? {

              ...day,

              ...update,

            }

          : day

      );



    onUpdateTimeline(
      updatedTimeline
    );

  };





  const addDay = () => {

    if (onAddDay) {
      onAddDay();
      return;
    }


    const newDay: Day = {


      id:

        crypto.randomUUID(),



      // Internal:
      // 0 = D1
      // 1 = D2

      offset:

        timeline.length,

      date: getDateAtOffset(startDate, timeline.length),



      steps: [

        createInitialStep()

      ],


    };



    onUpdateTimeline([

      ...timeline,

      newDay,

    ]);

  };





  const deleteDay = (

    dayId: string

  ) => {



    const updatedTimeline =

      timeline

        .filter(

          (day) =>

            day.id !== dayId

        )


        .map(

          (day, index) => ({

            ...day,

            offset:index,

          })

        );



    onUpdateTimeline(

      updatedTimeline

    );

  };





  return (

    <div className="timeline-editor">


      <h2>
        Protocol Timeline
      </h2>



      <div className="timeline-list">


        {

          timeline.map((day) => (


            <div

              key={day.id}

              className="timeline-day"

            >

              <div className="day-header">

                <h3>
                  Day {day.offset + 1}
                </h3>


                <button

                  type="button"

                  className="delete-day"

                  onClick={() =>
                    deleteDay(day.id)
                  }

                >

                  Delete Day

                </button>


              </div>



              <DayCard

                day={day}

                onUpdateDay={
                  updateDay
                }

              />


            </div>


          ))

        }


      </div>





      <button

        type="button"

        className="add-day"

        onClick={addDay}

      >

        + Add Day

      </button>



    </div>

  );

}
