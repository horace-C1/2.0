import type { Project } from "../type/task";


const PROJECT_STORAGE_KEY =
  "protocol-tracker-projects";



export function getProjects(): Project[] {

  const data =
    localStorage.getItem(
      PROJECT_STORAGE_KEY
    );


  if (!data) {

    return [];

  }


  try {

    return JSON.parse(data) as Project[];

  } catch(error) {

    console.error(
      "Failed to load projects:",
      error
    );

    return [];

  }

}



function saveProjects(
  projects: Project[]
): void {

  localStorage.setItem(
    PROJECT_STORAGE_KEY,
    JSON.stringify(projects)
  );

}



export function saveProject(
  project: Project
): void {


  const projects =
    getProjects();


  projects.push(project);


  saveProjects(projects);

}

export function updateProject(project: Project): void {
  const projects = getProjects().map((item) =>
    item.id === project.id ? project : item
  );
  saveProjects(projects);
}
