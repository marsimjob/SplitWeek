import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Circle, AlertTriangle, Plus, Send } from 'lucide-react';
import { packingApi } from '../../api/packingApi';
import { scheduleApi } from '../../api/scheduleApi';
import { toMonthParam } from '../../utils/dateHelpers';

export default function PackingChecklist({ childId, templates, onUpdate }) {
  const [instance, setInstance] = useState(null);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nextScheduleId, setNextScheduleId] = useState(null);

  // Find the next handoff schedule entry to create a packing instance for
  const loadNextHandoff = useCallback(async () => {
    try {
      const now = new Date();
      const monthParam = toMonthParam(now.getFullYear(), now.getMonth());
      const schedule = await scheduleApi.getSchedule(childId, monthParam);
      const handoff = schedule
        .filter((s) => s.isHandoffDay && new Date(s.date) >= now)
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      if (handoff) setNextScheduleId(handoff.id);
      return handoff;
    } catch {
      return null;
    }
  }, [childId]);

  // Load or create a packing instance
  const loadInstance = useCallback(async () => {
    setLoading(true);
    try {
      const handoff = await loadNextHandoff();
      if (!handoff) {
        // No upcoming handoff — show template items in local-only mode
        setItems((templates[0]?.items || []).map((item) => ({ ...item, isChecked: false })));
        setLoading(false);
        return;
      }

      // Check if an instance already exists for this schedule
      const instances = await packingApi.getInstance(childId, handoff.id);
      const existing = Array.isArray(instances) ? instances[0] : instances;

      if (existing) {
        setInstance(existing);
        setItems(existing.items || []);
      } else if (templates.length > 0) {
        // Create a new instance from the first template
        const result = await packingApi.createInstance(childId, {
          scheduleId: handoff.id,
          templateId: templates[0].id,
        });
        // Reload the instance to get items
        const fresh = await packingApi.getInstance(childId, handoff.id);
        const inst = Array.isArray(fresh) ? fresh[0] : fresh;
        setInstance(inst);
        setItems(inst?.items || []);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load packing instance:', err);
      // Fallback to template items
      setItems((templates[0]?.items || []).map((item) => ({ ...item, isChecked: false })));
    } finally {
      setLoading(false);
    }
  }, [childId, templates, loadNextHandoff]);

  useEffect(() => { loadInstance(); }, [loadInstance]);

  const totalItems = items.length;
  const checkedCount = items.filter((item) => item.isChecked).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const uncheckedCritical = items.filter((item) => item.isCritical && !item.isChecked);
  const isReady = instance?.status === 'Ready' || instance?.status === 'Confirmed';

  const toggleItem = async (item) => {
    if (!instance) return;
    setSaving(true);
    try {
      await packingApi.checkItem(instance.id, item.id, { isChecked: !item.isChecked });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isChecked: !i.isChecked } : i))
      );
    } catch (err) {
      console.error('Failed to toggle item:', err);
    } finally {
      setSaving(false);
    }
  };

  const addOneTimeItem = async () => {
    if (!newItem.trim() || !instance) return;
    setSaving(true);
    try {
      const result = await packingApi.addItem(instance.id, {
        itemName: newItem.trim(),
        isCritical: false,
      });
      setItems((prev) => [...prev, {
        id: result.id,
        itemName: newItem.trim(),
        isCritical: false,
        isOneTime: true,
        isChecked: false,
      }]);
      setNewItem('');
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReady = async () => {
    if (!instance) return;
    setSaving(true);
    try {
      await packingApi.markReady(instance.id);
      setInstance((prev) => ({ ...prev, status: 'Ready' }));
      onUpdate();
    } catch (err) {
      console.error('Failed to mark ready:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Next Handoff Packing List</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">{checkedCount}/{totalItems}</span>
          </div>
        </div>

        {uncheckedCritical.length > 0 && !isReady && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-sm text-red-700 font-medium">
              {uncheckedCritical.length} critical {uncheckedCritical.length === 1 ? 'item' : 'items'} not yet packed
            </span>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <label
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                item.isChecked ? 'bg-green-50' : item.isCritical ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <button onClick={() => toggleItem(item)} disabled={saving || isReady} className="shrink-0">
                {item.isChecked ? (
                  <CheckCircle size={22} className="text-green-500" />
                ) : (
                  <Circle size={22} className="text-gray-300" />
                )}
              </button>
              <span className={`flex-1 ${item.isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {item.itemName}
              </span>
              {item.isCritical && !item.isChecked && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Critical</span>
              )}
              {item.isOneTime && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">One-time</span>
              )}
            </label>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No items. Create a packing template first.</p>
          )}
        </div>

        {instance && !isReady && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOneTimeItem()}
              placeholder="Add one-time item..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <button onClick={addOneTimeItem} disabled={saving} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
              <Plus size={18} className="text-gray-600" />
            </button>
          </div>
        )}

        {isReady ? (
          <div className="w-full p-3 bg-green-100 text-green-700 rounded-lg font-medium text-center flex items-center justify-center gap-2">
            <CheckCircle size={18} /> Ready for Handoff!
          </div>
        ) : instance ? (
          <button
            onClick={handleMarkReady}
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={18} /> {saving ? 'Saving...' : 'Mark as Ready for Handoff'}
          </button>
        ) : (
          <p className="text-sm text-gray-500 text-center">No upcoming handoff found to pack for.</p>
        )}
      </div>
    </div>
  );
}
