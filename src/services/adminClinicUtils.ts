/**
 * Admin Governance & Clinic Portal Utilities for MediArca Mobile
 * Handles:
 * - Contact Message Form Validation
 * - Clinic Profile & Desk Staff Validation
 * - Doctor/Clinic Verification State Machine Rules
 * - Account Deletion Safety Confirmation & Statutory Retention Notice (Google Play & NMC)
 * - Filtering & Searching for Admin & Clinic Tables
 */

import { Doctor, ClinicProfile, ContactMessageItem } from './api';
import { isValidIndianPhone, formatIndianPhone, sanitizeIndianPhone } from '../utils/phoneUtils';

export interface ContactMessagePayload {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Creates standardized JSON payload for clinic counter QR standees.
 */
export function createStandeeQrPayload(clinic: {
  id: string;
  clinicName: string;
  checkinCode?: string;
}): string {
  return JSON.stringify({
    clinicId: clinic.id,
    clinicName: clinic.clinicName,
    code: clinic.checkinCode || 'MEDI',
  });
}

/**
 * Validates user feedback / contact inquiry form submissions.
 */
export function validateContactMessage(payload: ContactMessagePayload): ValidationResult {
  const errors: Record<string, string> = {};

  if (!payload.fullName || !payload.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (payload.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!payload.email || !payload.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(payload.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (payload.phone && payload.phone.trim()) {
    if (!isValidIndianPhone(payload.phone.trim())) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6-9.';
    }
  }

  if (!payload.subject || !payload.subject.trim()) {
    errors.subject = 'Subject is required.';
  }

  if (!payload.message || !payload.message.trim()) {
    errors.message = 'Message is required.';
  } else if (payload.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates clinic facility profile editing.
 */
export function validateClinicProfile(data: {
  clinicName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.clinicName || !data.clinicName.trim()) {
    errors.clinicName = 'Clinic facility name is required.';
  } else if (data.clinicName.trim().length < 2) {
    errors.clinicName = 'Clinic facility name must be at least 2 characters.';
  }

  if (data.phone && data.phone.trim()) {
    if (!isValidIndianPhone(data.phone.trim())) {
      errors.phone = 'Please enter a valid 10-digit Indian phone number.';
    }
  }

  if (!data.address || !data.address.trim()) {
    errors.address = 'Facility street address is required.';
  }

  if (!data.city || !data.city.trim()) {
    errors.city = 'City is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates creation of a receptionist / desk staff account.
 */
export function validateReceptionistCreation(data: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  doctorIds?: string[];
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.fullName || !data.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !data.email.trim()) {
    errors.email = 'Staff email is required.';
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.password || data.password.length < 8) {
    errors.password = 'Temporary password must be at least 8 characters long.';
  }

  if (data.phone && data.phone.trim()) {
    if (!isValidIndianPhone(data.phone.trim())) {
      errors.phone = 'Phone number must be a valid 10-digit Indian number.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates Self-Serve Account Deletion confirmation input (Google Play Compliance).
 */
export function validateAccountDeletionConfirmation(confirmationInput: string): {
  isValid: boolean;
  error?: string;
} {
  const clean = typeof confirmationInput === 'string' ? confirmationInput.trim() : '';
  if (clean !== 'DELETE') {
    return {
      isValid: false,
      error: 'Please type the word DELETE in uppercase letters to confirm account removal.',
    };
  }
  return { isValid: true };
}

/**
 * Returns statutory legal & regulatory data retention disclosure required by Google Play & NMC.
 */
export function getRegulatoryRetentionDisclosure(): {
  dataDeleted: string[];
  dataRetained: string[];
  retentionPeriodYears: number;
  statutoryBasis: string;
} {
  return {
    dataDeleted: [
      'Account authentication credentials, password hashes, and active sessions',
      'Personal profile identifiers (email address, mobile phone number, avatar photo)',
      'Device push notification tokens and hardware identifiers',
      'Saved emergency contacts and blood group records from mobile app',
    ],
    dataRetained: [
      'Clinical consultation notes, diagnostic vitals, and doctor prescriptions',
      'Queue ticket logs and financial settlement audit trails',
    ],
    retentionPeriodYears: 3,
    statutoryBasis:
      'Indian National Medical Commission (NMC) Regulations & Medical Council of India (MCI) Code of Medical Ethics Regulation 1.3, mandating maintenance of medical records for 3 years for clinical audit and patient safety.',
  };
}

/**
 * Filter doctors list by status and keyword search.
 */
export function filterDoctorsByStatus(
  doctors: Doctor[],
  status: 'ALL' | 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED',
  searchQuery: string = ''
): Doctor[] {
  let list = doctors;

  if (status !== 'ALL') {
    list = list.filter((doc) => {
      const docStatus = doc.verificationStatus || (doc.isVerified ? 'VERIFIED' : 'PENDING');
      return docStatus.toUpperCase() === status;
    });
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (doc) =>
        (doc.user?.fullName && doc.user.fullName.toLowerCase().includes(q)) ||
        (Boolean((doc as any).fullName) && String((doc as any).fullName).toLowerCase().includes(q)) ||
        (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
        (doc.qualifications && doc.qualifications.toLowerCase().includes(q)) ||
        (doc.user?.email && doc.user.email.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * Filter clinics list by status and keyword search.
 */
export function filterClinicsByStatus(
  clinics: ClinicProfile[],
  status: 'ALL' | 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED',
  searchQuery: string = ''
): ClinicProfile[] {
  let list = clinics;

  if (status !== 'ALL') {
    list = list.filter((c) => {
      const clinicStatus = c.verificationStatus || (c.isVerified ? 'VERIFIED' : 'PENDING');
      return clinicStatus.toUpperCase() === status;
    });
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (c) =>
        (c.clinicName && c.clinicName.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }

  return list;
}

/**
 * Filter support inquiries by read status and keyword search.
 */
export function filterMessagesByStatus(
  messages: ContactMessageItem[],
  status: 'ALL' | 'NEW' | 'READ',
  searchQuery: string = ''
): ContactMessageItem[] {
  let list = messages;

  if (status === 'NEW') {
    list = list.filter((m) => m.status === 'NEW' || !m.status);
  } else if (status === 'READ') {
    list = list.filter((m) => m.status === 'READ' || m.status === 'RESOLVED');
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (m) =>
        (m.fullName && m.fullName.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        (m.message && m.message.toLowerCase().includes(q))
    );
  }

  return list;
}
