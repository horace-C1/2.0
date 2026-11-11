import type { Day, Step } from "../../type/task";
import StepItem from "./StepItem";


interface DayCardProps {

  day: Day;

  onUpdateDay: (
    dayId: string,
    updatedDay: Partial<Day>
  ) => void;

  autoFocusAllowed: boolean;

}


export default function DayCard({
  day,
  onUpdateDay,
  autoFocusAllowed,
}: DayCardProps) {


  const addStep = () => {

    const newStep: Step = {
      id: crypto.randomUUID(),
      title: "",
      completed: false,
    };


    onUpdateDay(day.id, {
      steps: [
        ...day.steps,
        newStep,
      ],
    });

  };


  const updateStep = (
    stepId: string,
    update: Partial<Step>
  ) => {

    const updatedSteps =
      day.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              ...update,
            }
          : step
      );


    onUpdateDay(day.id, {
      steps: updatedSteps,
    });

  };


  const deleteStep = (
    stepId: string
  ) => {

    const updatedSteps =
      day.steps.filter(
        (step) =>
          step.id !== stepId
      );


    onUpdateDay(day.id, {
      steps: updatedSteps,
    });

  };


  return (

    <div className="day-card">

      <div className="step-list">

        {day.steps.map((step) => (

          <StepItem
            key={step.id}
            step={step}
            autoFocusAllowed={autoFocusAllowed}
            onUpdateStep={
              updateStep
            }
            onDeleteStep={
              deleteStep
            }
            onAddStep={
              addStep
            }
          />

        ))}

      </div>


      <button
        type="button"
        className="add-step"
        onClick={addStep}
      >
        + Add Step
      </button>


    </div>

  );

}
