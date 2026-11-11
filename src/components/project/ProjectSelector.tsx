import type { KeyboardEvent } from "react";
import type { Project } from "../../type/task";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
}

export default function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
}: ProjectSelectorProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + projects.length) % projects.length;
    const nextProject = projects[nextIndex];
    onSelectProject(nextProject.id);
    document.getElementById(`project-tab-${nextProject.id}`)?.focus();
  };

  if (projects.length === 0) {
    return <p className="project-tabs-empty">No projects yet.</p>;
  }

  return (
    <div className="project-tabs" role="tablist" aria-label="Projects">
      {projects.map((project, index) => (
        <button
          key={project.id}
          id={`project-tab-${project.id}`}
          type="button"
          role="tab"
          aria-selected={selectedProjectId === project.id}
          aria-controls="project-content"
          tabIndex={selectedProjectId === project.id ? 0 : -1}
          className={`project-tab${selectedProjectId === project.id ? " active" : ""}`}
          onClick={() => onSelectProject(project.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {project.name}
        </button>
      ))}
    </div>
  );
}
