import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { scheduleApi } from '../../api/scheduleApi';
import { generateCalendar, formatMonth, getNextMonth, getPrevMonth, toMonthParam, isToday } from '../../utils/dateHelpers';
import { DAY_NAMES, PARENT_COLORS } from '../../utils/constants';
import CalendarGrid from './CalendarGrid';
import DayDetail from './DayDetail';
import HandoffCountdown from './HandoffCountdown';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import { Calendar } from 'lucide-react';

export default function CalendarPage() {
  const { selectedChild } = useChild();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSchedule = async () => {
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
  };

  useEffect(() => { loadSchedule(); }, [selectedChild, year, month]);

  const handlePrev = () => {
    const { year: y, month: m } = getPrevMonth(year, month);
    setYear(y); setMonth(m);
  };

  const handleNext = () => {
    const { year: y, month: m } = getNextMonth(year, month);
    setYear(y); setMonth(m);
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
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 ${PARENT_COLORS.ParentA.legend} rounded`} />
              <span className="text-gray-600">Parent A</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 ${PARENT_COLORS.ParentB.legend} rounded`} />
              <span className="text-gray-600">Parent B</span>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <CalendarGrid
            calendar={calendar}
            scheduleMap={scheduleMap}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}
      </div>

      <div className="space-y-6">
        {nextHandoff && <HandoffCountdown handoff={nextHandoff} />}

        {selectedDate && scheduleMap[selectedDate] && (
          <DayDetail
            entry={scheduleMap[selectedDate]}
            childId={selectedChild.id}
            onUpdate={loadSchedule}
          />
        )}
      </div>
    </div>
  );
}
