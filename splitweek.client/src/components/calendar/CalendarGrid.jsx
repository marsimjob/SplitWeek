import { DAY_NAMES, PARENT_COLORS } from '../../utils/constants';
import { isToday } from '../../utils/dateHelpers';

export default function CalendarGrid({ calendar, scheduleMap, selectedDate, onSelectDate }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50">
        {DAY_NAMES.map((day) => (
          <div key={day} className="text-center py-2 text-sm font-medium text-gray-600 border-b border-gray-200">
            {day}
          </div>
        ))}
      </div>

      {calendar.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7">
          {week.map((dayObj, dayIdx) => {
            if (!dayObj) {
              return <div key={dayIdx} className="aspect-square border-b border-r border-gray-200 bg-gray-50" />;
            }

            const entry = scheduleMap[dayObj.dateStr];
            const today = isToday(dayObj.dateStr);
            const selected = selectedDate === dayObj.dateStr;
            const role = entry?.assignedParentId ? (entry.assignedParentName?.includes('A') || entry.myRole === 'ParentA' ? 'ParentA' : 'ParentB') : null;
            const colors = role ? PARENT_COLORS[role] : {};

            return (
              <div
                key={dayIdx}
                onClick={() => onSelectDate(dayObj.dateStr)}
                className={`aspect-square border-b border-r border-gray-200 p-2 cursor-pointer transition-colors
                  ${entry ? `${colors.bg} ${colors.bgHover}` : 'hover:bg-gray-50'}
                  ${today ? 'ring-2 ring-indigo-500 ring-inset' : ''}
                  ${selected ? 'ring-2 ring-indigo-400 ring-inset bg-indigo-50' : ''}
                `}
              >
                <div className={`text-sm font-medium ${today ? 'text-indigo-600' : 'text-gray-700'}`}>
                  {dayObj.day}
                </div>
                {entry?.notes && (
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{entry.notes}</div>
                )}
                {entry?.isHandoffDay && (
                  <div className="text-xs text-amber-600 font-medium mt-0.5">Handoff</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
