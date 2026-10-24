import type {
  Appointment,
  DoctorLeave,
} from './api';
import {
  getLocalDateString,
  timeToMinutes,
  getIndianTimeMinutes,
  getDayOfWeekCode,
} from './dateTimeUtils';

// ==========================================
// 1. Clinical Vitals Validation
// ==========================================

export interface VitalsValidationResult {
  isValid: boolean;
  errors: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
  };
}

/**
 * Validates Blood Pressure in Systolic/Diastolic format (e.g. 120/80).
 * Clinical bounds:
 * - Systolic: 60 - 260 mmHg
 * - Diastolic: 40 - 160 mmHg
 * - Systolic must be strictly greater than Diastolic
 * Supports optional units suffix (e.g. "120/80 mmHg").
 */
export function validateBloodPressure(bp: string | null | undefined): {
  isValid: boolean;
  error?: string;
  systolic?: number;
  diastolic?: number;
} {
  if (!bp || !bp.trim()) {
    return { isValid: true };
  }

  // Strip trailing "mmHg" or "mm hg" if user/clinician typed it
  const clean = bp.trim().replace(/\s*mm\s*hg$/i, '').trim();
  const match = clean.match(/^(\d{2,3})\s*[/\\-]\s*(\d{2,3})$/);
  if (!match) {
    return {
      isValid: false,
      error: 'Enter Blood Pressure as Systolic/Diastolic (e.g. 120/80)',
    };
  }

  const systolic = parseInt(match[1], 10);
  const diastolic = parseInt(match[2], 10);

  if (isNaN(systolic) || isNaN(diastolic)) {
    return { isValid: false, error: 'Invalid blood pressure numbers' };
  }

  if (systolic < 60 || systolic > 260) {
    return {
      isValid: false,
      error: 'Systolic pressure must be between 60 and 260 mmHg',
      systolic,
      diastolic,
    };
  }

  if (diastolic < 40 || diastolic > 160) {
    return {
      isValid: false,
      error: 'Diastolic pressure must be between 40 and 160 mmHg',
      systolic,
      diastolic,
    };
  }

  if (systolic <= diastolic) {
    return {
      isValid: false,
      error: 'Systolic pressure must be higher than Diastolic pressure',
      systolic,
      diastolic,
    };
  }

  return { isValid: true, systolic, diastolic };
}

/**
 * Validates Pulse / Heart Rate in beats per minute (bpm).
 * Clinical bounds: 30 - 220 bpm.
 */
export function validatePulse(pulse: number | string | null | undefined): {
  isValid: boolean;
  error?: string;
  pulse?: number;
} {
  if (pulse === undefined || pulse === null || pulse === '') {
    return { isValid: true };
  }

  const num = typeof pulse === 'number' ? pulse : parseFloat(String(pulse).trim());
  if (isNaN(num)) {
    return { isValid: false, error: 'Pulse must be a valid number' };
  }

  if (num < 30 || num > 220) {
    return {
      isValid: false,
      error: 'Pulse must be between 30 and 220 bpm',
      pulse: num,
    };
  }

  return { isValid: true, pulse: Math.round(num) };
}

/**
 * Validates Body Temperature in Fahrenheit (°F).
 * Clinical bounds: 90.0°F - 110.0°F.
 */
export function validateTemperature(temp: number | string | null | undefined): {
  isValid: boolean;
  error?: string;
  temp?: number;
} {
  if (temp === undefined || temp === null || temp === '') {
    return { isValid: true };
  }

  const num = typeof temp === 'number' ? temp : parseFloat(String(temp).trim());
  if (isNaN(num)) {
    return { isValid: false, error: 'Temperature must be a valid number' };
  }

  if (num < 90.0 || num > 110.0) {
    return {
      isValid: false,
      error: 'Body temperature must be between 90.0°F and 110.0°F',
      temp: num,
    };
  }

  return { isValid: true, temp: parseFloat(num.toFixed(1)) };
}

/**
 * Validates Patient Body Weight in kilograms (kg).
 * Clinical bounds: 1.0 kg - 350.0 kg.
 */
