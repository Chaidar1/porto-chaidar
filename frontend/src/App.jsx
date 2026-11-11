import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/public/Home";
import Projects from "./pages/public/Projects";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ManageProjects from "./pages/admin/ManageProjects";
import ManageSkills from "./pages/admin/ManageSkills";
import ManageExperiences from "./pages/admin/ManageExperiences";
import ManageMessages from "./pages/admin/ManageMessages";
import ManageBackground from "./pages/admin/ManageBackground";
import ManageStats from "./pages/admin/ManageStats";
import ManageSocials from "./pages/admin/ManageSocials";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/common/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />

          {/* Admin */}
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/skills"
            element={
              <ProtectedRoute>
                <ManageSkills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/experiences"
            element={
              <ProtectedRoute>
                <ManageExperiences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/backgrounds"
            element={
              <ProtectedRoute>
                <ManageBackground />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <ProtectedRoute>
                <ManageStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/socials"
            element={
              <ProtectedRoute>
                <ManageSocials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute>
                <ManageMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute>
                <ManageProjects />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}