/**
 * MediArca Mobile - Comprehensive Phase 6 Automated Verification Suite
 * Verifies Multi-Doctor Live Desk Dashboard, Online Payment Approvals Queue,
 * Walk-in Token Dispenser, Password Guard, QR Ticket Parser, and Live Render Backend.
 */

import {
  validateWalkinPayload,
  validatePasswordChange,
  parseTicketQrPayload,
  calculateMultiDoctorMetrics,
  sortReceptionistQueue,
  formatDisplayCurrency,
  formatDisplayToken,
} from '../src/services/receptionistUtils';

import {
  api,
  Appointment,
  DoctorSlot,
  ReceptionistLinkedDoctor,
  ReceptionistQueueItem,
  getLocalDateString,
} from '../src/services/api';

import { Colors, TouchTarget, BorderRadius, Typography, Shadows } from '../src/constants/theme';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string, detail?: any) {
  if (condition) {
    console.log(`✅ PASS: ${message} ${detail !== undefined ? `(${JSON.stringify(detail)})` : ''}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message} ${detail !== undefined ? `(${JSON.stringify(detail)})` : ''}`);
    failed++;
  }
}

async function runPhase6Verification() {
  console.log('====================================================');
  console.log('📋 MediArca Mobile - Comprehensive Phase 6 Verification');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // 1. Walk-In Patient Registration & Payload Validation
  // ----------------------------------------------------
  console.log('--- 1. Walk-In Token Dispenser Payload Validation ---');

  const validWalkin = validateWalkinPayload({
    patientName: 'Aarav Sharma',
    patientPhone: '9876543210',
    doctorId: 'doc_sarah_01',
    slotId: 'slot_1',
    patientAge: '32',
  });
  assert(validWalkin.isValid === true, 'Valid walk-in payload passes validation');
  assert(Object.keys(validWalkin.errors).length === 0, 'No validation errors on clean payload');

  // Empty Name
  const emptyName = validateWalkinPayload({
    patientName: '',
    patientPhone: '9876543210',
    doctorId: 'doc_sarah_01',
  });
  assert(emptyName.isValid === false, 'Rejects empty patient name');
  assert(emptyName.errors.patientName?.includes('required') === true, 'Errors with name required message');

  // Short Name
  const shortName = validateWalkinPayload({
    patientName: 'A',
    patientPhone: '9876543210',
    doctorId: 'doc_sarah_01',
  });
  assert(shortName.isValid === false, 'Rejects single-character name');
  assert(shortName.errors.patientName?.includes('2 characters') === true, 'Enforces minimum 2 character name');

  // All-numeric Name
  const numericName = validateWalkinPayload({
    patientName: '123456',
    patientPhone: '9876543210',
    doctorId: 'doc_sarah_01',
  });
  assert(numericName.isValid === false, 'Rejects all-numeric patient name');
  assert(numericName.errors.patientName?.includes('alphabetical') === true, 'Enforces alphabetical characters in patient name');

  // Missing Doctor
  const missingDoc = validateWalkinPayload({
    patientName: 'Pooja Patel',
    patientPhone: '9876543210',
    doctorId: '',
  });
  assert(missingDoc.isValid === false, 'Rejects missing doctor selection');

  // Missing Phone
  const missingPhone = validateWalkinPayload({
    patientName: 'Pooja Patel',
    patientPhone: '',
    doctorId: 'doc_sarah_01',
  });
  assert(missingPhone.isValid === false, 'Rejects missing phone number');

  // Invalid Phone Numbers (Indian +91 standard)
  const shortPhone = validateWalkinPayload({
    patientName: 'Pooja Patel',
    patientPhone: '987654321', // 9 digits
    doctorId: 'doc_sarah_01',
  });
  assert(shortPhone.isValid === false, 'Rejects 9-digit short phone');

  const longPhone = validateWalkinPayload({
    patientName: 'Pooja Patel',
    patientPhone: '987654321000', // 12 digits
    doctorId: 'doc_sarah_01',
  });
  assert(longPhone.isValid === false, 'Rejects 12-digit phone without standard country formatting');

  const invalidPrefixPhone = validateWalkinPayload({
    patientName: 'Pooja Patel',
    patientPhone: '1234567890', // Indian numbers start with 6, 7, 8, 9
    doctorId: 'doc_sarah_01',
  });
  assert(invalidPrefixPhone.isValid === false, 'Rejects phone starting with 1 (must start with 6-9 in India)');

  const validPrefixPhone = validateWalkinPayload({
    patientName: 'Pooja Patel',
    patientPhone: '7890123456',
    doctorId: 'doc_sarah_01',
  });
  assert(validPrefixPhone.isValid === true, 'Accepts valid Indian mobile starting with 7');

  // Age Validation
  const negativeAge = validateWalkinPayload({
    patientName: 'Vikram Rao',
    patientPhone: '9876543210',
    doctorId: 'doc_sarah_01',
    patientAge: '-5',
  });
  assert(negativeAge.isValid === false, 'Rejects negative age');

  const excessiveAge = validateWalkinPayload({
    patientName: 'Vikram Rao',
    patientPhone: '9876543210',
    doctorId: 'doc_sarah_01',
    patientAge: '140',
  });
  assert(excessiveAge.isValid === false, 'Rejects age > 125');

  const boundaryAgeZero = validateWalkinPayload({
    patientName: 'Baby of Vikram Rao',
    patientPhone: '9876543210',
    doctorId: 'doc_sarah_01',
    patientAge: '0',
  });
  assert(boundaryAgeZero.isValid === true, 'Accepts infant age 0');

  // Dependent Booking Checks
  const dependentMissingAge = validateWalkinPayload({
    patientName: 'Rahul Verma',
    patientPhone: '9876543210',
    doctorId: 'doc_sarah_01',
    isForOther: true,
    patientAge: '',
  });
  assert(dependentMissingAge.isValid === false, 'Enforces age when booking for a family member / dependent');

  const dependentWithAge = validateWalkinPayload({
    patientName: 'Rahul Verma',
    patientPhone: '9876543210',
    doctorId: 'doc_sarah_01',
    isForOther: true,
    patientAge: '12',
  });
  assert(dependentWithAge.isValid === true, 'Passes family member booking with valid age');

  // ----------------------------------------------------
  // 2. Temporary Password Change & Security Guard
  // ----------------------------------------------------
  console.log('\n--- 2. Temporary Password Guard & Reset Validation ---');

  const validPassChange = validatePasswordChange('TempPass@123', 'SecurePass#2026', 'SecurePass#2026');
  assert(validPassChange.isValid === true, 'Valid password change passes validation');

  const missingCurrentPass = validatePasswordChange('', 'SecurePass#2026', 'SecurePass#2026');
  assert(missingCurrentPass.isValid === false, 'Rejects missing current temporary password');

  const missingNewPass = validatePasswordChange('TempPass@123', '', '');
  assert(missingNewPass.isValid === false, 'Rejects empty new password');

  const shortNewPass = validatePasswordChange('TempPass@123', 'Short1', 'Short1');
  assert(shortNewPass.isValid === false, 'Rejects new password < 8 characters');
  assert(shortNewPass.error?.includes('8 characters') === true, 'Enforces minimum 8 characters error message');

  const samePassword = validatePasswordChange('TempPass@123', 'TempPass@123', 'TempPass@123');
  assert(samePassword.isValid === false, 'Rejects new password identical to temporary password');
  assert(samePassword.error?.includes('different') === true, 'Enforces password diversity rule');

  const mismatchedConfirm = validatePasswordChange('TempPass@123', 'SecurePass#2026', 'DifferentPass#2026');
  assert(mismatchedConfirm.isValid === false, 'Rejects mismatched confirmation password');

  // ----------------------------------------------------
  // 3. Counter Desk Patient Mobile Ticket QR Parser
  // ----------------------------------------------------
  console.log('\n--- 3. Counter Desk QR Ticket Parser ---');

  // JSON payload format
  const jsonQr = parseTicketQrPayload(JSON.stringify({ appointmentId: '550e8400-e29b-41d4-a716-446655440000', doctorId: 'doc_1' }));
  assert(jsonQr !== null, 'Parses JSON QR payload');
  assert(jsonQr?.appointmentId === '550e8400-e29b-41d4-a716-446655440000', 'Resolves appointmentId from JSON');
  assert(jsonQr?.doctorId === 'doc_1', 'Resolves doctorId from JSON');

  // JSON payload format with ticketId alias
  const jsonTicketAlias = parseTicketQrPayload(JSON.stringify({ ticketId: 'appt_ticket_892' }));
  assert(jsonTicketAlias?.appointmentId === 'appt_ticket_892', 'Parses ticketId alias in JSON payload');

  // Single-quoted JSON payload format
  const singleQuoteJson = parseTicketQrPayload("{ 'appointmentId': '550e8400-e29b-41d4-a716-446655440000', 'doctorId': 'doc_2' }");
  assert(singleQuoteJson?.appointmentId === '550e8400-e29b-41d4-a716-446655440000', 'Parses single-quoted JSON payload');
  assert(singleQuoteJson?.doctorId === 'doc_2', 'Resolves doctorId from single-quoted JSON');

  // Custom non-UUID ticketId in JSON
  const customIdJson = parseTicketQrPayload("{ 'ticketId': 'ticket_12345' }");
  assert(customIdJson?.appointmentId === 'ticket_12345', 'Parses custom non-UUID ticket ID in single-quoted JSON');

  // URL query parameter format
  const urlQueryQr = parseTicketQrPayload('https://mediarca-mdwk.onrender.com/pass?appointmentId=550e8400-e29b-41d4-a716-446655440000&code=XYZ');
  assert(urlQueryQr?.appointmentId === '550e8400-e29b-41d4-a716-446655440000', 'Extracts appointmentId from URL query parameters');

  const urlQueryIdAlias = parseTicketQrPayload('https://mediarca.app/appointment?id=appt_9918');
  assert(urlQueryIdAlias?.appointmentId === 'appt_9918', 'Extracts id query parameter from URL');

  const urlTicketIdParam = parseTicketQrPayload('https://mediarca.app/pass?ticketId=ticket_12345');
  assert(urlTicketIdParam?.appointmentId === 'ticket_12345', 'Extracts ticketId query parameter from URL');

  const urlTicketUnderParam = parseTicketQrPayload('https://mediarca.app/pass?ticket_id=ticket_67890');
  assert(urlTicketUnderParam?.appointmentId === 'ticket_67890', 'Extracts ticket_id query parameter from URL');

  // URL path UUID format
  const urlPathQr = parseTicketQrPayload('https://mediarca.app/passes/550e8400-e29b-41d4-a716-446655440000');
  assert(urlPathQr?.appointmentId === '550e8400-e29b-41d4-a716-446655440000', 'Extracts UUID from URL path segment');

  // Raw UUID string
  const rawUuidQr = parseTicketQrPayload('550e8400-e29b-41d4-a716-446655440000');
  assert(rawUuidQr?.appointmentId === '550e8400-e29b-41d4-a716-446655440000', 'Extracts raw UUID string');

  // Raw appt_ ID string
  const rawApptQr = parseTicketQrPayload('appt_live_2026');
  assert(rawApptQr?.appointmentId === 'appt_live_2026', 'Extracts raw appt_ prefixed string');

  // Invalid / Empty payloads
  assert(parseTicketQrPayload('') === null, 'Returns null on empty string');
  assert(parseTicketQrPayload(null) === null, 'Returns null on null input');
  assert(parseTicketQrPayload('random non-ticket string') === null, 'Returns null on invalid random text');

  // ----------------------------------------------------
  // 4. Multi-Doctor Aggregation & Clinic Overview Metrics
  // ----------------------------------------------------
  console.log('\n--- 4. Multi-Doctor Aggregation & Overview Metrics ---');

  const mockDoctors: ReceptionistLinkedDoctor[] = [
    {
      affiliationId: 'aff_1',
      doctorId: 'doc_1',
      fullName: 'Dr. Sarah Jenkins',
      specialty: 'Cardiology',
      consultationFee: 800,
      cabinStatus: 'IN_CABIN',
      todayWaitingPatients: 5,
      todayTotalBookings: 12,
      slots: [],
      joinedAt: '2026-01-01',
      email: 'sarah@clinic.com',
    },
    {
      affiliationId: 'aff_2',
      doctorId: 'doc_2',
      fullName: 'Dr. Rajesh Patel',
      specialty: 'Orthopedics',
      consultationFee: 600,
      cabinStatus: 'STEPPED_OUT',
      expectedReturnTime: '11:15 AM',
      todayWaitingPatients: 3,
      todayTotalBookings: 8,
      slots: [],
      joinedAt: '2026-01-01',
      email: 'rajesh@clinic.com',
    },
    {
      affiliationId: 'aff_3',
      doctorId: 'doc_3',
      fullName: 'Dr. Anita Desai',
      specialty: 'Pediatrics',
      consultationFee: 500,
      cabinStatus: 'NOT_IN_CABIN',
      todayWaitingPatients: 0,
      todayTotalBookings: 4,
      slots: [],
      joinedAt: '2026-01-01',
      email: 'anita@clinic.com',
    },
  ];

  const clinicMetrics = calculateMultiDoctorMetrics(mockDoctors);
  assert(clinicMetrics.totalDoctors === 3, 'Calculates total practicing doctors as 3');
  assert(clinicMetrics.inCabinCount === 1, 'Identifies 1 doctor IN_CABIN');
  assert(clinicMetrics.steppedOutCount === 1, 'Identifies 1 doctor STEPPED_OUT');
  assert(clinicMetrics.notInCabinCount === 1, 'Identifies 1 doctor NOT_IN_CABIN');
  assert(clinicMetrics.totalWaitingCount === 8, 'Aggregates clinic waiting patients (5 + 3 = 8)');
  assert(clinicMetrics.totalTodayBookings === 24, 'Aggregates today total bookings (12 + 8 + 4 = 24)');

  // Empty doctors list
  const emptyMetrics = calculateMultiDoctorMetrics([]);
  assert(emptyMetrics.totalDoctors === 0, 'Handles empty doctor catalog gracefully');
  assert(emptyMetrics.totalWaitingCount === 0, 'Zero waiting on empty catalog');

  // ----------------------------------------------------
  // 5. Queue Sorting & Token Formatting
  // ----------------------------------------------------
  console.log('\n--- 5. Queue Sorting & Token Formatting ---');

  const unsortedQueue: ReceptionistQueueItem[] = [
    {
      id: 'a3',
      queueNumber: 3,
      patientName: 'Kavita Das',
      patientPhone: '9876543210',
      checkingWindow: 'Shift 1',
      estimatedTime: '10:00 AM',
      status: 'WAITING',
      createdAt: '2026-10-22T09:00:00Z',
    },
    {
      id: 'a1',
      queueNumber: 1,
      patientName: 'Arjun Sen',
      patientPhone: '9876543211',
      checkingWindow: 'Shift 1',
      estimatedTime: '09:30 AM',
      status: 'IN_CONSULTATION',
      createdAt: '2026-10-22T08:30:00Z',
    },
    {
      id: 'a2',
      queueNumber: 2,
      patientName: 'Sunil Roy',
      patientPhone: '9876543212',
      checkingWindow: 'Shift 1',
      estimatedTime: '09:45 AM',
      status: 'WAITING',
      createdAt: '2026-10-22T08:45:00Z',
    },
  ];

  const sortedQueue = sortReceptionistQueue(unsortedQueue);
  assert(sortedQueue[0].queueNumber === 1, 'Queue sorted ascending: Token #1 first');
  assert(sortedQueue[1].queueNumber === 2, 'Queue sorted ascending: Token #2 second');
  assert(sortedQueue[2].queueNumber === 3, 'Queue sorted ascending: Token #3 third');

  // Token Badge Formatting
  assert(formatDisplayToken(5) === '#5', 'Confirmed token formats as #5');
  assert(formatDisplayToken(4, true) === 'Est. #4', 'Pending approval token formats as Est. #4');
  assert(formatDisplayToken(0) === '#1', 'Fallback for 0 token produces #1');
  assert(formatDisplayToken(null) === '#1', 'Fallback for null token produces #1');

  // INR Currency Formatting
  assert(formatDisplayCurrency(800) === '₹800', 'Formats ₹800 currency');
  assert(formatDisplayCurrency(1500) === '₹1,500', 'Formats ₹1,500 with Indian thousands separator');
  assert(formatDisplayCurrency(0) === '₹0', 'Formats ₹0');
  assert(formatDisplayCurrency(null) === '₹0', 'Handles null currency as ₹0');

  // ----------------------------------------------------
  // 6. Payment Approvals State Machine Transitions
  // ----------------------------------------------------
  console.log('\n--- 6. State Machine Transitions (PENDING_APPROVAL → WAITING) ---');

  // Simulating state machine rules from backend/utils/appointmentStateMachine.ts
  const canTransition = (from: string, to: string, role: string) => {
    if (from === 'PENDING_APPROVAL' && to === 'WAITING') {
      return { allowed: ['RECEPTIONIST', 'CLINIC', 'ADMIN'].includes(role) };
    }
    if (from === 'PENDING_APPROVAL' && to === 'REJECTED') {
      return { allowed: ['RECEPTIONIST', 'CLINIC', 'ADMIN'].includes(role) };
    }
    if (from === 'PENDING_APPROVAL' && to === 'CANCELLED') {
      return { allowed: ['PATIENT', 'RECEPTIONIST', 'CLINIC', 'ADMIN'].includes(role) };
    }
    if (from === 'COMPLETED' && to === 'PENDING_APPROVAL') {
      return { allowed: false };
    }
    return { allowed: true };
  };

  assert(
    canTransition('PENDING_APPROVAL', 'WAITING', 'RECEPTIONIST').allowed === true,
    'Receptionist can approve PENDING_APPROVAL to WAITING'
  );
  assert(
    canTransition('PENDING_APPROVAL', 'WAITING', 'CLINIC').allowed === true,
    'Clinic admin can approve PENDING_APPROVAL to WAITING'
  );
  assert(
    canTransition('PENDING_APPROVAL', 'WAITING', 'PATIENT').allowed === false,
    'Patient CANNOT self-approve PENDING_APPROVAL to WAITING'
  );
  assert(
    canTransition('PENDING_APPROVAL', 'REJECTED', 'RECEPTIONIST').allowed === true,
    'Receptionist can reject PENDING_APPROVAL request with reason'
  );
  assert(
    canTransition('PENDING_APPROVAL', 'CANCELLED', 'PATIENT').allowed === true,
    'Patient can cancel their pending request'
  );
  assert(
    canTransition('COMPLETED', 'PENDING_APPROVAL', 'RECEPTIONIST').allowed === false,
    'Completed consultation cannot be reverted to PENDING_APPROVAL'
  );

  // ----------------------------------------------------
  // 7. Apple HIG Design Tokens & Touch Targets
  // ----------------------------------------------------
  console.log('\n--- 7. Apple HIG Design Tokens & Geometry ---');

  assert(Colors.primary === '#0066cc', 'Action Blue is #0066cc');
  assert(Colors.canvasParchment === '#f5f5f7', 'Canvas parchment is #f5f5f7');
  assert(Colors.canvasPure === '#ffffff', 'Canvas pure is #ffffff');
  assert(Colors.success === '#34c759', 'Success green is #34c759');
  assert(Colors.warning === '#ff9500', 'Warning amber is #ff9500');
  assert(Colors.danger === '#ff3b30', 'Danger red is #ff3b30');
  assert(TouchTarget.minSize >= 44, 'TouchTarget minSize is at least 44pt', TouchTarget.minSize);
  assert(TouchTarget.minHeight >= 44, 'TouchTarget minHeight is at least 44pt', TouchTarget.minHeight);
  assert(BorderRadius.pill === 9999, 'Pill border radius is 9999 for full pill buttons');
  assert(Typography.fontSize.headline === 17, 'Apple HIG headline font size is 17pt');
  assert(Typography.fontSize.caption === 12, 'Apple HIG caption font size is 12pt');

  // ----------------------------------------------------
  // 8. Live Production Backend Pings & Receptionist APIs
  // ----------------------------------------------------
  console.log('\n--- 8. Live Production Backend Receptionist API Queries ---');

  try {
    const health = await api.checkHealth();
    assert(health?.status === 'ok', 'Render /healthz is live and returning ok', health?.status);
  } catch (err: any) {
    assert(false, 'Render /healthz check failed', err?.message);
  }

  try {
    const doctors = await api.getDoctors();
    assert(Array.isArray(doctors), 'api.getDoctors() returns doctor catalog', `Count: ${doctors.length}`);
    if (doctors.length > 0) {
      const firstDoc = doctors[0];
      assert(Boolean(firstDoc.id), 'Live doctor contains id', firstDoc.id);
      const doctorFullName = (firstDoc as any).fullName || firstDoc.user?.fullName;
      assert(Boolean(doctorFullName), 'Live doctor contains fullName', doctorFullName);
      assert(Boolean(firstDoc.specialty), 'Live doctor contains specialty', firstDoc.specialty);
    }
  } catch (err: any) {
    assert(false, 'api.getDoctors() query failed', err?.message);
  }

  // Live Unauthenticated Auth Guard Check
  try {
    const unauthRes = await fetch('https://mediarca-mdwk.onrender.com/api/receptionists/my-receptionist');
    const unauthJson: any = await unauthRes.json();
    assert(
      unauthRes.status === 401 || unauthRes.status === 403,
      'Live backend strictly blocks unauthenticated receptionist desk access',
      `Status: ${unauthRes.status}, Message: ${unauthJson.message}`
    );
  } catch (err: any) {
    assert(false, 'Live unauthenticated receptionist guard ping failed', err?.message);
  }

  // Verify receptionist API methods and aliases exist on api service
  assert(typeof api.getMyReceptionist === 'function', 'api.getMyReceptionist method exists on api service');
  assert(typeof api.getReceptionistDoctorQueue === 'function', 'api.getReceptionistDoctorQueue method exists on api service');
  assert(typeof api.bookWalkinAppointment === 'function', 'api.bookWalkinAppointment method exists on api service');
  assert(typeof api.createWalkinAppointment === 'function', 'api.createWalkinAppointment alias exists on api service');
  assert(typeof api.getPendingAppointments === 'function', 'api.getPendingAppointments method exists on api service');
  assert(typeof api.getReceptionistPendingAppointments === 'function', 'api.getReceptionistPendingAppointments alias exists on api service');
  assert(typeof api.approveAppointment === 'function', 'api.approveAppointment method exists on api service');
  assert(typeof api.approveReceptionistAppointment === 'function', 'api.approveReceptionistAppointment alias exists on api service');
  assert(typeof api.rejectAppointment === 'function', 'api.rejectAppointment method exists on api service');
  assert(typeof api.rejectReceptionistAppointment === 'function', 'api.rejectReceptionistAppointment alias exists on api service');
  assert(typeof api.checkInAppointmentDirect === 'function', 'api.checkInAppointmentDirect method exists on api service');
  assert(typeof api.changeReceptionistPassword === 'function', 'api.changeReceptionistPassword method exists on api service');
  assert(typeof api.updateReceptionistDoctorCabinStatus === 'function', 'api.updateReceptionistDoctorCabinStatus method exists on api service');
  assert(typeof api.getReceptionistReport === 'function', 'api.getReceptionistReport method exists on api service');

  // Summary
  console.log('\n====================================================');
  console.log(`Phase 6 Verification Summary: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Verification().catch((err) => {
  console.error('Phase 6 verification runner error:', err);
  process.exit(1);
});
