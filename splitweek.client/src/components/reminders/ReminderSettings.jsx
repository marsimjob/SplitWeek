import { useState, useEffect } from 'react';
import { Clock, Bell, Plus, Trash2 } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useCountdown } from '../../hooks/useCountdown';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';

export default function ReminderSettings() {
  const { selectedChild } = useChild();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  const presets = [
    { label: '24 hours before', minutes: 1440 },
    { label: '2 hours before', minutes: 120 },
    { label: '30 minutes before', minutes: 30 },
  ];

  if (!selectedChild) return <EmptyState icon={Clock} title="No child profile" />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Bell size={20} className="text-indigo-600" />
          Handoff Reminders
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Set up automatic reminders before custody handoffs.
        </p>

        <div className="space-y-3">
          {presets.map((preset) => (
            <label key={preset.minutes} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={preset.minutes === 1440 || preset.minutes === 120}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-gray-900">{preset.label}</span>
                <p className="text-xs text-gray-500">Get notified {preset.label.toLowerCase()} each handoff</p>
              </div>
            </label>
          ))}
        </div>

        <button className="w-full mt-6 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Save Reminder Settings
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-indigo-600" />
          Child-Friendly View
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Show this to your child to help them know what's coming up.
        </p>
        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🌙</div>
          <div className="text-3xl font-bold text-indigo-800 mb-2">
            3 sleeps
          </div>
          <div className="text-lg text-indigo-600">
            until Dad's house!
          </div>
        </div>
      </div>
    </div>
  );
}
