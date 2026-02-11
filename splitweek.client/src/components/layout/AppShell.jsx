import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ChildProvider } from '../../context/ChildContext';
import { NotificationProvider } from '../../context/NotificationContext';

export default function AppShell() {
  return (
    <ChildProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
            <Sidebar />
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </NotificationProvider>
    </ChildProvider>
  );
}
