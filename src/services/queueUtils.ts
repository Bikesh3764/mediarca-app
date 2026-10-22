/**
 * Queue & Pass Telemetry Utilities for MediArca Mobile
 * Handles:
 * - Dynamic wait time formatting (formatWaitTime)
 * - Adaptive polling interval calculations (calculatePollingInterval: 10s / 15s / 60s / 0s)
 * - Clinic QR code payload parsing (parseQrPayload: JSON, URLs, query parameters)
 * - Pass display state resolution (getPassDisplayData)
 */

import { Appointment, getLocalDateString, cleanSlotName } from './api';

/**
 * Formats wait time in minutes to user-friendly human string.
 * Accurately handles fractional boundary minutes without producing ~0 mins, ~60 mins, or ~1h 60m.
 * Examples:
 * - null / undefined / NaN -> 'Per Queue Flow'
 * - <= 0 / 0.4 -> 'Now'
 * - 0.8 / 1 -> '~1 min'
 * - 12 -> '~12 mins'
 * - 59.8 / 60 -> '~1 hr'
 * - 75 -> '~1h 15m'
 * - 119.8 / 120 -> '~2 hrs'
 * - 130 -> '~2h 10m'
 */
export const formatWaitTime = (minutes?: number | null): string => {
  if (minutes === undefined || minutes === null || isNaN(minutes)) {
    return 'Per Queue Flow';
  }
  const totalMins = Math.round(minutes);
  if (totalMins <= 0) {
    return 'Now';
  }
  if (totalMins === 1) {
    return '~1 min';
  }
  if (totalMins < 60) {
    return `~${totalMins} mins`;
  }
  const hrs = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  if (remainingMins === 0) {
    return `~${hrs} hr${hrs > 1 ? 's' : ''}`;
  }
  return `~${hrs}h ${remainingMins}m`;
};

/**
 * Configuration options for calculating the adaptive queue polling interval.
 */
export interface PollingIntervalConfig {
  /** Whether the React Native application is currently in foreground ('active') */
  isAppActive?: boolean;
  /** Whether the user has any active tickets in queue today */
  hasActivePasses?: boolean;
  /** Number of patients ahead of user in current queue */
  patientsAhead?: number | null;
  /** Whether the doctor's clinic shift is currently active in IST */
  isShiftActive?: boolean;
  /** Whether the appointment is confirmed (WAITING or IN_CONSULTATION) vs PENDING_APPROVAL */
  isConfirmed?: boolean;
}

/**
 * Calculates adaptive polling interval according to Phase 4 rules:
 * - 0ms (paused): App in background (AppState !== 'active') or zero active passes
 * - 10s (10,000ms): Near front of queue (patients ahead <= 2 and active clinic shift)
 * - 15s (15,000ms): Active clinic shift (standard live queue telemetry pace)
 * - 60s (60,000ms): Clinic shift not yet started / concluded, or ticket is pending receptionist approval
 */
export const calculatePollingInterval = (config: PollingIntervalConfig): number => {
  // Pause polling if the app is backgrounded or there are no active passes
  if (config.isAppActive === false || config.hasActivePasses === false) {
    return 0;
  }

  const { patientsAhead, isShiftActive, isConfirmed = true } = config;

  // 10s: near front of queue during active shift
  if (
    isShiftActive &&
    isConfirmed &&
    patientsAhead !== null &&
    patientsAhead !== undefined &&
    patientsAhead <= 2
  ) {
    return 10000;
  }

  // 15s: active clinic shift
  if (isShiftActive) {
    return 15000;
  }

  // 60s: shift has not started yet, shift ended, or pending approval
  return 60000;
};

/**
 * Decodes and parses clinic QR code payload.
 * Supports:
 * 1. JSON payload: {"clinicId": "cl_xxx", "code": "ABC123"} or {"clinicId": "...", "checkinCode": "..."}
 * 2. URL with query params: https://mediarca-mdwk.onrender.com/clinic-checkin?clinicId=cl_xxx&code=ABC123
 * 3. Querystring format: clinicId=cl_xxx&code=ABC123
 * 4. Raw clinic identifier: cl_xxx or UUID
 */
export const parseQrPayload = (
  raw?: string | null
): { clinicId: string; code: string } | null => {
  if (!raw || typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;

  // 1. JSON parsing
  if (
    (text.startsWith('{') && text.endsWith('}')) ||
    (text.startsWith('%7B') && text.endsWith('%7D'))
  ) {
    try {
      const decoded = text.startsWith('%7B') ? decodeURIComponent(text) : text;
      const parsed = JSON.parse(decoded);
      const clinicId = String(
        parsed.clinicId ||
        parsed.clinic_id ||
        (typeof parsed.id === 'string' && parsed.id.startsWith('cl_') ? parsed.id : '') ||
        ''
      ).trim();
      const code = String(
        parsed.code || parsed.checkinCode || parsed.check_in_code || ''
      ).trim();
      if (clinicId) {
        return { clinicId, code };
      }
    } catch {
      // Fall through to query parameter parsing
    }
  }

  // 2. URL or Querystring parameter parsing
  try {
    let qs = text;
    if (text.includes('?')) {
      qs = text.slice(text.indexOf('?') + 1);
    }
    if (qs.includes('#')) {
      qs = qs.slice(0, qs.indexOf('#'));
    }

    if (qs.includes('clinicId') || qs.includes('clinic_id')) {
      const params = new URLSearchParams(qs);
      const clinicId = (
        params.get('clinicId') ||
        params.get('clinic_id') ||
        ''
      ).trim();
      const code = (
        params.get('code') ||
        params.get('checkinCode') ||
        params.get('check_in_code') ||
        ''
      ).trim();

      if (clinicId) {
        return { clinicId, code };
      }
    }
  } catch {
    // Fall through
  }

  // 3. Raw clinic ID format or clinic ID embedded in URL path: "cl_..." or UUID
  if (
    /^cl_[a-zA-Z0-9_-]+$/.test(text) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)
  ) {
    return { clinicId: text, code: '' };
  }

  // 4. URL path segment with clinic identifier (e.g. https://domain.com/clinics/cl_xxx)
  const pathClinicMatch = text.match(/\b(cl_[a-zA-Z0-9_-]+)\b/);
  if (pathClinicMatch) {
    return { clinicId: pathClinicMatch[1], code: '' };
  }

  return null;
};

