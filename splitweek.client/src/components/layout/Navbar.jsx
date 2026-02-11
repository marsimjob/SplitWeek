import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChild } from '../../context/ChildContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { selectedChild, children, setSelectedChild } = useChild();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Split Week</h1>
              </div>
            </Link>

            {selectedChild && (
              <div className="relative ml-4">
                <button
                  onClick={() => setShowChildPicker(!showChildPicker)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100"
                >
                  {selectedChild.firstName}'s Schedule
                  {children.length > 1 && <ChevronDown size={14} />}
                </button>
                {showChildPicker && children.length > 1 && (
                  <div className="absolute top-full mt-1 left-0 bg-white shadow-lg rounded-lg border py-1 min-w-[160px]">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => { setSelectedChild(child); setShowChildPicker(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          child.id === selectedChild.id ? 'text-indigo-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {child.firstName} {child.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-gray-600">{user?.firstName}</span>
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
