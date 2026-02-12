import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Repeat } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useAuth } from '../../context/AuthContext';
import { scheduleApi } from '../../api/scheduleApi';
import { childrenApi } from '../../api/childrenApi';
import { generateCalendar, formatMonth, getNextMonth, getPrevMonth, toMonthParam, isToday } from '../../utils/dateHelpers';
import { DAY_NAMES, PARENT_COLORS } from '../../utils/constants';
import CalendarGrid from './CalendarGrid';
import DayDetail from './DayDetail';
import HandoffCountdown from './HandoffCountdown';
import WeeklyPatternModal from './WeeklyPatternModal';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';

export default function CalendarPage() {
  const { selectedChild } = useChild();
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPattern, setShowPattern] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSchedule = useCallback(async () => {
    if (!selectedChild) return;
    setLoading(true);
    try {
      const data = await scheduleApi.getSchedule(selectedChild.id, toMonthParam(year, month));
      setSchedule(data);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedChild, year, month]);

  const loadParents = useCallback(async () => {
    if (!selectedChild) return;
    try {
      const data = await childrenApi.getParents(selectedChild.id);
      setParents(data);
    } catch (err) {
      console.error('Failed to load parents:', err);
    }
  }, [selectedChild]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);
  useEffect(() => { loadParents(); }, [loadParents]);

  const handlePrev = () => {
    const { year: y, month: m } = getPrevMonth(year, month);
    setYear(y); setMonth(m);
  };

  const handleNext = () => {
    const { year: y, month: m } = getNextMonth(year, month);
    setYear(y); setMonth(m);
  };

  const handleAssignDay = async (dateStr, parentId) => {
    if (!selectedChild) return;
    setSaving(true);
    try {
      await scheduleApi.bulkCreate(selectedChild.id, {
        entries: [{ date: dateStr, assignedParentId: parentId }]
      });
      await loadSchedule();
    } catch (err) {
      console.error('Failed to assign day:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAssign = async (entries) => {
    if (!selectedChild || entries.length === 0) return;
    setSaving(true);
    try {
      await scheduleApi.bulkCreate(selectedChild.id, { entries });
      await loadSchedule();
    } catch (err) {
      console.error('Failed to bulk assign:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!selectedChild) {
    return <EmptyState icon={Calendar} title="No child profile yet" description="Create a child profile to get started with scheduling." />;
  }

  const calendar = generateCalendar(year, month);
  const scheduleMap = {};
  schedule.forEach((s) => { scheduleMap[s.date] = s; });

  const nextHandoff = schedule
    .filter((s) => s.isHandoffDay && new Date(s.date) >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // Build a parentMap by ID for quick lookup
  const parentMap = {};
  parents.forEach((p) => { parentMap[p.id] = p; });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 min-w-[180px] text-center">
              {formatMonth(year, month)}
            </h2>
            <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPattern(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Repeat size={14} />
              Weekly Pattern
            </button>
          </div>
        </div>

        {/* Parent legend */}
        <div className="flex gap-4 text-sm mb-4">
          {parents.map((p) => {
            const role = p.role || 'ParentA';
            const colors = PARENT_COLORS[role] || PARENT_COLORS.ParentA;
            return (
              <div key={p.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 ${colors.legend} rounded`} />
                <span className="text-gray-600">{p.firstName} {p.lastName}</span>
              </div>
            );
          })}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <CalendarGrid
            calendar={calendar}
            scheduleMap={scheduleMap}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            parents={parents}
            parentMap={parentMap}
            onAssignDay={handleAssignDay}
            saving={saving}
          />
        )}
      </div>

      <div className="space-y-6">
        {nextHandoff && <HandoffCountdown handoff={nextHandoff} />}

        {selectedDate && (
          <DayDetail
            entry={scheduleMap[selectedDate]}
            dateStr={selectedDate}
            childId={selectedChild.id}
            parents={parents}
            parentMap={parentMap}
            onAssign={handleAssignDay}
            onUpdate={loadSchedule}
            saving={saving}
          />
        )}
      </div>

      {showPattern && (
        <WeeklyPatternModal
          year={year}
          month={month}
          parents={parents}
          onApply={handleBulkAssign}
          onClose={() => setShowPattern(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
