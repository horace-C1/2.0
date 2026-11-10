import type { Project } from "../../type/task";


interface ProjectSelectorProps {

  projects: Project[];

  selectedProjectId: string;

  onSelectProject: (
    id: string
  ) => void;

}



export default function ProjectSelector({

  projects,

  selectedProjectId,

  onSelectProject,

}: ProjectSelectorProps) {


  return (

    <select

      value={selectedProjectId}

      onChange={(e) =>
        onSelectProject(
          e.target.value
        )
      }

    >

      <option value="">

        Select Project

      </option>


      {
        projects.map(
          (project) => (

            <option

              key={project.id}

              value={project.id}

            >

              {project.name}

            </option>

          )
        )
      }


    </select>

  );

}