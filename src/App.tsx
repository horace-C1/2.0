import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Templates from "./pages/Templates";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Daily from "./pages/Daily";


function App() {

  return (

    <BrowserRouter>

      <Layout>

        <Routes>

          <Route
            path="/"
            element={<Dashboard />}
          />


          <Route
            path="/tasks"
            element={<Tasks />}
          />


          <Route
            path="/projects"
            element={<Projects />}
          />


          <Route
            path="/templates"
            element={<Templates />}
          />


          <Route
            path="/calendar"
            element={<Calendar />}
          />


          <Route
            path="/settings"
            element={<Settings />}
          />
          
          <Route
            path="/daily"
            element={<Daily />}
          />

        </Routes>

      </Layout>

    </BrowserRouter>

  );

}


export default App;
