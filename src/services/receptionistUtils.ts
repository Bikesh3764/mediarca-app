/**
 * Receptionist Desk Utilities for MediArca Mobile
 * Handles:
 * - Walk-in patient payload validation (+91 Indian phone, clinical bounds)
 * - Temporary password change validation (min 8 chars, distinct new password)
 * - Counter camera patient ticket QR parser (JSON, URLs, UUIDs)
 * - Multi-doctor queue aggregation and overview metrics
 * - Queue sequential ordering and filtering
 * - Currency formatting (INR)
 */

import { isValidIndianPhone, sanitizeIndianPhone } from '../utils/phoneUtils';
import type { ReceptionistLinkedDoctor, ReceptionistQueueItem } from './api';

export interface WalkinValidationResult {
  isValid: boolean;
  errors: {
    patientName?: string;
    patientPhone?: string;
    doctorId?: string;
    slotId?: string;
    patientAge?: string;
    general?: string;
  };
  message?: string;
}

export interface PasswordChangeValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ParsedTicketQr {
  appointmentId: string;
  doctorId?: string;
  clinicId?: string;
  queueNumber?: number;
}

/**
 * Validates receptionist counter walk-in registration payload.
 * Enforces:
 * - Patient full name >= 2 chars
 * - Valid 10-digit Indian mobile number
 * - Mandatory doctor selection
 * - Patient age within 0-125 years if specified
 */
export const validateWalkinPayload = (payload: {
  patientName?: string;
  patientPhone?: string;
  doctorId?: string;
  slotId?: string;
  patientAge?: string | number;
  isForOther?: boolean;
}): WalkinValidationResult => {
  const errors: WalkinValidationResult['errors'] = {};

  const cleanName = (payload.patientName || '').trim();
  if (!cleanName) {
    errors.patientName = 'Patient full name is required';
  } else if (cleanName.length < 2) {
    errors.patientName = 'Name must be at least 2 characters';
  } else if (!/[a-zA-Z]/.test(cleanName)) {
    errors.patientName = 'Name must contain alphabetical characters';
  }

  const cleanPhone = (payload.patientPhone || '').trim();
  if (!cleanPhone) {
    errors.patientPhone = '10-digit mobile number is required';
  } else if (!isValidIndianPhone(cleanPhone)) {
    errors.patientPhone = 'Enter a valid 10-digit Indian mobile number (+91)';
  }

  if (!payload.doctorId || !payload.doctorId.trim()) {
    errors.doctorId = 'Please select a practicing doctor';
  }

  if (payload.patientAge !== undefined && payload.patientAge !== null && String(payload.patientAge).trim() !== '') {
    const ageNum = parseInt(String(payload.patientAge).trim(), 10);
    if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 125) {
      errors.patientAge = 'Age must be between 0 and 125';
    }
  }

  if (payload.isForOther) {
    if (!payload.patientAge || String(payload.patientAge).trim() === '') {
      errors.patientAge = 'Age is required when booking for a family member';
    }
  }

  const isValid = Object.keys(errors).length === 0;
  const message = isValid ? undefined : Object.values(errors)[0];

  return { isValid, errors, message };
};

/**
 * Validates temporary password reset inputs for receptionists on first login.
 * Enforces:
 * - Current password non-empty
 * - New password at least 8 characters
 * - New password cannot equal current password
 * - Matching confirmation password if provided
 */
