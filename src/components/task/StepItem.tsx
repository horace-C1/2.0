import { useEffect, useRef } from "react";
import type { Step } from "../../type/task";

interface StepItemProps {
  step: Step;

  onUpdateStep: (
    id: string,
    update: Partial<Step>
  ) => void;

  onDeleteStep: (id: string) => void;

  onAddStep?: () => void;

  autoFocusAllowed?: boolean;
  defaultDate: string;
  showDateInput: boolean;
}


export default function StepItem({
  step,
  onUpdateStep,
  onDeleteStep,
  onAddStep,
  autoFocusAllowed = true,
  defaultDate,
  showDateInput,
}: StepItemProps) {


  const inputRef =
  useRef<HTMLInputElement>(null);

  useEffect(() => {

  if(step.title === "" && autoFocusAllowed) {

    inputRef.current?.focus();

  }

}, []);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {

    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !e.metaKey) {

      e.preventDefault();

      // The parent component will handle creating
      // the new step.
      onUpdateStep(step.id, {
        title: step.title.trim(),
      });
      onAddStep?.();
    }

  };


  return (
    <div className="step-item">

      <input
        type="checkbox"
        checked={step.completed}
        onChange={(e) =>
          onUpdateStep(step.id, {
            completed: e.target.checked,
          })
        }
      />


      <input
        ref={inputRef}
        className="step-title"
        type="text"
        placeholder="New step..."
        value={step.title}
        onChange={(e) =>
          onUpdateStep(step.id, {
            title: e.target.value,
          })
        }
        onKeyDown={handleKeyDown}
      />

      {showDateInput && (
        <input
          className="step-date"
          type="date"
          aria-label="Step date"
          value={step.scheduledDate ?? defaultDate}
          onChange={(e) => onUpdateStep(step.id, {
            scheduledDate: e.target.value === defaultDate ? undefined : e.target.value,
          })}
        />
      )}


      <button
        type="button"
        className="delete-step"
        onClick={() =>
          onDeleteStep(step.id)
        }
      >
        ×
      </button>

    </div>
  );
}
