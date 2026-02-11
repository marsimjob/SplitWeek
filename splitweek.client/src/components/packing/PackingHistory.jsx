import { CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateHelpers';
import EmptyState from '../shared/EmptyState';
import { History } from 'lucide-react';

export default function PackingHistory({ history }) {
  if (!history || history.length === 0) {
    return <EmptyState icon={History} title="No packing history yet" description="History will appear after your first handoff." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {history.map((instance) => {
        const total = instance.items?.length || 0;
        const checked = instance.items?.filter((i) => i.isChecked).length || 0;
        const allPacked = total > 0 && checked === total;

        return (
          <div key={instance.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            {allPacked ? (
              <CheckCircle size={24} className="text-green-500 shrink-0" />
            ) : (
              <XCircle size={24} className="text-amber-500 shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-medium text-gray-900">{formatDate(instance.scheduleDate || instance.createdAt)}</div>
              <div className="text-sm text-gray-500">
                {checked}/{total} items packed &middot; Packed by {instance.packedByName}
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              instance.status === 'Ready' ? 'bg-green-100 text-green-700' :
              instance.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {instance.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
