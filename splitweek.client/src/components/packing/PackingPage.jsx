import { useState, useEffect } from 'react';
import { Package, Plus, History } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { packingApi } from '../../api/packingApi';
import PackingChecklist from './PackingChecklist';
import PackingTemplateEditor from './PackingTemplateEditor';
import PackingHistory from './PackingHistory';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';

export default function PackingPage() {
  const { selectedChild } = useChild();
  const [view, setView] = useState('checklist');
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!selectedChild) return;
    setLoading(true);
    try {
      const [t, h] = await Promise.all([
        packingApi.getTemplates(selectedChild.id),
        packingApi.getHistory(selectedChild.id),
      ]);
      setTemplates(t);
      setHistory(h);
    } catch (err) {
      console.error('Failed to load packing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedChild]);

  if (!selectedChild) return <EmptyState icon={Package} title="No child profile" description="Create a child profile first." />;
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {[
          { key: 'checklist', label: 'Packing List', icon: Package },
          { key: 'templates', label: 'Templates', icon: Plus },
          { key: 'history', label: 'History', icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              view === key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {view === 'checklist' && (
        <PackingChecklist childId={selectedChild.id} templates={templates} onUpdate={loadData} />
      )}
      {view === 'templates' && (
        <PackingTemplateEditor childId={selectedChild.id} templates={templates} onUpdate={loadData} />
      )}
      {view === 'history' && <PackingHistory history={history} />}
    </div>
  );
}
