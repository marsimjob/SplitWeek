import { useState } from 'react';
import { Check, MapPin, Clock } from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { formatDate } from '../../utils/dateHelpers';

export default function DayDetail({ entry, childId, onUpdate }) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirmHandoff = async () => {
    setConfirming(true);
    try {
      await scheduleApi.confirmHandoff(childId, entry.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to confirm handoff:', err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-4">{formatDate(entry.date)}</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${entry.assignedParentName?.includes('A') ? 'bg-blue-500' : 'bg-purple-500'}`} />
          <span className="text-sm font-medium text-gray-700">
            {entry.assignedParentName || 'Assigned Parent'}
          </span>
        </div>

        {entry.handoffTime && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={14} /> Handoff at {entry.handoffTime}
          </div>
        )}

        {entry.handoffLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} /> {entry.handoffLocation}
          </div>
        )}

        {entry.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{entry.notes}</div>
        )}

        {entry.handoffConfirmedAt && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <Check size={16} /> Handoff confirmed
          </div>
        )}

        {entry.isHandoffDay && !entry.handoffConfirmedAt && (
          <button
            onClick={handleConfirmHandoff}
            disabled={confirming}
            className="w-full mt-2 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {confirming ? 'Confirming...' : 'Confirm Handoff'}
          </button>
        )}
      </div>
    </div>
  );
}
