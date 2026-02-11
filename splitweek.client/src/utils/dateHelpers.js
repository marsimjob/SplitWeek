import { format, getDaysInMonth, getDay, startOfMonth, addMonths, subMonths } from 'date-fns';

export function generateCalendar(year, month) {
  const date = new Date(year, month, 1);
  const daysInMonth = getDaysInMonth(date);
  const firstDayOfWeek = getDay(startOfMonth(date));
  const weeks = [];
  let currentWeek = Array(firstDayOfWeek).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    currentWeek.push({ day, dateStr });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return weeks;
}

export function formatMonth(year, month) {
  return format(new Date(year, month, 1), 'MMMM yyyy');
}

export function getNextMonth(year, month) {
  const d = addMonths(new Date(year, month, 1), 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function getPrevMonth(year, month) {
  const d = subMonths(new Date(year, month, 1), 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

export function toMonthParam(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function isToday(dateStr) {
  return dateStr === format(new Date(), 'yyyy-MM-dd');
}
