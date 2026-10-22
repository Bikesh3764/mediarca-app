/**
 * MediArca Mobile - Comprehensive Phase 5 Automated Verification Suite
 * Verifies Doctor OPD Live Queue, Sticky Cabin Presence, Vitals Validation,
 * Queue Partitioning, Schedule Math, HIG Weekday Discs, and Live Render Backend.
 */

import {
  validateBloodPressure,
  validatePulse,
  validateTemperature,
  validateWeight,
  validateAllVitals,
  calculateExpectedReturnTime,
  formatReturnDisplay,
  partitionDoctorQueue,
  isPatientArrivalVerified,
  calculateAverageConsultationMinutes,
  isDoctorOnLeave,
  isDoctorPracticingOnDate,
  APPLE_HIG_WEEKDAYS,
  QUICK_RETURN_MINUTES,
} from '../src/services/doctorUtils';

import {
  api,
  Appointment,
  DoctorLeave,
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

async function runPhase5Verification() {
  console.log('====================================================');
  console.log('🩺 MediArca Mobile - Comprehensive Phase 5 Verification');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // 1. Clinical Vitals Validation (BP, Pulse, Temp, Weight)
  // ----------------------------------------------------
  console.log('--- 1. Clinical Vitals Validation Engine ---');

  // Blood Pressure
  const normalBp = validateBloodPressure('120/80');
  assert(normalBp.isValid === true, '120/80 is valid BP');
  assert(normalBp.systolic === 120 && normalBp.diastolic === 80, 'Parses systolic 120 and diastolic 80');

  const spacedBp = validateBloodPressure(' 130 / 85 ');
  assert(spacedBp.isValid === true, 'Handles spaced blood pressure format');

  const unitSuffixedBp = validateBloodPressure('120/80 mmHg');
  assert(unitSuffixedBp.isValid === true && unitSuffixedBp.systolic === 120 && unitSuffixedBp.diastolic === 80, 'Handles unit-suffixed blood pressure format (120/80 mmHg)');

  const spacedUnitSuffixedBp = validateBloodPressure(' 135 / 85 mm hg ');
  assert(spacedUnitSuffixedBp.isValid === true && spacedUnitSuffixedBp.systolic === 135 && spacedUnitSuffixedBp.diastolic === 85, 'Handles spaced unit-suffixed format (135 / 85 mm hg)');

  const lowerBoundBp = validateBloodPressure('60/40');
  assert(lowerBoundBp.isValid === true, 'Boundary 60/40 is valid BP');

  const upperBoundBp = validateBloodPressure('260/160');
  assert(upperBoundBp.isValid === true, 'Boundary 260/160 is valid BP');

  const lowSystolic = validateBloodPressure('59/40');
  assert(lowSystolic.isValid === false, 'Rejects systolic < 60 mmHg', lowSystolic.error);

  const highSystolic = validateBloodPressure('261/80');
  assert(highSystolic.isValid === false, 'Rejects systolic > 260 mmHg', highSystolic.error);

  const lowDiastolic = validateBloodPressure('120/39');
  assert(lowDiastolic.isValid === false, 'Rejects diastolic < 40 mmHg', lowDiastolic.error);

  const highDiastolic = validateBloodPressure('120/161');
  assert(highDiastolic.isValid === false, 'Rejects diastolic > 160 mmHg', highDiastolic.error);

  const equalBp = validateBloodPressure('100/100');
  assert(equalBp.isValid === false, 'Rejects systolic equal to diastolic', equalBp.error);

  const invertedBp = validateBloodPressure('80/120');
  assert(invertedBp.isValid === false, 'Rejects systolic lower than diastolic (inverted)', invertedBp.error);

  const invalidFormatBp = validateBloodPressure('invalid-bp');
  assert(invalidFormatBp.isValid === false, 'Rejects non-numeric BP string', invalidFormatBp.error);

  const emptyBp = validateBloodPressure('');
  assert(emptyBp.isValid === true, 'Empty BP string considered valid optional intake');

  // Pulse
  const normalPulse = validatePulse('72');
  assert(normalPulse.isValid === true && normalPulse.pulse === 72, 'Normal pulse 72 bpm is valid');

  const boundLowPulse = validatePulse(30);
  assert(boundLowPulse.isValid === true, 'Boundary pulse 30 bpm is valid');

  const boundHighPulse = validatePulse(220);
  assert(boundHighPulse.isValid === true, 'Boundary pulse 220 bpm is valid');

  const tooLowPulse = validatePulse('29');
  assert(tooLowPulse.isValid === false, 'Rejects pulse < 30 bpm', tooLowPulse.error);

  const tooHighPulse = validatePulse('221');
  assert(tooHighPulse.isValid === false, 'Rejects pulse > 220 bpm', tooHighPulse.error);

  const nonNumPulse = validatePulse('fast');
  assert(nonNumPulse.isValid === false, 'Rejects non-numeric pulse', nonNumPulse.error);

  // Body Temperature
  const normalTemp = validateTemperature('98.6');
  assert(normalTemp.isValid === true && normalTemp.temp === 98.6, 'Normal temperature 98.6°F is valid');

  const boundLowTemp = validateTemperature('90.0');
  assert(boundLowTemp.isValid === true, 'Boundary temp 90.0°F is valid');

  const boundHighTemp = validateTemperature('110.0');
  assert(boundHighTemp.isValid === true, 'Boundary temp 110.0°F is valid');

  const tooLowTemp = validateTemperature('89.9');
  assert(tooLowTemp.isValid === false, 'Rejects temp < 90.0°F', tooLowTemp.error);

  const tooHighTemp = validateTemperature('110.1');
  assert(tooHighTemp.isValid === false, 'Rejects temp > 110.0°F', tooHighTemp.error);

  // Body Weight
  const normalWeight = validateWeight('68.5');
  assert(normalWeight.isValid === true && normalWeight.weight === 68.5, 'Normal weight 68.5 kg is valid');

  const boundLowWeight = validateWeight(1.0);
  assert(boundLowWeight.isValid === true, 'Boundary weight 1.0 kg is valid');

  const boundHighWeight = validateWeight(350.0);
  assert(boundHighWeight.isValid === true, 'Boundary weight 350.0 kg is valid');

  const tooLowWeight = validateWeight('0.5');
  assert(tooLowWeight.isValid === false, 'Rejects weight < 1.0 kg', tooLowWeight.error);

  const tooHighWeight = validateWeight('350.5');
  assert(tooHighWeight.isValid === false, 'Rejects weight > 350.0 kg', tooHighWeight.error);

  // Aggregate Vitals Validator
  const validVitalsSet = validateAllVitals({
    bp: '120/80',
    pulse: '75',
    temp: '98.4',
    weight: '70',
  });
  assert(validVitalsSet.isValid === true, 'Valid aggregate vitals set passes');

  const invalidVitalsSet = validateAllVitals({
    bp: '80/120',
    pulse: '25',
    temp: '112',
    weight: '0',
  });
  assert(invalidVitalsSet.isValid === false, 'Invalid aggregate vitals detects all errors');
  assert(Boolean(invalidVitalsSet.errors.bp), 'Detects BP error in aggregate set');
  assert(Boolean(invalidVitalsSet.errors.pulse), 'Detects pulse error in aggregate set');
  assert(Boolean(invalidVitalsSet.errors.temp), 'Detects temperature error in aggregate set');
  assert(Boolean(invalidVitalsSet.errors.weight), 'Detects weight error in aggregate set');

  // ----------------------------------------------------
  // 2. Cabin Presence & Return Time Formatting
  // ----------------------------------------------------
  console.log('\n--- 2. Cabin Presence & Return Time Engine ---');

  assert(QUICK_RETURN_MINUTES.length === 4, 'Provides 4 quick return presets (10, 15, 30, 45)');
  assert(QUICK_RETURN_MINUTES.includes(10), 'Includes 10m preset');
  assert(QUICK_RETURN_MINUTES.includes(15), 'Includes 15m preset');
  assert(QUICK_RETURN_MINUTES.includes(30), 'Includes 30m preset');
  assert(QUICK_RETURN_MINUTES.includes(45), 'Includes 45m preset');

  // Test 10:30 AM + 15m -> 10:45 AM
  const baseTime1 = new Date('2026-10-22T10:30:00+05:30');
  const return1 = calculateExpectedReturnTime(15, baseTime1);
  assert(return1 === '10:45 AM', '10:30 AM + 15m formats as 10:45 AM', return1);

  // Test 11:30 AM + 45m -> 12:15 PM (AM to PM flip)
  const baseTime2 = new Date('2026-10-22T11:30:00+05:30');
  const return2 = calculateExpectedReturnTime(45, baseTime2);
  assert(return2 === '12:15 PM', '11:30 AM + 45m formats as 12:15 PM', return2);

  // Test 11:50 PM + 20m -> 12:10 AM (Midnight crossover)
  const baseTime3 = new Date('2026-10-22T23:50:00+05:30');
  const return3 = calculateExpectedReturnTime(20, baseTime3);
  assert(return3 === '12:10 AM', '11:50 PM + 20m formats as 12:10 AM', return3);

  // Return display normalization
  assert(formatReturnDisplay('~ 11:45 AM') === '11:45 AM', 'Strips leading tildes in return display');
  assert(formatReturnDisplay(null) === 'Shortly', 'Falls back cleanly to Shortly on null return time');
  assert(formatReturnDisplay('') === 'Shortly', 'Falls back cleanly to Shortly on empty return time');

  // ----------------------------------------------------
  // 3. Queue Partitioning, Ordering & Arrival Status
  // ----------------------------------------------------
  console.log('\n--- 3. Queue Partitioning & Ordering ---');

  const mockAppointments: any[] = [
    {
      id: 'appt_1',
      queueNumber: 3,
      status: 'WAITING',
      patientName: 'Aarav Patel',
      isCheckedIn: false,
    },
    {
      id: 'appt_2',
      queueNumber: 1,
      status: 'IN_CONSULTATION',
      patientName: 'Priya Sharma',
      isCheckedIn: true,
      checkedInAt: '2026-10-22T10:00:00Z',
    },
    {
      id: 'appt_3',
      queueNumber: 2,
      status: 'WAITING',
      patientName: 'Dev Verma',
      isCheckedIn: true,
      checkedInAt: '2026-10-22T10:15:00Z',
    },
    {
      id: 'appt_4',
      queueNumber: 0,
      status: 'COMPLETED',
      patientName: 'Sunita Rao',
      updatedAt: '2026-10-22T09:45:00Z',
    },
    {
      id: 'appt_5',
      queueNumber: 4,
      status: 'WAITING',
      patientName: 'Vikram Joshi',
      isCheckedIn: false,
    },
  ];

  const partitioned = partitionDoctorQueue(mockAppointments);

  assert(partitioned.total === 5, 'Partitioned queue accounts for all 5 appointments');
  assert(partitioned.inConsultation !== null, 'Active in-consultation patient resolved');
  assert(partitioned.inConsultation?.patientName === 'Priya Sharma', 'Identifies correct active patient');
  assert(partitioned.waiting.length === 3, 'Waiting queue contains exactly 3 patients');
  assert(partitioned.waiting[0].queueNumber === 2, 'Waiting queue is ordered ascending by queueNumber (#2 first)');
  assert(partitioned.waiting[1].queueNumber === 3, 'Waiting queue second is #3');
  assert(partitioned.waiting[2].queueNumber === 4, 'Waiting queue third is #4');
  assert(partitioned.completed.length === 1, 'Completed queue contains 1 finished consultation');
  assert(partitioned.completed[0].patientName === 'Sunita Rao', 'Completed record correctly identified');

  // Physical arrival verification
  assert(isPatientArrivalVerified(mockAppointments[1]) === true, 'Detects verified checked-in arrival');
  assert(isPatientArrivalVerified(mockAppointments[2]) === true, 'Detects checkedInAt timestamp arrival');
  assert(isPatientArrivalVerified(mockAppointments[0]) === false, 'Detects pending arrival without checkin');

  // Empty queue partition edge case
  const emptyPartition = partitionDoctorQueue([]);
  assert(emptyPartition.waiting.length === 0, 'Handles empty queue gracefully');
  assert(emptyPartition.inConsultation === null, 'No in-consultation on empty queue');
  assert(emptyPartition.completed.length === 0, 'No completed on empty queue');

  // Edge case: HOLD, CALLING, and CONFIRMED appointment statuses
  const holdAndCallingMock: any[] = [
    { id: 'appt_c1', queueNumber: 1, status: 'CALLING', patientName: 'Calling Patient' },
    { id: 'appt_h1', queueNumber: 2, status: 'HOLD', patientName: 'Held Patient' },
    { id: 'appt_cf1', queueNumber: 3, status: 'CONFIRMED', patientName: 'Confirmed Patient' },
  ];
  const holdCallingPartition = partitionDoctorQueue(holdAndCallingMock);
  assert(holdCallingPartition.inConsultation?.patientName === 'Calling Patient', 'CALLING status correctly populates inConsultation');
  assert(holdCallingPartition.waiting.length === 2, 'HOLD and CONFIRMED statuses are safely assigned to waiting');
  assert(holdCallingPartition.waiting[0].patientName === 'Held Patient', 'Held patient remains in waiting queue');
  assert(holdCallingPartition.waiting[1].patientName === 'Confirmed Patient', 'Confirmed patient remains in waiting queue');

  // ----------------------------------------------------
  // 4. Doctor Schedule & Shift Consultation Arithmetic
  // ----------------------------------------------------
  console.log('\n--- 4. Shift Capacity & Consultation Duration Math ---');

  // 09:00 to 13:00 is 240m. 24 patients = 10.0m
  const avgMins1 = calculateAverageConsultationMinutes('09:00', '13:00', 24);
  assert(avgMins1 === 10, '09:00-13:00 (240m) / 24 patients is 10 mins', avgMins1);

  // 17:00 to 20:00 is 180m. 30 patients = 6.0m
  const avgMins2 = calculateAverageConsultationMinutes('17:00', '20:00', 30);
  assert(avgMins2 === 6, '17:00-20:00 (180m) / 30 patients is 6 mins', avgMins2);

  // Midnight spanning shift: 22:00 to 02:00 is 240m. 20 patients = 12m
  const overnightAvg = calculateAverageConsultationMinutes('22:00', '02:00', 20);
  assert(overnightAvg === 12, 'Overnight 22:00-02:00 (240m) / 20 patients is 12 mins', overnightAvg);

  // Zero patient fallback
  const zeroPatFallback = calculateAverageConsultationMinutes('09:00', '12:00', 0);
  assert(zeroPatFallback === 15, 'Zero patient capacity falls back safely to 15m default');

  // ----------------------------------------------------
  // 5. Doctor Leave Management & HIG Weekday Discs
  // ----------------------------------------------------
  console.log('\n--- 5. Doctor Leave Management & Practice Day Mapping ---');

  assert(APPLE_HIG_WEEKDAYS.length === 7, 'Provides exactly 7 Apple HIG weekday circular discs');
  assert(APPLE_HIG_WEEKDAYS[0].code === 'MON' && APPLE_HIG_WEEKDAYS[0].label === 'M', 'Monday disc label is M');
  assert(APPLE_HIG_WEEKDAYS[1].code === 'TUE' && APPLE_HIG_WEEKDAYS[1].label === 'T', 'Tuesday disc label is T');
  assert(APPLE_HIG_WEEKDAYS[2].code === 'WED' && APPLE_HIG_WEEKDAYS[2].label === 'W', 'Wednesday disc label is W');
  assert(APPLE_HIG_WEEKDAYS[3].code === 'THU' && APPLE_HIG_WEEKDAYS[3].label === 'T', 'Thursday disc label is T');
  assert(APPLE_HIG_WEEKDAYS[4].code === 'FRI' && APPLE_HIG_WEEKDAYS[4].label === 'F', 'Friday disc label is F');
  assert(APPLE_HIG_WEEKDAYS[5].code === 'SAT' && APPLE_HIG_WEEKDAYS[5].label === 'S', 'Saturday disc label is S');
  assert(APPLE_HIG_WEEKDAYS[6].code === 'SUN' && APPLE_HIG_WEEKDAYS[6].label === 'S', 'Sunday disc label is S');

  const todayStr = getLocalDateString();
  const mockLeaves: DoctorLeave[] = [
    {
      id: 'leave_today_1',
      type: 'TODAY',
      startDate: todayStr,
      endDate: todayStr,
      reason: 'Emergency Leave Today',
      createdAt: '2026-10-22T08:00:00Z',
      createdByRole: 'DOCTOR',
    },
    {
      id: 'leave_range_1',
      type: 'DATE_RANGE',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      reason: 'Annual Vacation',
      createdAt: '2026-10-22T08:00:00Z',
      createdByRole: 'DOCTOR',
    },
  ];

  assert(isDoctorOnLeave(todayStr, mockLeaves) === true, 'Detects TODAY emergency leave on current date');
  assert(isDoctorOnLeave('2026-11-03', mockLeaves) === true, 'Detects scheduled date within DATE_RANGE leave (Nov 3)');
  assert(isDoctorOnLeave('2026-11-01', mockLeaves) === true, 'Detects start date of DATE_RANGE leave (Nov 1)');
  assert(isDoctorOnLeave('2026-11-05', mockLeaves) === true, 'Detects end date of DATE_RANGE leave (Nov 5)');
  assert(isDoctorOnLeave('2026-11-06', mockLeaves) === false, 'Date outside leave range is not on leave (Nov 6)');

  // Historical TODAY leave record from previous date must NOT flag doctor on leave today
  const historicalLeave: DoctorLeave[] = [
    {
      id: 'leave_past_today',
      type: 'TODAY',
      startDate: '2026-10-01',
      endDate: '2026-10-01',
      reason: 'Past Emergency Leave',
      createdAt: '2026-10-01T08:00:00Z',
      createdByRole: 'DOCTOR',
    },
  ];
  assert(isDoctorOnLeave(todayStr, historicalLeave) === false, 'Historical TODAY leave from prior date does not flag doctor on leave today');
  assert(isDoctorOnLeave('2026-10-01', historicalLeave) === true, 'Historical TODAY leave correctly marks only its own historical date');

  // Doctor Practicing Calculation
  const workingDays = ['MON', 'TUE', 'WED', 'THU', 'FRI']; // No SAT, SUN
  const sundayStatus = isDoctorPracticingOnDate('2026-10-25', workingDays, []); // Sunday
  assert(sundayStatus.isPracticing === false && sundayStatus.reason === 'OFF_DAY', 'Sunday is flagged as OFF_DAY when not in workingDays');

  // Timezone-safe practice day mapping (Mon-Sat practice, Sunday off)
  const monSatWorkingDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const sundayMonSat = isDoctorPracticingOnDate('2026-10-25', monSatWorkingDays, []); // Sunday
  assert(sundayMonSat.isPracticing === false && sundayMonSat.reason === 'OFF_DAY', 'Sunday is strictly OFF_DAY under Mon-Sat practice schedule');
  const saturdayMonSat = isDoctorPracticingOnDate('2026-10-24', monSatWorkingDays, []); // Saturday
  assert(saturdayMonSat.isPracticing === true, 'Saturday is correctly recognized as practicing under Mon-Sat schedule');

  const leaveDayStatus = isDoctorPracticingOnDate(todayStr, workingDays, mockLeaves);
  assert(leaveDayStatus.isPracticing === false && leaveDayStatus.reason === 'ON_LEAVE', 'Flagged as ON_LEAVE on today leave');

  // ----------------------------------------------------
  // 6. Apple HIG Design System Tokens & Geometry
  // ----------------------------------------------------
  console.log('\n--- 6. Apple HIG Design Tokens & Geometry ---');

  assert(Colors.primary === '#0066cc', 'Action Blue is #0066cc');
  assert(Colors.canvasParchment === '#f5f5f7', 'Canvas parchment is #f5f5f7');
  assert(Colors.success === '#34c759', 'Success green is #34c759');
  assert(Colors.warning === '#ff9500', 'Warning amber is #ff9500');
  assert(TouchTarget.minSize >= 44, 'TouchTarget minSize is at least 44pt (44pt)');
  assert(BorderRadius.pill === 9999, 'Pill border radius is 9999');
  assert(Typography.headline.fontSize === 17, 'Apple HIG headline typography is 17pt');
  assert(Typography.footnote.fontSize === 13, 'Apple HIG footnote typography is 13pt');
  assert(Boolean(Shadows.modal), 'Modal shadow token is defined');

  // ----------------------------------------------------
  // 7. Live Production Backend Doctor API Queries
  // ----------------------------------------------------
  console.log('\n--- 7. Live Production Backend Doctor API Queries ---');

  try {
    const health = await api.checkHealth();
    assert(health.status === 'ok', 'Render /healthz is live and returning ok', health.status);

    const doctors = await api.getDoctors();
    assert(Array.isArray(doctors) && doctors.length > 0, 'api.getDoctors() returns doctor catalog', `Count: ${doctors.length}`);

    const firstDoc = doctors[0];
    assert(Boolean(firstDoc.id), 'Live doctor contains id', firstDoc.id);
    const doctorFullName = (firstDoc as any).fullName || firstDoc.user?.fullName;
    assert(Boolean(doctorFullName), 'Live doctor contains fullName', doctorFullName);
    assert(Boolean(firstDoc.specialty), 'Live doctor contains specialty', firstDoc.specialty);

    const detailedDoc = await api.getDoctorById(firstDoc.id);
    const detailedFullName = (detailedDoc as any).fullName || detailedDoc.user?.fullName;
    assert(detailedDoc.id === firstDoc.id, 'api.getDoctorById resolves doctor', detailedFullName);

    // Verify alias methods exist on api
    assert(typeof api.updateCabinPresence === 'function', 'api.updateCabinPresence alias exists on api service');
    assert(typeof api.completeAppointment === 'function', 'api.completeAppointment alias exists on api service');
    assert(typeof api.uploadAvatar === 'function', 'api.uploadAvatar method exists on api service');
  } catch (err: any) {
    assert(false, 'Live backend communication error', err?.message);
  }

  console.log('\n====================================================');
  console.log(`Phase 5 Verification Summary: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Verification();
