import { useState } from 'react';
import { PARENT_COLORS } from '../../utils/constants';
import { isToday } from '../../utils/dateHelpers';

export default function CalendarGrid({ calendar, scheduleMap, selectedDate, onSelectDate, parents, parentMap, onAssignDay, saving }) {
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [assigningDate, setAssigningDate] = useState(null);

  const handleDayClick = (dateStr) => {
    onSelectDate(dateStr);
    // If day is unassigned, show inline parent picker
    const entry = scheduleMap[dateStr];
    if (!entry) {
      setAssigningDate(dateStr);
    } else {
      setAssigningDate(null);
    }
  };

  const handleQuickAssign = (dateStr, parentId) => {
    onAssignDay(dateStr, parentId);
    setAssigningDate(null);
  };

  const getParentRole = (entry) => {
    if (!entry || !entry.assignedParentId) return null;
    const parent = parentMap[entry.assignedParentId];
    return parent?.role || 'ParentA';
  };

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
            const role = getParentRole(entry);
            const colors = role ? PARENT_COLORS[role] : {};
            const isAssigning = assigningDate === dayObj.dateStr;

            return (
              <div
                key={dayIdx}
                onClick={() => handleDayClick(dayObj.dateStr)}
                className={`aspect-square border-b border-r border-gray-200 p-1.5 cursor-pointer transition-all relative group
                  ${entry ? `${colors.bg} ${colors.bgHover}` : 'hover:bg-gray-50'}
                  ${today ? 'ring-2 ring-indigo-500 ring-inset' : ''}
                  ${selected ? 'ring-2 ring-indigo-400 ring-inset' : ''}
                `}
              >
                <div className={`text-sm font-medium ${today ? 'text-indigo-600' : 'text-gray-700'}`}>
                  {dayObj.day}
                </div>

                {entry && (
                  <div className="mt-0.5">
                    <div className={`text-xs font-medium ${colors.text || 'text-gray-500'} truncate`}>
                      {parentMap[entry.assignedParentId]?.firstName || entry.assignedParentName?.split(' ')[0] || ''}
                    </div>
                    {entry.isHandoffDay && (
                      <div className="text-xs text-amber-600 font-medium">Handoff</div>
                    )}
                  </div>
                )}

                {!entry && !isAssigning && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-gray-400">Click to assign</span>
                  </div>
                )}

                {/* Inline quick-assign picker */}
                {isAssigning && parents.length > 0 && (
                  <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-1 z-10 rounded" onClick={(e) => e.stopPropagation()}>
                    {parents.map((p) => {
                      const pRole = p.role || 'ParentA';
                      const pColors = PARENT_COLORS[pRole] || PARENT_COLORS.ParentA;
                      return (
                        <button
                          key={p.id}
                          disabled={saving}
                          onClick={(e) => { e.stopPropagation(); handleQuickAssign(dayObj.dateStr, p.id); }}
                          className={`w-full text-xs py-1 px-1 rounded ${pColors.bg} ${pColors.text} hover:opacity-80 font-medium truncate disabled:opacity-50`}
                        >
                          {p.firstName}
                        </button>
                      );
                    })}
                    <button
                      onClick={(e) => { e.stopPropagation(); setAssigningDate(null); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
