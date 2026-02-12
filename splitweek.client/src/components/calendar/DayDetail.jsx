import { useState } from 'react';
import { Check, MapPin, Clock, UserCircle } from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { formatDate } from '../../utils/dateHelpers';
import { PARENT_COLORS } from '../../utils/constants';

export default function DayDetail({ entry, dateStr, childId, parents, parentMap, onAssign, onUpdate, saving }) {
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

  const assignedParent = entry ? parentMap[entry.assignedParentId] : null;
  const assignedRole = assignedParent?.role || 'ParentA';
  const colors = PARENT_COLORS[assignedRole] || {};

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-4">{formatDate(dateStr)}</h3>

      {entry ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${colors.dot || 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">
              {assignedParent ? `${assignedParent.firstName} ${assignedParent.lastName}` : entry.assignedParentName || 'Assigned Parent'}
            </span>
          </div>

          {/* Reassign buttons */}
          <div className="flex gap-2">
            {parents.map((p) => {
              const isActive = entry.assignedParentId === p.id;
              const pRole = p.role || 'ParentA';
              const pColors = PARENT_COLORS[pRole] || PARENT_COLORS.ParentA;
              return (
                <button
                  key={p.id}
                  disabled={isActive || saving}
                  onClick={() => onAssign(dateStr, p.id)}
                  className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium transition-colors ${
                    isActive
                      ? `${pColors.bg} ${pColors.text} ${pColors.border} border-2`
                      : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                  } disabled:opacity-60`}
                >
                  {p.firstName}
                </button>
              );
            })}
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
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <UserCircle size={16} /> No parent assigned
          </div>
          <p className="text-sm text-gray-400">Choose a parent for this day:</p>
          <div className="flex gap-2">
            {parents.map((p) => {
              const pRole = p.role || 'ParentA';
              const pColors = PARENT_COLORS[pRole] || PARENT_COLORS.ParentA;
              return (
                <button
                  key={p.id}
                  disabled={saving}
                  onClick={() => onAssign(dateStr, p.id)}
                  className={`flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors ${pColors.bg} ${pColors.text} hover:opacity-80 disabled:opacity-50`}
                >
                  {p.firstName} {p.lastName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