/**
 * Resolved metadata for presenting an Appointment ticket in Apple HIG layout.
 */
export interface PassDisplayData {
  isToday: boolean;
  estToken: number;
  officialToken: number;
  tokenDisplay: string;
  isPendingApproval: boolean;
  isWaiting: boolean;
  isInConsultation: boolean;
  isCompleted: boolean;
  isExpired: boolean;
  isCancelled: boolean;
  isServing: boolean;
  isNextInLine: boolean;
  receptionistPhone: string | null;
  receptionistName: string;
  doctorDisplayName: string;
  cleanShiftWindow: string;
  waitTimeDisplay: string;
  patientsAhead: number | null;
  currentServingQueueNumber: number;
  isCheckedIn: boolean;
  clinicName: string;
  clinicAddress: string;
}

/**
 * Transforms an Appointment model into normalized ticket display properties.
 */
export const getPassDisplayData = (
  appointment: Appointment,
  todayStr = getLocalDateString()
): PassDisplayData => {
  const { doctor, queueNumber, status, appointmentDate, checkingWindow, liveQueue } =
    appointment;

  const isToday = appointmentDate === todayStr;

  // Estimated token number calculation (guaranteed to start from 1, never 0 or negative)
  const rawEstToken =
    appointment.estimatedQueueNumber ||
    liveQueue?.estimatedQueueNumber ||
    (queueNumber > 0 ? queueNumber : 1);
  const estToken = Math.max(1, rawEstToken);

  const rawDocName = doctor?.user?.fullName || 'Doctor';
  const doctorDisplayName = rawDocName.startsWith('Dr.') ? rawDocName : `Dr. ${rawDocName}`;

  const cleanShift = cleanSlotName(checkingWindow, 'Shift');

  const receptionistPhone =
    appointment.receptionistPhone ||
    appointment.clinic?.phone ||
    appointment.clinicPhone ||
    null;

  const receptionistName =
    appointment.receptionistName ||
    (appointment.clinic?.clinicName
      ? `${appointment.clinic.clinicName} Reception Desk`
      : 'Front Desk Receptionist');

  const isPendingApproval = status === 'PENDING_APPROVAL';
  const isWaiting = status === 'WAITING';
  const isInConsultation = status === 'IN_CONSULTATION';
  const isCompleted = status === 'COMPLETED';
  const isExpired = status === 'EXPIRED';
  const isCancelled = status === 'CANCELLED' || status === 'REJECTED';

  const currentServingQueueNumber = liveQueue?.currentServingQueueNumber || 0;
  const isServing =
    isToday &&
    (isInConsultation ||
      (isWaiting && currentServingQueueNumber === queueNumber && queueNumber > 0));

  const patientsAhead = liveQueue?.patientsAway ?? null;
  const isNextInLine = isToday && isWaiting && patientsAhead === 0;

  const waitTimeDisplay =
    isCompleted
      ? 'Completed'
      : isExpired
      ? 'Expired'
      : isCancelled
      ? status === 'REJECTED'
        ? 'Declined'
        : 'Cancelled'
      : isInConsultation
      ? 'In Cabin'
      : isServing
      ? 'Your Turn'
      : isNextInLine
      ? 'Next in Line'
      : formatWaitTime(liveQueue?.estimatedWaitMinutes);

  const isCheckedIn = Boolean(appointment.isCheckedIn);

  const clinicName = appointment.clinic?.clinicName || 'MediArca Clinic';
  const clinicAddress =
    appointment.clinic?.address ||
    doctor?.clinicAddress ||
    'Healthcare Facility';

  const tokenDisplay =
    isPendingApproval || queueNumber <= 0
      ? `#${estToken} (Estimated)`
      : `#${queueNumber}`;

  return {
    isToday,
    estToken,
    officialToken: queueNumber,
    tokenDisplay,
    isPendingApproval,
    isWaiting,
    isInConsultation,
    isCompleted,
    isExpired,
    isCancelled,
    isServing,
    isNextInLine,
    receptionistPhone,
    receptionistName,
    doctorDisplayName,
    cleanShiftWindow: cleanShift,
    waitTimeDisplay,
    patientsAhead,
    currentServingQueueNumber,
    isCheckedIn,
    clinicName,
    clinicAddress,
  };
};
