import { useState } from "react";
import type { Project } from "../../type/task";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (projectName: string) => void;
}

export default function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
}: ProjectSelectorProps) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const handleCreateProject = () => {
    const name = newProjectName.trim();

    if (!name) return;

    onCreateProject(name);

    setNewProjectName("");
    setShowNewProject(false);
  };

  return (
    <div className="project-selector">

      <label>Project</label>

      {!showNewProject ? (
        <select
          value={selectedProjectId}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setShowNewProject(true);
            } else {
              onSelectProject(e.target.value);
            }
          }}
        >
          <option value="">Select a Project</option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}

          <option value="__new__">
            + Create New Project
          </option>

        </select>
      ) : (
        <div className="new-project-container">

          <input
            type="text"
            placeholder="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            autoFocus
          />

          <div className="button-group">

            <button
              type="button"
              onClick={handleCreateProject}
            >
              Create
            </button>

            <button
              type="button"
              onClick={() => {
                setShowNewProject(false);
                setNewProjectName("");
              }}
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    </div>
  );
}