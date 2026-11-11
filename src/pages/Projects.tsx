import { useEffect, useState } from "react";

import type {
  Project,
  Task,
} from "../type/task";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  getProjects,
  updateProject,
} from "../services/projectStorage";


import {
  getTasks,
} from "../services/taskStorage";


import ProjectSelector from "../components/project/ProjectSelector";

import ProjectTaskList from "../components/project/ProjectTaskList";

import TaskDetail from "../components/project/TaskDetail";
import ProjectOverview from "../components/project/ProjectOverview";

import {
  updateTask,
} from "../services/taskStorage";

const PROJECT_VIEW_KEY = "protocol-tracker-project-view";

type SavedProjectView = {
  lastProjectId?: string;
  lastTaskByProject?: Record<string, string>;
  lastSection?: "tasks" | "overview";
};

const readSavedProjectView = (): SavedProjectView => {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_VIEW_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveProjectView = (
  projectId: string,
  taskId: string | null,
  section?: "tasks" | "overview"
) => {
  const previous = readSavedProjectView();
  localStorage.setItem(PROJECT_VIEW_KEY, JSON.stringify({
    lastProjectId: projectId,
    lastSection: section ?? previous.lastSection ?? "tasks",
    lastTaskByProject: {
      ...(previous.lastTaskByProject ?? {}),
      ...(taskId ? { [projectId]: taskId } : {}),
    },
  }));
};

export default function Projects() {

  const navigate = useNavigate();

  const location = useLocation();

  const editNotes =
  location.state?.editNotes === true;
  
  const [projects, setProjects] =
    useState<Project[]>([]);



  const [tasks, setTasks] =
    useState<Task[]>([]);



  const [selectedProjectId, setSelectedProjectId] =
    useState("");

  const [projectSection, setProjectSection] =
    useState<"tasks" | "overview">("tasks");

  const handleUpdateProject = (updatedProject: Project) => {
    updateProject(updatedProject);
    setProjects((current) => current.map((project) =>
      project.id === updatedProject.id ? updatedProject : project
    ));
  };

  const handleUpdateTask = (
  updatedTask: Task
) => {

  updateTask(updatedTask);


  setTasks(
    tasks.map((task) =>
      task.id === updatedTask.id
        ? updatedTask
        : task
    )
  );


  setSelectedTask(
    updatedTask
  );

};

  const [selectedTask, setSelectedTask] =
    useState<Task | null>(null);




  useEffect(() => {
    const loadedProjects = getProjects();
    const loadedTasks = getTasks();
    const savedView = readSavedProjectView();
    const requestedProjectId = location.state?.projectId;
    const requestedTaskId = location.state?.taskId;

    setProjects(loadedProjects);
    setTasks(loadedTasks);

    const requestedProjectView = Boolean(location.state?.projectId && location.state?.taskId);
    const requestedSection = location.state?.section;
    const restoredSection = requestedSection === "tasks" || requestedSection === "overview"
      ? requestedSection
      : requestedProjectView
        ? "tasks"
        : savedView.lastSection ?? "tasks";
    setProjectSection(restoredSection);

    const projectId = loadedProjects.find((project) => project.id === requestedProjectId)?.id
      ?? loadedProjects.find((project) => project.id === savedView.lastProjectId)?.id
      ?? loadedProjects[0]?.id
      ?? "";

    setSelectedProjectId(projectId);

    const projectTasks = loadedTasks
      .filter((task) => task.projectId === projectId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const preferredTaskId = requestedProjectId === projectId && requestedTaskId
      ? requestedTaskId
      : savedView.lastTaskByProject?.[projectId];

    const selected = projectTasks.find((task) => task.id === preferredTaskId)
      ?? projectTasks[0]
      ?? null;

    setSelectedTask(selected);
    if (projectId) saveProjectView(projectId, selected?.id ?? null, restoredSection);
  }, [location.state]);



  const handleSelectProject = (
    projectId: string
  ) => {
    setSelectedProjectId(
      projectId
    );
    const projectTasks = tasks
      .filter((task) => task.projectId === projectId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const savedTaskId = readSavedProjectView().lastTaskByProject?.[projectId];
    const nextTask = projectTasks.find((task) => task.id === savedTaskId)
      ?? projectTasks[0]
      ?? null;
    setSelectedTask(nextTask);
    saveProjectView(projectId, nextTask?.id ?? null, projectSection);
  };




  const handleSelectTask = (
    task: Task
  ) => {

    setSelectedTask(
      task
    );
    saveProjectView(selectedProjectId, task.id, projectSection);

  };

  const handleSelectSection = (section: "tasks" | "overview") => {
    setProjectSection(section);
    if (selectedProjectId) {
      saveProjectView(selectedProjectId, selectedTask?.id ?? null, section);
    }
  };





const handleReuseProtocol = (
  task: Task
) => {

  console.log(
    "Sending to create page",
    task
  );


  navigate(
    "/tasks",
    {
      state:{
        templateTask: task,
      },
    }
  );

};

const selectedProject = projects.find((project) => project.id === selectedProjectId);



  return (

    <div className="projects-page">


      <h1>
        Projects
      </h1>



      <ProjectSelector

        projects={
          projects
        }


        selectedProjectId={
          selectedProjectId
        }


        onSelectProject={
          handleSelectProject
        }

      />



<div
  id="project-content"
  className="project-content"
  role="tabpanel"
  aria-labelledby={selectedProjectId ? `project-tab-${selectedProjectId}` : undefined}
>
  {selectedProject && (
    <>
      <div className="project-view-tabs" role="tablist" aria-label="Project sections">
        <button
          id="project-section-tab-tasks"
          type="button"
          role="tab"
          aria-selected={projectSection === "tasks"}
          aria-controls="project-section-content"
          className={projectSection === "tasks" ? "active" : ""}
          onClick={() => handleSelectSection("tasks")}
        >
          Tasks
        </button>
        <button
          id="project-section-tab-overview"
          type="button"
          role="tab"
          aria-selected={projectSection === "overview"}
          aria-controls="project-section-content"
          className={projectSection === "overview" ? "active" : ""}
          onClick={() => handleSelectSection("overview")}
        >
          Overview
        </button>
      </div>

      {projectSection === "overview" ? (
        <ProjectOverview
          project={selectedProject}
          onUpdateProject={handleUpdateProject}
        />
      ) : (
        <div
          className="project-workspace"
          id="project-section-content"
          role="tabpanel"
          aria-labelledby="project-section-tab-tasks"
        >
          <ProjectTaskList
            tasks={tasks}
            selectedProjectId={selectedProjectId}
            selectedTaskId={selectedTask?.id ?? null}
            onSelectTask={handleSelectTask}
          />
          <TaskDetail
            task={selectedTask}
            onUpdateTask={handleUpdateTask}
            onReuseProtocol={handleReuseProtocol}
            editNotes={editNotes}
          />
        </div>
      )}
    </>
  )}
</div>


    </div>

  );

}
