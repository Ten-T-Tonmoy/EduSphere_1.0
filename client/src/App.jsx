import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuth, AuthProvider } from "./context/Authcontext.jsx";
import "./index.css";

import LoginPage from "./pages/Auth/Loginpage.jsx";
import RegisterPage from "./pages/Auth/Registerpage";
import DashboardPage from "./pages/DashBoard/Dashboardpage.jsx";
import ClassroomPage from "./pages/Classroompage";
import SchedulePage from "./pages/OwnSchedule/Schedulepage.jsx";
import AttendancePage from "./pages/Attendancepage";
import ChatPage from "./pages/Chatpage";
import NoticesPage from "./pages/Noticespage";
import TasksPage from "./pages/Taskspage";
import ExpensesPage from "./pages/Expensespage";
import SyllabusPage from "./pages/Syllabuspage";
import CalendarPage from "./pages/Calendarpage";
import ProfilePage from "./pages/Profilepage";
import Layout from "./components/common/Layout";
import DepartmentSchedulePage from "./pages/WholeRoutine/DepartmentSchedulePage.jsx";
import ExtraClassRequestPage from "./pages/ExtraClassRequestPage.jsx";
import UnderConstructionDetailed from "./components/common/UnderConstruction.jsx";
import StatPage from "./pages/Stats/StatPage.jsx";
import TestPage from "./pages/Stats/TestPage.jsx";

import SettingsPage from "./pages/SettingsPage.jsx";

import NotesPage from "./pages/notes/page/NotesPage.jsx";
import ManageGroupsPage from "./pages/ManageGroupsPage.jsx";

import ContributorsPage from "./pages/Contributors/ContributorsPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";

import DocumentationPage from "./pages/DocumentationPage.jsx";

import ResetPasswordPage from "./pages/Auth/ResetPasswordPage.jsx";
import SetNewPasswordPage from "./pages/Auth/SetNewPasswordPage.jsx";
import UniLifeLoader from "./components/Loader/UniLifeLoader.jsx";
import NotificationLogPage from "./modules/notifications/components/NotificationLogPage.jsx";

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex min-h-svh items-center justify-center">
        <UniLifeLoader size="1.5" />
      </div>
    );
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/contributors" element={<ContributorsPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password/:token" element={<SetNewPasswordPage />} />
        {/* PROTECTED ROUTES (Wrapped in PrivateRoute and Layout) */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Dashboard is the index for authenticated users */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="classroom/:id" element={<ClassroomPage />} />
          <Route path="dept-schedule" element={<DepartmentSchedulePage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="stats/:id" element={<StatPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="extra-requests" element={<ExtraClassRequestPage />} />
          <Route path="notfound" element={<UnderConstructionDetailed />} />

          <Route path="notes/:classroomId" element={<NotesPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="manage-groups" element={<ManageGroupsPage />} />

          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:classroomId" element={<ChatPage />} />

          <Route path="notices/:classroomId" element={<NoticesPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="test" element={<TestPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="syllabus/:classroomId" element={<SyllabusPage />} />
          <Route path="calendar/:classroomId" element={<CalendarPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="notifications" element={<NotificationLogPage />} />
        </Route>

        {/* CATCH-ALL REDIRECT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
