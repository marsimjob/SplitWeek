import { useState } from 'react';
import { CheckCircle, Circle, AlertTriangle, Plus, Send } from 'lucide-react';
import { packingApi } from '../../api/packingApi';

export default function PackingChecklist({ childId, templates, onUpdate }) {
  const [items, setItems] = useState(templates[0]?.items || []);
  const [checkedItems, setCheckedItems] = useState({});
  const [newItem, setNewItem] = useState('');
  const [ready, setReady] = useState(false);

  const totalItems = items.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const uncheckedCritical = items.filter((item) => item.isCritical && !checkedItems[item.id || item.itemName]);

  const toggleItem = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addOneTimeItem = () => {
    if (!newItem.trim()) return;
    setItems((prev) => [...prev, { id: `temp-${Date.now()}`, itemName: newItem.trim(), isCritical: false, isOneTime: true }]);
    setNewItem('');
  };

  const handleMarkReady = () => {
    setReady(true);
  };

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

        {uncheckedCritical.length > 0 && !ready && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-sm text-red-700 font-medium">
              {uncheckedCritical.length} critical {uncheckedCritical.length === 1 ? 'item' : 'items'} not yet packed
            </span>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {items.map((item) => {
            const id = item.id || item.itemName;
            const checked = checkedItems[id];
            return (
              <label
                key={id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  checked ? 'bg-green-50' : item.isCritical ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <button onClick={() => toggleItem(id)} className="shrink-0">
                  {checked ? (
                    <CheckCircle size={22} className="text-green-500" />
                  ) : (
                    <Circle size={22} className="text-gray-300" />
                  )}
                </button>
                <span className={`flex-1 ${checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.itemName}
                </span>
                {item.isCritical && !checked && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Critical</span>
                )}
                {item.isOneTime && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">One-time</span>
                )}
              </label>
            );
          })}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addOneTimeItem()}
            placeholder="Add one-time item..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button onClick={addOneTimeItem} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Plus size={18} className="text-gray-600" />
          </button>
        </div>

        {ready ? (
          <div className="w-full p-3 bg-green-100 text-green-700 rounded-lg font-medium text-center flex items-center justify-center gap-2">
            <CheckCircle size={18} /> Ready for Handoff!
          </div>
        ) : (
          <button
            onClick={handleMarkReady}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Send size={18} /> Mark as Ready for Handoff
          </button>
        )}
      </div>
    </div>
  );
}
