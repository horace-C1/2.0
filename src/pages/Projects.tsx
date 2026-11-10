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
} from "../services/projectStorage";


import {
  getTasks,
} from "../services/taskStorage";


import ProjectSelector from "../components/project/ProjectSelector";

import ProjectTaskList from "../components/project/ProjectTaskList";

import TaskDetail from "../components/project/TaskDetail";

import {
  updateTask,
} from "../services/taskStorage";

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

    setProjects(
      getProjects()
    );


    setTasks(
      getTasks()
    );


  }, []);

useEffect(() => {

  const {
    projectId,
    taskId,
  } = location.state || {};

  if (!projectId || !taskId) {
    return;
  }

  setSelectedProjectId(projectId);

  const targetTask =
    getTasks().find(
      (task) =>
        task.id === taskId
    );

  if (targetTask) {
    setSelectedTask(targetTask);
  }

}, [location.state]);



  const handleSelectProject = (
    projectId: string
  ) => {


    setSelectedProjectId(
      projectId
    );


    // clear old task selection

    setSelectedTask(
      null
    );

  };




  const handleSelectTask = (
    task: Task
  ) => {

    setSelectedTask(
      task
    );

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



<div className="project-workspace">


  <ProjectTaskList

    tasks={tasks}

    selectedProjectId={selectedProjectId}

    onSelectTask={handleSelectTask}

  />



<TaskDetail
  task={selectedTask}
  onUpdateTask={handleUpdateTask}
  onReuseProtocol={handleReuseProtocol}
  editNotes={editNotes}
/>


</div>


    </div>

  );

}