export const validatePasswordChange = (
  currentPassword?: string,
  newPassword?: string,
  confirmPassword?: string
): PasswordChangeValidationResult => {
  const cleanCurrent = (currentPassword || '').trim();
  const cleanNew = (newPassword || '').trim();

  if (!cleanCurrent) {
    return { isValid: false, error: 'Current temporary password is required' };
  }

  if (!cleanNew) {
    return { isValid: false, error: 'New password is required' };
  }

  if (cleanNew.length < 8) {
    return { isValid: false, error: 'New password must be at least 8 characters long' };
  }

  if (cleanNew === cleanCurrent) {
    return { isValid: false, error: 'New password must be different from temporary password' };
  }

  if (confirmPassword !== undefined && cleanNew !== confirmPassword.trim()) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

/**
 * Parses patient mobile ticket QR payloads scanned by counter receptionist camera.
 * Supports:
 * 1. JSON payload: {"appointmentId": "...", "doctorId": "..."} or {"id": "..."}
 * 2. URL with query params: https://mediarca.../pass?appointmentId=... or ?id=...
 * 3. URL path with UUID: https://mediarca.../passes/550e8400-e29b-41d4-a716-446655440000
 * 4. Raw standard UUID or appt_ prefixed identifier
 */
export const parseTicketQrPayload = (raw?: string | null): ParsedTicketQr | null => {
  if (!raw || typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;

  // 1. JSON Parsing
  if (
    (text.startsWith('{') && text.endsWith('}')) ||
    (text.startsWith('%7B') && text.endsWith('%7D'))
  ) {
    try {
      const decoded = text.startsWith('%7B') ? decodeURIComponent(text) : text;
      let parsed: any;
      try {
        parsed = JSON.parse(decoded);
      } catch {
        // Fallback for single-quoted JSON or Python-style dict strings
        const jsonNormalized = decoded.replace(/'/g, '"');
        parsed = JSON.parse(jsonNormalized);
      }

      const appointmentId = String(
        parsed.appointmentId ||
        parsed.appointment_id ||
        parsed.appointmentid ||
        parsed.id ||
        parsed.ticketId ||
        parsed.ticket_id ||
        parsed.ticketid ||
        ''
      ).trim();

      if (appointmentId) {
        return {
          appointmentId,
          doctorId: parsed.doctorId || parsed.doctor_id || undefined,
          clinicId: parsed.clinicId || parsed.clinic_id || undefined,
          queueNumber: typeof parsed.queueNumber === 'number' ? parsed.queueNumber : undefined,
        };
      }
    } catch {
      // Fall through
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

    const lowerQs = qs.toLowerCase();
    if (
      lowerQs.includes('appointmentid') ||
      lowerQs.includes('appointment_id') ||
      lowerQs.includes('ticketid') ||
      lowerQs.includes('ticket_id') ||
      lowerQs.includes('id=') ||
      lowerQs.startsWith('id=')
    ) {
      const params = new URLSearchParams(qs);
      let appointmentId = '';
      for (const key of ['appointmentId', 'appointment_id', 'appointmentid', 'ticketId', 'ticket_id', 'ticketid', 'id']) {
        const val = params.get(key);
        if (val && val.trim()) {
          appointmentId = val.trim();
          break;
        }
      }

      if (appointmentId) {
        return {
          appointmentId,
          doctorId: params.get('doctorId') || params.get('doctor_id') || undefined,
          clinicId: params.get('clinicId') || params.get('clinic_id') || undefined,
        };
      }
    }
  } catch {
    // Fall through
  }

  // 3. Raw standard UUID regex (e.g. 123e4567-e89b-12d3-a456-426614174000)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(text)) {
    return { appointmentId: text };
  }

  // 4. Raw appt_ prefixed string identifier
  if (/^appt_[a-zA-Z0-9_-]+$/.test(text)) {
    return { appointmentId: text };
  }

  // 5. Embedded UUID in URL path segment
  const pathUuidMatch = text.match(/\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i);
  if (pathUuidMatch) {
    return { appointmentId: pathUuidMatch[1] };
  }

  // 6. Embedded appt_ in URL path
  const pathApptMatch = text.match(/\b(appt_[a-zA-Z0-9_-]+)\b/);
  if (pathApptMatch) {
    return { appointmentId: pathApptMatch[1] };
  }

  return null;
};

/**
 * Aggregates multi-doctor clinical desk overview statistics.
 */
export const calculateMultiDoctorMetrics = (
  doctors: ReceptionistLinkedDoctor[] = []
): {
  totalDoctors: number;
  inCabinCount: number;
  steppedOutCount: number;
  notInCabinCount: number;
  totalWaitingCount: number;
  totalTodayBookings: number;
} => {
  let inCabinCount = 0;
  let steppedOutCount = 0;
  let notInCabinCount = 0;
  let totalWaitingCount = 0;
  let totalTodayBookings = 0;

  for (const doc of doctors) {
    totalWaitingCount += doc.todayWaitingPatients || 0;
    totalTodayBookings += doc.todayTotalBookings || 0;

    const status = doc.cabinStatus || 'IN_CABIN';
    if (status === 'IN_CABIN') {
      inCabinCount++;
    } else if (status === 'STEPPED_OUT') {
      steppedOutCount++;
    } else {
      notInCabinCount++;
    }
  }

  return {
    totalDoctors: doctors.length,
    inCabinCount,
    steppedOutCount,
    notInCabinCount,
    totalWaitingCount,
    totalTodayBookings,
  };
};

/**
 * Sorts patient queue appointments by queue token number ascending.
 */
export const sortReceptionistQueue = (
  appointments: ReceptionistQueueItem[] = []
): ReceptionistQueueItem[] => {
  return [...appointments].sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));
};

/**
 * Formats monetary amounts in Indian Rupees (₹).
 */
export const formatDisplayCurrency = (amount?: number | null): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

/**
 * Formats a queue token badge string (#1, #2, or Est. #4).
 */
export const formatDisplayToken = (
  tokenNumber?: number | null,
  isPending: boolean = false
): string => {
  const num = tokenNumber && tokenNumber > 0 ? tokenNumber : 1;
  return isPending ? `Est. #${num}` : `#${num}`;
};
