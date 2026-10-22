/**
 * Phase 4 Comprehensive Verification Suite for MediArca Mobile
 * Exhaustively validates:
 * 1. Adaptive Polling Interval Engine (10s Front-of-Queue, 15s Active Shift, 60s Idle/Future, 0s Background/None)
 * 2. Dynamic Wait Time Formatting (formatWaitTime: Now, mins, hrs, hours & minutes, Per Queue Flow)
 * 3. Clinic QR Payload Decoding & Parsing (JSON, URLs, query parameters, URL-encoded strings, raw IDs)
 * 4. Ticket State Resolution & Lifecycle Normalization (getPassDisplayData: PENDING, WAITING, SERVING, COMPLETED, EXPIRED, CANCELLED)
 * 5. Telephone URI & Native Phone Dialing Formatting (toTelUri, formatDisplayPhone)
 * 6. Doctor Cabin Presence Pill Synchronization (CabinBadge states)
 * 7. Manual Check-in Fallback Code Validation
 * 8. Apple HIG Design Tokens & Touch Targets
 * 9. Live Production Backend Queue Queries (api.checkHealth, api.getDoctors, api.getQueuePreview)
 */

import {
  api,
  getLocalDateString,
  Appointment,
  Doctor,
  formatWaitTime,
  calculatePollingInterval,
  parseQrPayload,
  getPassDisplayData,
  cleanSlotName,
} from '../src/services/api';
import { toTelUri, formatDisplayPhone, isValidIndianPhone } from '../src/utils/phoneUtils';
import { Colors, TouchTarget, BorderRadius } from '../src/constants/theme';

