import { NavLink } from 'react-router-dom';
import { Calendar, Package, MessageSquare, UserCircle, ArrowLeftRight, Clock, Settings } from 'lucide-react';
import { useChild } from '../../context/ChildContext';

const navItems = [
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/packing', label: 'Packing List', icon: Package },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/schedule-changes', label: 'Schedule Changes', icon: ArrowLeftRight },
  { to: '/reminders', label: 'Reminders', icon: Clock },
];

export default function Sidebar() {
  const { selectedChild } = useChild();

  return (
    <nav className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-[65px] space-y-1 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {selectedChild && (
          <>
            <div className="border-t border-gray-200 my-3" />
            <NavLink
              to={`/child/${selectedChild.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <UserCircle size={18} />
              {selectedChild.firstName}'s Profile
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
