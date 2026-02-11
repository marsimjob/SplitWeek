import { Clock } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import { formatDate } from '../../utils/dateHelpers';

export default function HandoffCountdown({ handoff }) {
  const targetDate = handoff.handoffTime
    ? `${handoff.date}T${handoff.handoffTime}`
    : `${handoff.date}T18:00:00`;

  const { days, hours, minutes, seconds, total } = useCountdown(targetDate);

  if (total <= 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Clock size={18} className="text-indigo-600" />
        Next Handoff
      </h3>
      <p className="text-sm text-gray-600 mb-3">{formatDate(handoff.date)}</p>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-indigo-50 rounded-lg p-2">
          <div className="text-2xl font-bold text-indigo-600">{days}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2">
          <div className="text-2xl font-bold text-indigo-600">{hours}</div>
          <div className="text-xs text-gray-500">hrs</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2">
          <div className="text-2xl font-bold text-indigo-600">{minutes}</div>
          <div className="text-xs text-gray-500">min</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2">
          <div className="text-2xl font-bold text-indigo-600">{seconds}</div>
          <div className="text-xs text-gray-500">sec</div>
        </div>
      </div>

      {days > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <span className="text-lg font-medium text-amber-800">
            {days} {days === 1 ? 'sleep' : 'sleeps'} to go!
          </span>
        </div>
      )}
    </div>
  );
}