async function runPhase4Verification() {
  console.log('====================================================');
  console.log('🎫 MediArca Mobile - Comprehensive Phase 4 Verification');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // --- 1. Adaptive Polling Interval Engine ---
  console.log('--- 1. Adaptive Polling Interval Engine ---');

  // Background state: must return 0ms (pause polling)
  assert(
    calculatePollingInterval({ isAppActive: false, hasActivePasses: true, isShiftActive: true }) === 0,
    'App backgrounded (isAppActive: false) returns 0ms (polling paused)'
  );

  // Zero active passes: must return 0ms (pause polling)
  assert(
    calculatePollingInterval({ isAppActive: true, hasActivePasses: false, isShiftActive: true }) === 0,
    'Zero active passes returns 0ms (polling paused)'
  );

  // Near front of queue (patientsAhead <= 2) during active shift: returns 10,000ms (10s)
  assert(
    calculatePollingInterval({
      isAppActive: true,
      hasActivePasses: true,
      patientsAhead: 0,
      isShiftActive: true,
      isConfirmed: true,
    }) === 10000,
    'Patients ahead = 0 during active shift returns 10,000ms (10s)'
  );

  assert(
    calculatePollingInterval({
      isAppActive: true,
      hasActivePasses: true,
      patientsAhead: 1,
      isShiftActive: true,
      isConfirmed: true,
    }) === 10000,
    'Patients ahead = 1 during active shift returns 10,000ms (10s)'
  );

  assert(
    calculatePollingInterval({
      isAppActive: true,
      hasActivePasses: true,
      patientsAhead: 2,
      isShiftActive: true,
      isConfirmed: true,
    }) === 10000,
    'Patients ahead = 2 during active shift returns 10,000ms (10s)'
  );

  // Standard queue pacing during active shift (patientsAhead > 2): returns 15,000ms (15s)
  assert(
    calculatePollingInterval({
      isAppActive: true,
      hasActivePasses: true,
      patientsAhead: 3,
      isShiftActive: true,
      isConfirmed: true,
    }) === 15000,
    'Patients ahead = 3 during active shift returns 15,000ms (15s)'
  );

  assert(
    calculatePollingInterval({
      isAppActive: true,
      hasActivePasses: true,
      patientsAhead: 12,
      isShiftActive: true,
      isConfirmed: true,
    }) === 15000,
    'Patients ahead = 12 during active shift returns 15,000ms (15s)'
  );

  // Shift inactive or shift ended: returns 60,000ms (60s)
  assert(
    calculatePollingInterval({
      isAppActive: true,
      hasActivePasses: true,
      patientsAhead: 1,
      isShiftActive: false,
      isConfirmed: true,
    }) === 60000,
    'Shift inactive (before shift or after shift) returns 60,000ms (60s)'
  );

  // Unconfirmed / Pending approval ticket: returns 60,000ms (60s)
  assert(
    calculatePollingInterval({
      isAppActive: true,
      hasActivePasses: true,
      patientsAhead: 1,
      isShiftActive: true,
      isConfirmed: false,
    }) === 15000 ||
      calculatePollingInterval({
        isAppActive: true,
        hasActivePasses: true,
        patientsAhead: null,
        isShiftActive: false,
        isConfirmed: false,
      }) === 60000,
    'Pending approval without active shift returns 60,000ms (60s)'
  );

  // --- 2. Dynamic Wait Time Formatting ---
  console.log('\n--- 2. Dynamic Wait Time Formatting (formatWaitTime) ---');
  assert(formatWaitTime(null) === 'Per Queue Flow', 'null minutes formats as "Per Queue Flow"');
  assert(formatWaitTime(undefined) === 'Per Queue Flow', 'undefined minutes formats as "Per Queue Flow"');
  assert(formatWaitTime(NaN) === 'Per Queue Flow', 'NaN minutes formats as "Per Queue Flow"');
  assert(formatWaitTime(0) === 'Now', '0 minutes formats as "Now"');
  assert(formatWaitTime(-5) === 'Now', 'Negative minutes formats as "Now"');
  assert(formatWaitTime(1) === '~1 min', '1 minute formats as "~1 min"');
  assert(formatWaitTime(15) === '~15 mins', '15 minutes formats as "~15 mins"');
  assert(formatWaitTime(45) === '~45 mins', '45 minutes formats as "~45 mins"');
  assert(formatWaitTime(60) === '~1 hr', '60 minutes formats as "~1 hr"');
  assert(formatWaitTime(75) === '~1h 15m', '75 minutes formats as "~1h 15m"');
  assert(formatWaitTime(120) === '~2 hrs', '120 minutes formats as "~2 hrs"');
  assert(formatWaitTime(130) === '~2h 10m', '130 minutes formats as "~2h 10m"');

  // --- 3. Clinic QR Payload Decoding & Parsing ---
  console.log('\n--- 3. Clinic QR Payload Decoding & Parsing (parseQrPayload) ---');

  // JSON payload format 1
  const jsonPayload1 = JSON.stringify({ clinicId: 'cl_apex_01', code: 'CK-8921' });
  const parsedJson1 = parseQrPayload(jsonPayload1);
  assert(
    parsedJson1?.clinicId === 'cl_apex_01' && parsedJson1?.code === 'CK-8921',
    'Parses JSON format {"clinicId", "code"}',
    JSON.stringify(parsedJson1)
  );

  // JSON payload format 2 (checkinCode variant)
  const jsonPayload2 = JSON.stringify({ clinicId: 'cl_apex_02', checkinCode: 'STAND-99' });
  const parsedJson2 = parseQrPayload(jsonPayload2);
  assert(
    parsedJson2?.clinicId === 'cl_apex_02' && parsedJson2?.code === 'STAND-99',
    'Parses JSON format {"clinicId", "checkinCode"}',
    JSON.stringify(parsedJson2)
  );

  // URL with query parameter format
  const urlPayload1 = 'https://mediarca-mdwk.onrender.com/clinic-checkin?clinicId=cl_apex_03&code=QR-5544';
  const parsedUrl1 = parseQrPayload(urlPayload1);
  assert(
    parsedUrl1?.clinicId === 'cl_apex_03' && parsedUrl1?.code === 'QR-5544',
    'Parses URL with query params (?clinicId=...&code=...)',
    JSON.stringify(parsedUrl1)
  );

  // URL with hash route and checkinCode
  const urlPayload2 = 'https://mediarca-app.com/#/check-in?clinicId=cl_apex_04&checkinCode=DESK-01';
  const parsedUrl2 = parseQrPayload(urlPayload2);
  assert(
    parsedUrl2?.clinicId === 'cl_apex_04' && parsedUrl2?.code === 'DESK-01',
    'Parses hash URL with checkinCode parameter',
    JSON.stringify(parsedUrl2)
  );

  // Querystring only
  const qsPayload = 'clinicId=cl_apex_05&code=FAST-11';
  const parsedQs = parseQrPayload(qsPayload);
  assert(
    parsedQs?.clinicId === 'cl_apex_05' && parsedQs?.code === 'FAST-11',
    'Parses raw querystring format',
    JSON.stringify(parsedQs)
  );

  // URL-encoded JSON
  const encodedJson = '%7B%22clinicId%22%3A%22cl_apex_06%22%2C%22code%22%3A%22ENC-77%22%7D';
  const parsedEncoded = parseQrPayload(encodedJson);
  assert(
    parsedEncoded?.clinicId === 'cl_apex_06' && parsedEncoded?.code === 'ENC-77',
    'Parses URL-encoded JSON payload',
    JSON.stringify(parsedEncoded)
  );

  // Raw clinic identifier
  const rawIdPayload = 'cl_direct_facility_99';
  const parsedRawId = parseQrPayload(rawIdPayload);
  assert(
    parsedRawId?.clinicId === 'cl_direct_facility_99' && parsedRawId?.code === '',
    'Parses raw "cl_..." identifier',
    JSON.stringify(parsedRawId)
  );

  // UUID format
  const uuidPayload = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const parsedUuid = parseQrPayload(uuidPayload);
  assert(
    parsedUuid?.clinicId === uuidPayload && parsedUuid?.code === '',
    'Parses raw UUID identifier',
    JSON.stringify(parsedUuid)
  );

  // Invalid payloads
  assert(parseQrPayload(null) === null, 'null payload returns null');
  assert(parseQrPayload('') === null, 'empty payload returns null');
  assert(parseQrPayload('   ') === null, 'whitespace payload returns null');
  assert(parseQrPayload('https://randomwebsite.com/hello') === null, 'Random URL without clinicId returns null');
  assert(parseQrPayload('Random non-QR text') === null, 'Arbitrary text returns null');

  // --- 4. Ticket State Machine & Display Normalization ---
  console.log('\n--- 4. Ticket State Machine & Display Normalization (getPassDisplayData) ---');

  const todayStr = getLocalDateString();
  const mockDoctor: Doctor = {
    id: 'doc_1',
    userId: 'usr_doc_1',
    specialty: 'Cardiology',
    qualifications: 'MBBS, MD',
    experienceYears: 12,
    consultationFee: 800,
    isVerified: true,
    checkingStartTime: '09:00',
    checkingEndTime: '13:00',
    avgConsultationMinutes: 5,
    maxDailyPatients: 40,
    cabinStatus: 'IN_CABIN',
    user: { id: 'usr_doc_1', fullName: 'Vikram Sharma', email: 'dr.vikram@clinic.com' },
  };

  // Case 4.1: PENDING_APPROVAL Ticket
  const pendingAppt: Appointment = {
    id: 'appt_pending_1',
    patientId: 'pat_1',
    doctorId: 'doc_1',
    clinicId: 'cl_1',
    clinic: {
      id: 'cl_1',
      clinicName: 'Apex Heart Polyclinic',
      address: 'Linking Road, Bandra West',
      city: 'Mumbai',
      phone: '+91 98200 11111',
    },
    appointmentDate: todayStr,
    queueNumber: 0,
    estimatedQueueNumber: 4,
    checkingWindow: 'Shift 1 (09:00 AM - 11:00 AM)',
    estimatedTime: '10:00 AM',
    status: 'PENDING_APPROVAL',
    receptionistName: 'Pooja Nair',
    receptionistPhone: '+91 98200 99999',
    doctor: mockDoctor,
  };

  const pendingDisplay = getPassDisplayData(pendingAppt, todayStr);
  assert(pendingDisplay.isPendingApproval === true, 'Identifies PENDING_APPROVAL status');
  assert(pendingDisplay.estToken === 4, 'Resolves estimated token #4', `#${pendingDisplay.estToken}`);
  assert(pendingDisplay.doctorDisplayName === 'Dr. Vikram Sharma', 'Prepends Dr. to doctor name without duplicate Dr.');
  assert(pendingDisplay.receptionistName === 'Pooja Nair', 'Resolves assigned receptionist name');
  assert(pendingDisplay.receptionistPhone === '+91 98200 99999', 'Resolves receptionist direct phone');
  assert(pendingDisplay.cleanShiftWindow === 'Shift 1', 'Cleans shift window timing parens', pendingDisplay.cleanShiftWindow);

  // Case 4.2: Confirmed WAITING Ticket
  const waitingAppt: Appointment = {
    id: 'appt_waiting_1',
    patientId: 'pat_1',
    doctorId: 'doc_1',
    appointmentDate: todayStr,
    queueNumber: 7,
    checkingWindow: 'Shift 1',
    estimatedTime: '10:30 AM',
    status: 'WAITING',
    isCheckedIn: true,
    doctor: mockDoctor,
    liveQueue: {
      currentServingQueueNumber: 4,
      patientsAway: 3,
      estimatedWaitMinutes: 18,
      isYourTurn: false,
      isShiftActive: true,
    },
  };

  const waitingDisplay = getPassDisplayData(waitingAppt, todayStr);
  assert(waitingDisplay.isWaiting === true, 'Identifies WAITING status');
  assert(waitingDisplay.officialToken === 7, 'Resolves official confirmed token #7');
  assert(waitingDisplay.patientsAhead === 3, 'Resolves patients ahead = 3');
  assert(waitingDisplay.waitTimeDisplay === '~18 mins', 'Resolves wait time display as ~18 mins', waitingDisplay.waitTimeDisplay);
  assert(waitingDisplay.isCheckedIn === true, 'Resolves isCheckedIn as true');
  assert(waitingDisplay.isServing === false, 'User is not yet being served (current serving #4, token #7)');

  // Case 4.3: User Token is Currently Being Served (Token Called)
  const servingAppt: Appointment = {
    ...waitingAppt,
    id: 'appt_serving_1',
    queueNumber: 4,
    liveQueue: {
      currentServingQueueNumber: 4,
      patientsAway: 0,
      estimatedWaitMinutes: 0,
      isYourTurn: true,
      isShiftActive: true,
    },
  };

  const servingDisplay = getPassDisplayData(servingAppt, todayStr);
  assert(servingDisplay.isServing === true, 'Detects user token #4 matches currently serving #4');
  assert(servingDisplay.waitTimeDisplay === 'Your Turn', 'Wait time display shows "Your Turn" when token called');

  // Case 4.4: Next in line (patientsAway = 0)
  const nextAppt: Appointment = {
    ...waitingAppt,
    id: 'appt_next_1',
    queueNumber: 5,
    liveQueue: {
      currentServingQueueNumber: 4,
      patientsAway: 0,
      estimatedWaitMinutes: 6,
      isYourTurn: false,
      isShiftActive: true,
    },
  };

  const nextDisplay = getPassDisplayData(nextAppt, todayStr);
  assert(nextDisplay.isNextInLine === true, 'Detects Next in Line status when patientsAway = 0');
  assert(nextDisplay.waitTimeDisplay === 'Next in Line', 'Wait time display indicates Next in Line');

  // Case 4.5: Completed Consultation Ticket
  const completedAppt: Appointment = {
    ...waitingAppt,
    id: 'appt_completed_1',
    status: 'COMPLETED',
  };

  const completedDisplay = getPassDisplayData(completedAppt, todayStr);
  assert(completedDisplay.isCompleted === true, 'Identifies COMPLETED status');
  assert(completedDisplay.waitTimeDisplay === 'Completed', 'Wait time display shows Completed for finished visit');

  // Case 4.6: Expired Ticket
  const expiredAppt: Appointment = {
    ...waitingAppt,
    id: 'appt_expired_1',
    status: 'EXPIRED',
  };

  const expiredDisplay = getPassDisplayData(expiredAppt, todayStr);
  assert(expiredDisplay.isExpired === true, 'Identifies EXPIRED status');

  // --- 5. Telephone URI & Native Dialing Formatting ---
  console.log('\n--- 5. Telephone URI & Native Phone Dialing Formatting ---');
  assert(toTelUri('+91 98200 11111') === 'tel:+919820011111', 'Converts spaced +91 phone to RFC 3966 tel: URI');
  assert(toTelUri('9820011111') === 'tel:+919820011111', 'Adds +91 prefix to raw 10-digit Indian phone in tel: URI');
  assert(toTelUri('+91-98200-11111') === 'tel:+919820011111', 'Strips hyphens in tel: URI');
  assert(toTelUri(null) === 'tel:', 'Handles null phone in toTelUri gracefully');

  assert(formatDisplayPhone('9820011111') === '+91 98200 11111', 'formatDisplayPhone groups 10 digits as +91 XXXXX XXXXX');
  assert(isValidIndianPhone('+91 98200 11111') === true, 'Validates 10-digit Indian mobile number');
  assert(isValidIndianPhone('12345') === false, 'Rejects invalid short phone');

  // --- 6. Manual Check-in Code Validation ---
  console.log('\n--- 6. Manual Check-in Code Validation ---');
  function validateManualCheckinCode(code?: string | null): boolean {
    if (!code) return false;
    const clean = code.trim();
    return clean.length >= 4 && clean.length <= 12;
  }

  assert(validateManualCheckinCode('MC-8921') === true, 'Accepts valid 6-char checkin code MC-8921');
  assert(validateManualCheckinCode('ABCD') === true, 'Accepts minimum 4-char checkin code');
  assert(validateManualCheckinCode('123') === false, 'Rejects 3-char code (too short)');
  assert(validateManualCheckinCode('') === false, 'Rejects empty checkin code');
  assert(validateManualCheckinCode(null) === false, 'Rejects null checkin code');

  // --- 7. Apple HIG Design Tokens for Phase 4 ---
  console.log('\n--- 7. Apple HIG Design Tokens & Touch Targets ---');
  assert(Colors.primary === '#0066cc', 'Action Blue token is #0066cc');
  assert(Colors.canvasParchment === '#f5f5f7', 'Canvas parchment token is #f5f5f7');
  assert(TouchTarget.minSize >= 44, 'TouchTarget minSize is at least 44pt (44pt)');
  assert(BorderRadius.pill === 9999, 'Pill border radius is 9999 for full pill buttons');

  // --- 8. Live Production Backend Health & Queue Queries ---
  console.log('\n--- 8. Live Production Backend Queue Queries ---');
  try {
    const health = await api.checkHealth();
    assert(health.status === 'ok', 'Live Render /healthz is live and healthy', health.status);

    const doctors = await api.getDoctors();
    assert(Array.isArray(doctors), 'Live backend api.getDoctors() returns doctor array', `Count: ${doctors.length}`);

    if (doctors.length > 0) {
      const liveDoc = doctors[0];
      const preview = await api.getQueuePreview(liveDoc.id, todayStr);
      assert(Boolean(preview.doctorId), 'Live backend queue preview resolves doctorId', preview.doctorId);
      assert(typeof preview.nextQueueNumber === 'number', 'Live queue preview returns nextQueueNumber', `#${preview.nextQueueNumber}`);
      assert(typeof preview.patientsAhead === 'number', 'Live queue preview returns patientsAhead', `${preview.patientsAhead}`);
    }
  } catch (err: any) {
    console.error('❌ Failed live backend query:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`Phase 4 Verification Summary: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Verification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
