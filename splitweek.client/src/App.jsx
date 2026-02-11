import React, { useState } from 'react';
import { Calendar, Users, Bell, MessageSquare, Package } from 'lucide-react';

export default function SplitWeekApp() {
    const [currentView, setCurrentView] = useState('calendar');
    const [selectedDate, setSelectedDate] = useState(null);

    // Mock schedule data - alternating weeks
    const scheduleData = {
        '2026-02-10': { parent: 'A', notes: 'Soccer practice 4pm' },
        '2026-02-11': { parent: 'A', notes: '' },
        '2026-02-12': { parent: 'A', notes: 'Piano lesson 5:30pm' },
        '2026-02-13': { parent: 'A', notes: '' },
        '2026-02-14': { parent: 'A', notes: 'Dentist 3pm' },
        '2026-02-15': { parent: 'A', notes: '' },
        '2026-02-16': { parent: 'A', notes: 'Handoff: 6pm' },
        '2026-02-17': { parent: 'B', notes: 'Handoff from Parent A' },
        '2026-02-18': { parent: 'B', notes: '' },
        '2026-02-19': { parent: 'B', notes: 'Basketball 6pm' },
        '2026-02-20': { parent: 'B', notes: '' },
        '2026-02-21': { parent: 'B', notes: '' },
        '2026-02-22': { parent: 'B', notes: '' },
        '2026-02-23': { parent: 'B', notes: 'Handoff: 6pm' },
        '2026-02-24': { parent: 'A', notes: 'Handoff from Parent B' },
    };

    const packingList = [
        { id: 1, item: 'School backpack', checked: false },
        { id: 2, item: 'Homework folder', checked: false },
        { id: 3, item: 'Soccer cleats', checked: false },
        { id: 4, item: 'Favorite stuffed animal', checked: false },
        { id: 5, item: 'Medications', checked: false },
        { id: 6, item: 'Change of clothes (3 sets)', checked: false },
    ];

    const upcomingReminders = [
        { date: '2026-02-16', time: '4:00 PM', message: 'Handoff in 2 hours - Start packing' },
        { date: '2026-02-14', time: '2:00 PM', message: 'Dentist appointment in 1 hour' },
    ];

    // Generate calendar for February 2026
    const generateCalendar = () => {
        const daysInMonth = 28;
        const firstDay = 6; // Feb 1, 2026 is Saturday
        const weeks = [];
        let currentWeek = Array(firstDay).fill(null);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
            currentWeek.push({ day, dateStr, data: scheduleData[dateStr] });

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
    };

    const calendar = generateCalendar();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <Users className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Split Week</h1>
                                <p className="text-sm text-gray-500">Emma's Schedule</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Bell size={20} className="text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <MessageSquare size={20} className="text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Navigation */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setCurrentView('calendar')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentView === 'calendar'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Calendar size={18} className="inline mr-2" />
                        Calendar
                    </button>
                    <button
                        onClick={() => setCurrentView('packing')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentView === 'packing'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Package size={18} className="inline mr-2" />
                        Packing List
                    </button>
                </div>

                {/* Calendar View */}
                {currentView === 'calendar' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Calendar */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">February 2026</h2>
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-200 rounded"></div>
                                        <span className="text-gray-600">Parent A</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-purple-200 rounded"></div>
                                        <span className="text-gray-600">Parent B</span>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Day headers */}
                                <div className="grid grid-cols-7 bg-gray-50">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center py-2 text-sm font-medium text-gray-600 border-b border-gray-200">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar days */}
                                {calendar.map((week, weekIdx) => (
                                    <div key={weekIdx} className="grid grid-cols-7">
                                        {week.map((dayObj, dayIdx) => {
                                            if (!dayObj) {
                                                return <div key={dayIdx} className="aspect-square border-b border-r border-gray-200 bg-gray-50"></div>;
                                            }

                                            const isToday = dayObj.dateStr === '2026-02-11';
                                            const bgColor = dayObj.data?.parent === 'A' ? 'bg-blue-50 hover:bg-blue-100' :
                                                dayObj.data?.parent === 'B' ? 'bg-purple-50 hover:bg-purple-100' :
                                                    'hover:bg-gray-50';

                                            return (
                                                <div
                                                    key={dayIdx}
                                                    onClick={() => setSelectedDate(dayObj)}
                                                    className={`aspect-square border-b border-r border-gray-200 p-2 cursor-pointer transition-colors ${bgColor} ${isToday ? 'ring-2 ring-indigo-500 ring-inset' : ''
                                                        }`}
                                                >
                                                    <div className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                                                        {dayObj.day}
                                                    </div>
                                                    {dayObj.data?.notes && (
                                                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                            {dayObj.data.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Upcoming Reminders */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Bell size={18} className="text-indigo-600" />
                                    Upcoming
                                </h3>
                                <div className="space-y-3">
                                    {upcomingReminders.map((reminder, idx) => (
                                        <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="text-xs text-amber-700 font-medium mb-1">
                                                {reminder.date} &middot; {reminder.time}
                                            </div>
                                            <div className="text-sm text-gray-700">{reminder.message}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Day Info */}
                            {selectedDate && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="font-bold text-gray-900 mb-4">
                                        {selectedDate.dateStr}
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${selectedDate.data?.parent === 'A' ? 'bg-blue-500' : 'bg-purple-500'
                                                }`}></div>
                                            <span className="text-sm font-medium text-gray-700">
                                                Parent {selectedDate.data?.parent}
                                            </span>
                                        </div>
                                        {selectedDate.data?.notes && (
                                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                {selectedDate.data.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Packing List View */}
                {currentView === 'packing' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Next Handoff Packing List</h2>
                                <p className="text-sm text-gray-600">Sunday, Feb 16 at 6:00 PM</p>
                            </div>

                            <div className="space-y-3">
                                {packingList.map((item) => (
                                    <label key={item.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700">{item.item}</span>
                                    </label>
                                ))}
                            </div>

                            <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                                Mark All as Packed
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}