import { useState } from 'react';
import { X, Repeat } from 'lucide-react';
import { PARENT_COLORS, DAY_NAMES } from '../../utils/constants';
import { generateCalendar } from '../../utils/dateHelpers';

const PRESETS = [
  { label: 'Alternating weeks', getPattern: (parents) => {
    const [a, b] = parents;
    return DAY_NAMES.map((_, i) => ({ dayOfWeek: i, parentId: a?.id, altParentId: b?.id, alternating: true }));
  }},
  { label: 'Mon-Wed / Thu-Sun', getPattern: (parents) => {
    const [a, b] = parents;
    return DAY_NAMES.map((_, i) => ({ dayOfWeek: i, parentId: i <= 3 ? a?.id : b?.id }));
  }},
  { label: 'Mon-Fri / Weekends', getPattern: (parents) => {
    const [a, b] = parents;
    return DAY_NAMES.map((_, i) => ({ dayOfWeek: i, parentId: (i >= 1 && i <= 5) ? a?.id : b?.id }));
  }},
];

export default function WeeklyPatternModal({ year, month, parents, onApply, onClose, saving }) {
  // pattern[dayIndex] = parentId or null
  const [pattern, setPattern] = useState(() => Array(7).fill(null));

  const handleSetDay = (dayIndex, parentId) => {
    setPattern((prev) => {
      const next = [...prev];
      next[dayIndex] = parentId;
      return next;
    });
  };

  const applyPreset = (preset) => {
    const result = preset.getPattern(parents);
    setPattern(result.map((r) => r.parentId || null));
  };

  const handleApply = () => {
    // Generate entries for the entire month based on the weekly pattern
    const calendar = generateCalendar(year, month);
    const entries = [];

    calendar.forEach((week) => {
      week.forEach((dayObj, dayIdx) => {
        if (!dayObj) return;
        const parentId = pattern[dayIdx];
        if (!parentId) return;
        entries.push({
          date: dayObj.dateStr,
          assignedParentId: parentId,
        });
      });
    });

    if (entries.length > 0) {
      onApply(entries);
    }
    onClose();
  };

  const assignedCount = pattern.filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Repeat size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Weekly Pattern</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Presets */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day-by-day assignment */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Assign each day of the week</p>
            <div className="space-y-2">
              {DAY_NAMES.map((dayName, dayIdx) => (
                <div key={dayName} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-10">{dayName}</span>
                  <div className="flex gap-2 flex-1">
                    {parents.map((p) => {
                      const isActive = pattern[dayIdx] === p.id;
                      const pRole = p.role || 'ParentA';
                      const pColors = PARENT_COLORS[pRole] || PARENT_COLORS.ParentA;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSetDay(dayIdx, isActive ? null : p.id)}
                          className={`flex-1 text-xs py-2 px-2 rounded-lg font-medium transition-all ${
                            isActive
                              ? `${pColors.bg} ${pColors.text} ${pColors.border} border-2 shadow-sm`
                              : 'border border-gray-200 text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {p.firstName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Preview for {DAY_NAMES.filter((_, i) => pattern[i]).length} days/week</p>
            <div className="flex gap-1">
              {DAY_NAMES.map((dayName, dayIdx) => {
                const parentId = pattern[dayIdx];
                const parent = parentId ? parents.find((p) => p.id === parentId) : null;
                const pRole = parent?.role || 'ParentA';
                const pColors = parent ? PARENT_COLORS[pRole] || PARENT_COLORS.ParentA : {};
                return (
                  <div
                    key={dayIdx}
                    className={`flex-1 text-center py-1.5 rounded text-xs font-medium ${
                      parent ? `${pColors.bg} ${pColors.text}` : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {dayName[0]}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={saving || assignedCount === 0}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Applying...' : `Apply to ${new Date(year, month).toLocaleString('default', { month: 'long' })}`}
          </button>
        </div>
      </div>
    </div>
  );
}
