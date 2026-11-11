import { useState, type FormEvent } from "react";
import type { Project, ProjectActionItem } from "../../type/task";

interface ProjectOverviewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export default function ProjectOverview({ project, onUpdateProject }: ProjectOverviewProps) {
  const [newActionItem, setNewActionItem] = useState("");
  const actionItems = project.actionItems ?? [];

  const updateActionItem = (id: string, update: Partial<ProjectActionItem>) => {
    onUpdateProject({
      ...project,
      actionItems: actionItems.map((item) => item.id === id ? { ...item, ...update } : item),
    });
  };

  const addActionItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = newActionItem.trim();
    if (!text) return;
    onUpdateProject({
      ...project,
      actionItems: [...actionItems, { id: crypto.randomUUID(), text, completed: false }],
    });
    setNewActionItem("");
  };

  return (
    <section className="project-overview" id="project-section-content" role="tabpanel" aria-labelledby="project-section-tab-overview">
      <div className="project-overview-section">
        <h2>Overall progress</h2>
        <textarea
          className="project-progress-notes"
          aria-label={`Overall progress for ${project.name}`}
          placeholder="Write a brief update on where this project stands…"
          value={project.progressNotes ?? ""}
          onChange={(event) => onUpdateProject({ ...project, progressNotes: event.target.value })}
        />
        <p className="project-autosave-note">Saved automatically</p>
      </div>

      <div className="project-overview-section">
        <h2>Action items</h2>
        <form className="project-action-form" onSubmit={addActionItem}>
          <input
            aria-label="New action item"
            placeholder="Add an action item"
            value={newActionItem}
            onChange={(event) => setNewActionItem(event.target.value)}
          />
          <button type="submit" disabled={!newActionItem.trim()}>Add</button>
        </form>

        {actionItems.length === 0 ? (
          <p className="project-empty-actions">No action items yet.</p>
        ) : (
          <ul className="project-action-list">
            {actionItems.map((item) => (
              <li key={item.id} className={item.completed ? "completed" : ""}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(event) => updateActionItem(item.id, { completed: event.target.checked })}
                  />
                  <span>{item.text}</span>
                </label>
                <button
                  type="button"
                  className="project-action-remove"
                  aria-label={`Remove action item: ${item.text}`}
                  onClick={() => onUpdateProject({
                    ...project,
                    actionItems: actionItems.filter((action) => action.id !== item.id),
                  })}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