export function validateWeight(weight: number | string | null | undefined): {
  isValid: boolean;
  error?: string;
  weight?: number;
} {
  if (weight === undefined || weight === null || weight === '') {
    return { isValid: true };
  }

  const num = typeof weight === 'number' ? weight : parseFloat(String(weight).trim());
  if (isNaN(num)) {
    return { isValid: false, error: 'Weight must be a valid number' };
  }

  if (num < 1.0 || num > 350.0) {
    return {
      isValid: false,
      error: 'Weight must be between 1.0 kg and 350.0 kg',
      weight: num,
    };
  }

  return { isValid: true, weight: parseFloat(num.toFixed(1)) };
}

/**
 * Validates all clinical vitals together.
 */
export function validateAllVitals(vitals: {
  bp?: string;
  pulse?: string | number;
  temp?: string | number;
  weight?: string | number;
}): VitalsValidationResult {
  const errors: VitalsValidationResult['errors'] = {};

  const bpResult = validateBloodPressure(vitals.bp);
  if (!bpResult.isValid && bpResult.error) {
    errors.bp = bpResult.error;
  }

  const pulseResult = validatePulse(vitals.pulse);
  if (!pulseResult.isValid && pulseResult.error) {
    errors.pulse = pulseResult.error;
  }

  const tempResult = validateTemperature(vitals.temp);
  if (!tempResult.isValid && tempResult.error) {
    errors.temp = tempResult.error;
  }

  const weightResult = validateWeight(vitals.weight);
  if (!weightResult.isValid && weightResult.error) {
    errors.weight = weightResult.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ==========================================
// 2. Cabin Presence & Return Time
// ==========================================

export type CabinPresenceStatus = 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN';

export const QUICK_RETURN_MINUTES = [10, 15, 30, 45] as const;

/**
 * Calculates a formatted 12-hour time string in IST (Asia/Kolkata UTC+05:30)
 * when given future minutes.
 * E.g., if now is 11:30 AM IST and minutes is 15 -> "11:45 AM"
 */
export function calculateExpectedReturnTime(minutes: number, baseDate?: Date): string {
  const d = baseDate ? new Date(baseDate.getTime()) : new Date();
  const currentIstMinutes = getIndianTimeMinutes(d);
  const targetMinutes = ((currentIstMinutes + minutes) % (24 * 60) + 24 * 60) % (24 * 60);

  const hours = Math.floor(targetMinutes / 60);
  const mins = targetMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = mins.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Normalizes and formats the return time string for display.
 */
export function formatReturnDisplay(expectedReturnTime?: string | null): string {
  if (!expectedReturnTime || !expectedReturnTime.trim()) {
    return 'Shortly';
  }
  return expectedReturnTime.replace(/^~\s*/, '').trim();
}

// ==========================================
// 3. Queue Partitioning & Ordering
// ==========================================

export interface PartitionedQueue {
  waiting: Appointment[];
  inConsultation: Appointment | null;
  completed: Appointment[];
  total: number;
}

/**
 * Segments appointment array into Waiting, In Consultation, and Completed.
 * Waiting is ordered by queueNumber ascending.
 * Recognizes IN_CONSULTATION and CALLING as active cabin visits.
 * Treats WAITING, PENDING_APPROVAL, HOLD, CHECKED_IN, CONFIRMED, BOOKED as waiting queue.
 */
export function partitionDoctorQueue(appointments: Appointment[]): PartitionedQueue {
  if (!Array.isArray(appointments)) {
    return {
      waiting: [],
      inConsultation: null,
      completed: [],
      total: 0,
    };
  }

  let inConsultation: Appointment | null = null;
  const waiting: Appointment[] = [];
  const completed: Appointment[] = [];

  for (const appt of appointments) {
    const status = (appt.status || '').toUpperCase();
    if (status === 'IN_CONSULTATION' || status === 'CALLING') {
      // Pick first active consultation
      if (!inConsultation) {
        inConsultation = appt;
      } else {
        waiting.push(appt);
      }
    } else if (status === 'COMPLETED') {
      completed.push(appt);
    } else if (
      status === 'WAITING' ||
      status === 'PENDING_APPROVAL' ||
      status === 'HOLD' ||
      status === 'CHECKED_IN' ||
      status === 'CONFIRMED' ||
      status === 'BOOKED'
    ) {
      waiting.push(appt);
    } else if (status !== 'CANCELLED' && status !== 'REJECTED' && status !== 'EXPIRED') {
      // Fallback for any other active state
      waiting.push(appt);
    }
  }

  // Sort waiting by queueNumber ascending
  waiting.sort((a, b) => (Number(a.queueNumber) || 0) - (Number(b.queueNumber) || 0));

  // Sort completed with most recently completed first
  completed.sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  return {
    waiting,
    inConsultation,
    completed,
    total: appointments.length,
  };
}

/**
 * Checks if a patient has physically arrived and checked in at the clinic.
 */
export function isPatientArrivalVerified(appointment: Appointment): boolean {
  if (!appointment) return false;
  return Boolean(appointment.isCheckedIn || appointment.checkedInAt);
}

// ==========================================
// 4. Doctor Schedule & Practice Days Calculations
// ==========================================

export const APPLE_HIG_WEEKDAYS = [
  { code: 'MON', label: 'M', full: 'Monday' },
  { code: 'TUE', label: 'T', full: 'Tuesday' },
  { code: 'WED', label: 'W', full: 'Wednesday' },
  { code: 'THU', label: 'T', full: 'Thursday' },
  { code: 'FRI', label: 'F', full: 'Friday' },
  { code: 'SAT', label: 'S', full: 'Saturday' },
  { code: 'SUN', label: 'S', full: 'Sunday' },
] as const;

/**
 * Computes average consultation minutes from shift start/end times and capacity.
 * Handles shifts spanning across midnight (e.g. 23:00 to 02:00).
 */
export function calculateAverageConsultationMinutes(
  startTime: string,
  endTime: string,
  maxPatients: number
): number {
  if (!maxPatients || maxPatients <= 0) return 15;

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);

  let durationMinutes = endMins - startMins;
  if (durationMinutes <= 0) {
    // Overnight / midnight-spanning shift
    durationMinutes += 24 * 60;
  }

  const rawAvg = durationMinutes / maxPatients;
  return Math.max(1, Math.round(rawAvg * 10) / 10);
}

/**
 * Checks if a doctor is currently on leave on a given date (YYYY-MM-DD).
 * Historical TODAY leaves are scoped strictly to the date they were created.
 */
export function isDoctorOnLeave(dateStr: string, leaves?: DoctorLeave[] | null): boolean {
  if (!leaves || !Array.isArray(leaves) || leaves.length === 0) {
    return false;
  }

  const todayStr = getLocalDateString();
  const targetDate = dateStr.trim();

  for (const leave of leaves) {
    if (leave.type === 'TODAY') {
      const leaveDate = leave.startDate || (leave as any).date;
      if (leaveDate) {
        if (leaveDate === targetDate) return true;
      } else {
        // Fallback only if no date was recorded on the leave object
        if (targetDate === todayStr) return true;
      }
    } else if (leave.type === 'DATE_RANGE') {
      const start = leave.startDate;
      const end = leave.endDate || leave.startDate;
      if (start && targetDate >= start && targetDate <= end) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determines whether a doctor is practicing on a given date based on working days and leaves.
 * Uses getDayOfWeekCode for timezone-safe UTC/IST weekday calculation.
 */
export function isDoctorPracticingOnDate(
  dateStr: string,
  workingDays: string[],
  leaves?: DoctorLeave[] | null
): { isPracticing: boolean; reason?: 'OFF_DAY' | 'ON_LEAVE' } {
  if (isDoctorOnLeave(dateStr, leaves)) {
    return { isPracticing: false, reason: 'ON_LEAVE' };
  }

  const weekdayCode = getDayOfWeekCode(dateStr);

  if (!workingDays || !workingDays.includes(weekdayCode)) {
    return { isPracticing: false, reason: 'OFF_DAY' };
  }

  return { isPracticing: true };
}
