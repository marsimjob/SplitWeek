import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import InviteAcceptPage from './components/auth/InviteAcceptPage';
import CalendarPage from './components/calendar/CalendarPage';
import PackingPage from './components/packing/PackingPage';
import MessagesPage from './components/messages/MessagesPage';
import ChildProfilePage from './components/children/ChildProfilePage';
import ScheduleChangesPage from './components/schedule-changes/ScheduleChangesPage';
import ReminderSettings from './components/reminders/ReminderSettings';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/packing" element={<PackingPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/child/:childId" element={<ChildProfilePage />} />
            <Route path="/child" element={<ChildProfilePage />} />
            <Route path="/schedule-changes" element={<ScheduleChangesPage />} />
            <Route path="/reminders" element={<ReminderSettings />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
