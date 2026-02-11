export const PARENT_COLORS = {
  ParentA: {
    bg: 'bg-blue-50',
    bgHover: 'hover:bg-blue-100',
    dot: 'bg-blue-500',
    legend: 'bg-blue-200',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  ParentB: {
    bg: 'bg-purple-50',
    bgHover: 'hover:bg-purple-100',
    dot: 'bg-purple-500',
    legend: 'bg-purple-200',
    text: 'text-purple-700',
    border: 'border-purple-300',
  },
};

export const SCHEDULE_STATUSES = {
  Pending: 'Pending',
  Approved: 'Approved',
  Declined: 'Declined',
  CounterProposed: 'CounterProposed',
  Expired: 'Expired',
};

export const MESSAGE_TYPES = {
  FreeText: 'FreeText',
  ScheduleChange: 'ScheduleChange',
  PickupUpdate: 'PickupUpdate',
  ItemReminder: 'ItemReminder',
};

export const PACKING_STATUSES = {
  InProgress: 'InProgress',
  Ready: 'Ready',
  Confirmed: 'Confirmed',
};

export const ROUTINE_TYPES = {
  Morning: 'Morning',
  Bedtime: 'Bedtime',
  MealBreakfast: 'MealBreakfast',
  MealLunch: 'MealLunch',
  MealDinner: 'MealDinner',
};

export const NOTIFICATION_CATEGORIES = {
  Schedule: 'Schedule',
  Packing: 'Packing',
  Profile: 'Profile',
  Medication: 'Medication',
  Message: 'Message',
  ChangeRequest: 'ChangeRequest',
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
