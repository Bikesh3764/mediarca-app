/**
 * MediArca Mobile - Pure Date, Time & IST Utilities
 * All clinic shift schedules, token estimates, and doctor presence calculations operate in Indian Standard Time (Asia/Kolkata, UTC +05:30).
 * This module is leaf-level and imports NO other services to prevent require cycles.
 */

export const ALL_WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type WeekdayCode = (typeof ALL_WEEKDAYS)[number];

export const WEEKDAY_NAMES: Record<string, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

/**
 * Converts a time string (e.g. "09:30", "09:30 AM", "2:15 PM") to total minutes from midnight (0-1439).
 */
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const clean = timeStr.replace(/\s*(AM|PM)/i, '').trim();
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  if (timeStr.toUpperCase().includes('PM') && h < 12) h += 12;
  if (timeStr.toUpperCase().includes('AM') && h === 12) h = 0;
  return h * 60 + m;
};

/**
 * Converts total minutes from midnight into 12-hour formatted time (e.g. 570 -> "09:30 AM").
 */
export const minutesTo12Hour = (totalMinutes: number): string => {
  const normalized = ((Math.floor(totalMinutes) % (24 * 60)) + (24 * 60)) % (24 * 60);
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Formats a 24-hour time string into a 12-hour AM/PM string.
 */
export const format12Hour = (time24: string): string => {
  if (!time24) return '09:00 AM';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  return minutesTo12Hour(timeToMinutes(time24));
};

/**
 * Calculates slot duration and average consultation minutes, handling overnight midnight shifts.
 */
export const calculateSlotMetrics = (
  startTime: string,
  endTime: string,
  maxPatients: number
): { durationMinutes: number; avgConsultationMinutes: number } => {
  const startMins = timeToMinutes(startTime);
  let endMins = timeToMinutes(endTime);
  if (endMins <= startMins) {
    endMins += 24 * 60;
  }
  const durationMinutes = Math.max(1, endMins - startMins);
  const safeMax = Math.max(1, maxPatients || 1);
  const rawAvg = durationMinutes / safeMax;
  const avgConsultationMinutes = Math.round(rawAvg * 10) / 10;
  return { durationMinutes, avgConsultationMinutes };
};

/**
 * Normalizes raw slot names to standard display formats (e.g. "Shift 1").
 */
export const cleanSlotName = (name?: string | null, fallback = 'Shift'): string => {
  if (!name || !name.trim()) return fallback;
  const shiftNumMatch = name.match(/shift\s*(\d+)/i);
  if (shiftNumMatch) {
    return `Shift ${shiftNumMatch[1]}`;
  }
  let cleaned = name.replace(/\s*\([^)]*\)/g, '').trim();
  cleaned = cleaned.replace(/\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*[-–to]\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/gi, '').trim();
  cleaned = cleaned.replace(/\s*(?:morning|afternoon|evening|night)/gi, '').trim();
  return cleaned || fallback;
};

/**
 * Formats a shift option with an optional "Ended" indicator.
 */
export const formatShiftOption = (
  slot: { name?: string | null; startTime?: string; endTime?: string },
  isEnded?: boolean
): string => {
  const baseName = cleanSlotName(slot.name, 'Shift');
  return `${baseName}${isEnded ? ' • Ended' : ''}`;
};

/**
 * Returns Indian Standard Time (Asia/Kolkata) date string in YYYY-MM-DD format.
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
  } catch {
    const istMs = d.getTime() + 330 * 60 * 1000;
    const istDate = new Date(istMs);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * Returns current minutes from midnight in Indian Standard Time (Asia/Kolkata).
 */
export const getIndianTimeMinutes = (d: Date = new Date()): number => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(d);
    let hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return hour * 60 + minute;
  } catch {
    const utcMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
    return (utcMinutes + 330) % (24 * 60);
  }
};

/**
 * Returns tomorrow's date string in YYYY-MM-DD format (IST).
 */
export const getTomorrowDateString = (d: Date = new Date()): string => {
  const tomorrow = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  return getLocalDateString(tomorrow);
};

/**
 * Returns the three-letter WeekdayCode ('SUN' | 'MON' | ...) for a given date in IST.
 */
export const getDayOfWeekCode = (dateStr?: string): WeekdayCode => {
  const targetStr = dateStr || getLocalDateString();
  const match = targetStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return 'MON';
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const d = new Date(Date.UTC(year, month - 1, day));
  const codes: WeekdayCode[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return codes[d.getUTCDay()] || 'MON';
};
