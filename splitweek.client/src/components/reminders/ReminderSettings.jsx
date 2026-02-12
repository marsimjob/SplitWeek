import { useState, useEffect, useCallback } from 'react';
import { Clock, Bell, Trash2 } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { remindersApi } from '../../api/remindersApi';
import { scheduleApi } from '../../api/scheduleApi';
import { childrenApi } from '../../api/childrenApi';
import { useCountdown } from '../../hooks/useCountdown';
import { toMonthParam } from '../../utils/dateHelpers';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';

const PRESETS = [
  { label: '24 hours before', minutes: 1440 },
  { label: '2 hours before', minutes: 120 },
  { label: '30 minutes before', minutes: 30 },
];

export default function ReminderSettings() {
  const { selectedChild } = useChild();
  const [reminders, setReminders] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nextHandoff, setNextHandoff] = useState(null);
  const [otherParent, setOtherParent] = useState(null);

  const loadReminders = useCallback(async () => {
    if (!selectedChild) return;
    setLoading(true);
    try {
      const data = await remindersApi.getReminders(selectedChild.id, true);
      setReminders(data);
      // Detect which presets are already active
      const activeMinutes = new Set(
        data.filter((r) => r.type === 'HandoffReminder').map((r) => r.intervalMinutes)
      );
      setSelected(activeMinutes);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedChild]);

  // Load next handoff for the child-friendly countdown
  useEffect(() => {
    if (!selectedChild) return;
    const now = new Date();
    const monthParam = toMonthParam(now.getFullYear(), now.getMonth());
    Promise.all([
      scheduleApi.getSchedule(selectedChild.id, monthParam),
      childrenApi.getParents(selectedChild.id),
    ]).then(([schedule, parents]) => {
      const handoff = schedule
        .filter((s) => s.isHandoffDay && new Date(s.date) >= now)
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      setNextHandoff(handoff || null);
      const other = parents.find((p) => p.id !== handoff?.assignedParentId);
      setOtherParent(other || parents[1] || null);
    }).catch(console.error);
  }, [selectedChild]);

  useEffect(() => { loadReminders(); }, [loadReminders]);

  const togglePreset = (minutes) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(minutes)) next.delete(minutes);
      else next.add(minutes);
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedChild) return;
    setSaving(true);
    try {
      // Delete existing HandoffReminder reminders
      const existing = reminders.filter((r) => r.type === 'HandoffReminder');
      await Promise.all(existing.map((r) => remindersApi.deleteReminder(r.id)));

      // Create new ones for each selected preset
      const preset = PRESETS.filter((p) => selected.has(p.minutes));
      await Promise.all(
        preset.map((p) =>
          remindersApi.createReminder(selectedChild.id, {
            type: 'HandoffReminder',
            message: `Handoff in ${p.label.toLowerCase()}`,
            triggerAt: new Date().toISOString(),
            intervalMinutes: p.minutes,
          })
        )
      );

      await loadReminders();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save reminders:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await remindersApi.dismiss(id);
      await loadReminders();
    } catch (err) {
      console.error('Failed to dismiss:', err);
    }
  };

  // Countdown for child-friendly view
  const handoffDate = nextHandoff
    ? nextHandoff.handoffTime
      ? `${nextHandoff.date}T${nextHandoff.handoffTime}`
      : `${nextHandoff.date}T18:00:00`
    : null;
  const { days } = useCountdown(handoffDate);

  if (!selectedChild) return <EmptyState icon={Clock} title="No child profile" />;
  if (loading) return <LoadingSpinner />;

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
          {PRESETS.map((preset) => (
            <label key={preset.minutes} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(preset.minutes)}
                onChange={() => togglePreset(preset.minutes)}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-gray-900">{preset.label}</span>
                <p className="text-xs text-gray-500">Get notified {preset.label.toLowerCase()} each handoff</p>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Reminder Settings'}
        </button>
      </div>

      {/* Active reminders */}
      {reminders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Active Reminders</h3>
          <div className="space-y-2">
            {reminders.filter((r) => !r.isDismissed).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.message}</p>
                  <p className="text-xs text-gray-500">{r.type}</p>
                </div>
                <button onClick={() => handleDismiss(r.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Child-friendly countdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-indigo-600" />
          Child-Friendly View
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Show this to your child to help them know what's coming up.
        </p>
        {nextHandoff ? (
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🌙</div>
            <div className="text-3xl font-bold text-indigo-800 mb-2">
              {days} {days === 1 ? 'sleep' : 'sleeps'}
            </div>
            <div className="text-lg text-indigo-600">
              until {otherParent ? `${otherParent.firstName}'s` : "the other parent's"} house!
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <p className="text-gray-500">No upcoming handoff scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
}
