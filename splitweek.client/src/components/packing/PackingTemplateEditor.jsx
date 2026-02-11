import { useState } from 'react';
import { Plus, Trash2, Star, Save } from 'lucide-react';
import { packingApi } from '../../api/packingApi';

export default function PackingTemplateEditor({ childId, templates, onUpdate }) {
  const [editing, setEditing] = useState(templates[0] || null);
  const [name, setName] = useState(editing?.name || 'Standard Pack');
  const [items, setItems] = useState(editing?.items || []);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems([...items, { itemName: newItem.trim(), isCritical: false, sortOrder: items.length }]);
    setNewItem('');
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const toggleCritical = (idx) =>
    setItems(items.map((item, i) => (i === idx ? { ...item, isCritical: !item.isCritical } : item)));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing?.id) {
        await packingApi.updateTemplate(editing.id, { name, items });
      } else {
        await packingApi.createTemplate(childId, { name, isDefault: true, items });
      }
      onUpdate();
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Packing Template</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="space-y-2 mb-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="flex-1 text-sm text-gray-700">{item.itemName}</span>
              <button
                onClick={() => toggleCritical(idx)}
                className={`p-1 rounded ${item.isCritical ? 'text-red-500' : 'text-gray-300'}`}
                title={item.isCritical ? 'Critical item' : 'Mark as critical'}
              >
                <Star size={16} fill={item.isCritical ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => removeItem(idx)} className="p-1 text-gray-400 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add item..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button onClick={addItem} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Plus size={18} className="text-gray-600" />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  );
}
