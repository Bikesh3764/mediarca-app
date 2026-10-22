/**
 * Phase 1 Deep Verification Suite for MediArca Mobile
 * Exhaustively validates:
 * 1. Apple HIG Design Tokens & Touch Targets
 * 2. SafeFetch Retry Policies & Mutation Safety (with case-insensitivity & status codes)
 * 3. Indian Phone Utilities & RFC 3966 Dialer URIs (with edge cases)
 * 4. IST Date Arithmetic across Midnight Crossover Boundaries
 * 5. Indian Geographic Catalog (28 States & 8 UTs)
 * 6. Doctor Specialty & Shift Calculations
 * 7. Live Production Backend & Supabase Telemetry
 * 8. Live Doctor Roster & Clinic Discovery Queries
 */

import {
  api,
  getLocalDateString,
  getIndianTimeMinutes,
  getDayOfWeekCode,
  formatDoctorDegrees,
  calculateSlotMetrics,
} from '../src/services/api';
import { Colors, TouchTarget } from '../src/constants/theme';
import {
  isValidIndianPhone,
  formatIndianPhone,
  formatDisplayPhone,
  toTelUri,
  sanitizeIndianPhone,
} from '../src/utils/phoneUtils';
import {
  isSafeToRetryMethod,
  isRetryableStatusCode,
} from '../src/services/safeFetch';
import { INDIAN_STATES } from '../src/utils/indiaStates';

async function runPhase1Verification() {
  console.log('====================================================');
  console.log('🩺 MediArca Mobile - Comprehensive Phase 1 Verification');
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

  // 1. Theme & Design Tokens Verification
  console.log('--- 1. Design System Tokens (Apple HIG) ---');
  assert(Colors.primary === '#0066cc', 'Action Blue token is #0066cc', Colors.primary);
  assert(Colors.canvasParchment === '#f5f5f7', 'Parchment canvas token is #f5f5f7', Colors.canvasParchment);
  assert(Colors.ink === '#1d1d1f', 'High contrast Ink token is #1d1d1f', Colors.ink);
  assert(TouchTarget.minSize >= 44, 'Touch target adheres to 44x44pt rule', `${TouchTarget.minSize}pt`);
  assert(TouchTarget.minHeight === 44 && TouchTarget.minWidth === 44, 'TouchTarget dimensions 44x44pt');

  // 2. SafeFetch Retry Policy & Mutation Safety
  console.log('\n--- 2. SafeFetch Mutation Safety & Retry Engine ---');
  assert(isSafeToRetryMethod('GET') === true, 'GET is safe to retry');
  assert(isSafeToRetryMethod('get') === true, 'get (lowercase) is safe to retry');
  assert(isSafeToRetryMethod('HEAD') === true, 'HEAD is safe to retry');
  assert(isSafeToRetryMethod('head') === true, 'head (lowercase) is safe to retry');
  assert(isSafeToRetryMethod(undefined) === true, 'undefined method defaults to safe GET');
  assert(isSafeToRetryMethod('POST') === false, 'POST is NEVER auto-retried');
  assert(isSafeToRetryMethod('post') === false, 'post (lowercase) is NEVER auto-retried');
  assert(isSafeToRetryMethod('PUT') === false, 'PUT is NEVER auto-retried');
  assert(isSafeToRetryMethod('PATCH') === false, 'PATCH is NEVER auto-retried');
  assert(isSafeToRetryMethod('DELETE') === false, 'DELETE is NEVER auto-retried');
  assert(isRetryableStatusCode(502) === true, '502 Bad Gateway is retryable');
  assert(isRetryableStatusCode(503) === true, '503 Service Unavailable is retryable');
  assert(isRetryableStatusCode(504) === true, '504 Gateway Timeout is retryable');
  assert(isRetryableStatusCode(500) === false, '500 Internal Server Error is NOT retryable (server bug)');
  assert(isRetryableStatusCode(400) === false, '400 Bad Request is NOT retryable');
  assert(isRetryableStatusCode(401) === false, '401 Unauthorized is NOT retryable');
  assert(isRetryableStatusCode(403) === false, '403 Forbidden is NOT retryable');
  assert(isRetryableStatusCode(404) === false, '404 Not Found is NOT retryable');
  assert(isRetryableStatusCode(429) === false, '429 Rate Limit is NOT retryable');

  // 3. Indian Phone Number Utilities Verification & Edge Cases
  console.log('\n--- 3. Phone & Dialing Utilities & Edge Cases ---');
  assert(isValidIndianPhone('9820012345') === true, '10-digit Indian mobile is valid');
  assert(isValidIndianPhone('+919820012345') === true, '+91 prefix mobile is valid');
  assert(isValidIndianPhone('+91 98200 12345') === true, '+91 with spaces is valid');
  assert(isValidIndianPhone('98200-12345') === true, 'Mobile with dash is valid');
  assert(isValidIndianPhone('09820012345') === true, '11-digit leading 0 mobile is valid');
  assert(isValidIndianPhone('919820012345') === true, '12-digit 91-prefix mobile is valid');
  assert(isValidIndianPhone('1234567890') === false, 'Invalid mobile rejected (does not start with 6-9)');
  assert(isValidIndianPhone('') === false, 'Empty phone string rejected');
  assert(isValidIndianPhone(null) === false, 'Null phone rejected');
  assert(isValidIndianPhone(undefined) === false, 'Undefined phone rejected');
  assert(isValidIndianPhone('+1 212 555 1234') === false, 'US country code rejected');
  assert(isValidIndianPhone('98200123') === false, 'Short number rejected');
  assert(isValidIndianPhone('98200123456789') === false, 'Overlong number rejected');
  assert(sanitizeIndianPhone('+91 98200 12345') === '9820012345', 'Sanitizes whitespace and prefix');
  assert(sanitizeIndianPhone('09820012345') === '9820012345', 'Sanitizes leading zero');
  assert(formatIndianPhone('9820012345') === '+91 9820012345', 'Formats with standard prefix');
  assert(formatDisplayPhone('9820012345') === '+91 98200 12345', 'Display format grouped 5+5');
  assert(toTelUri('9820012345') === 'tel:+919820012345', 'RFC 3966 tel: URI generated for dialer');
  assert(toTelUri('+91 98200 12345') === 'tel:+919820012345', 'RFC 3966 cleans spaces');

  // 4. IST Date Arithmetic & Midnight Boundary Testing
  console.log('\n--- 4. IST Date Arithmetic & Midnight Boundaries ---');
  const istDate = getLocalDateString();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(istDate), 'Current IST Date string matches YYYY-MM-DD', istDate);
  const istMinutes = getIndianTimeMinutes();
  assert(istMinutes >= 0 && istMinutes < 1440, 'IST Minutes in day is within 0..1439', `${istMinutes}m`);

  // Test UTC 18:35 on 2026-03-15 (in IST UTC+5:30, it is 00:05 AM on 2026-03-16)
  const utcLateNight = new Date('2026-03-15T18:35:00.000Z');
  const istNextDay = getLocalDateString(utcLateNight);
  assert(istNextDay === '2026-03-16', 'UTC 18:35 evaluates to next day in IST', istNextDay);
  const minutesPastMidnight = getIndianTimeMinutes(utcLateNight);
  assert(minutesPastMidnight === 5, 'UTC 18:35 is 00:05 IST (5 minutes)', `${minutesPastMidnight}m`);

  // Test UTC 18:25 on 2026-03-15 (in IST UTC+5:30, it is 23:55 PM on 2026-03-15)
  const utcBeforeMidnight = new Date('2026-03-15T18:25:00.000Z');
  const istCurrentDay = getLocalDateString(utcBeforeMidnight);
  assert(istCurrentDay === '2026-03-15', 'UTC 18:25 evaluates to same day in IST', istCurrentDay);
  const minutesBeforeMidnight = getIndianTimeMinutes(utcBeforeMidnight);
  assert(minutesBeforeMidnight === 1435, 'UTC 18:25 is 23:55 IST (1435 minutes)', `${minutesBeforeMidnight}m`);

  // Weekday code calculation
  const weekdayCode = getDayOfWeekCode('2026-10-22');
  assert(weekdayCode === 'THU', '2026-10-22 resolves correctly to THU', weekdayCode);

  // 5. Indian Geographic Catalog Verification
  console.log('\n--- 5. Indian Geographic Catalog ---');
  assert(INDIAN_STATES.length === 36, 'Full catalog of 28 States and 8 UTs (36 total)', `${INDIAN_STATES.length}`);
  assert(INDIAN_STATES.includes('Maharashtra'), 'Catalog contains Maharashtra');
  assert(INDIAN_STATES.includes('Delhi'), 'Catalog contains Delhi');
  assert(INDIAN_STATES.includes('Karnataka'), 'Catalog contains Karnataka');

  // 6. Doctor Degrees & Clinical Slot Helpers
  console.log('\n--- 6. Doctor Degrees & Clinical Slot Calculations ---');
  const degrees = formatDoctorDegrees('MBBS, MD (Internal Medicine)');
  assert(degrees === 'MBBS, MD', 'Extracts recognized medical degrees', degrees);
  const fallbackDegrees = formatDoctorDegrees(null);
  assert(fallbackDegrees === 'Certified Specialist', 'Falls back cleanly to Certified Specialist', fallbackDegrees);
  const metrics = calculateSlotMetrics('09:00', '11:00', 60);
  assert(metrics.durationMinutes === 120, 'Slot duration calculated as 120m', `${metrics.durationMinutes}m`);
  assert(metrics.avgConsultationMinutes === 2, 'Avg consultation minutes calculated as 2m', `${metrics.avgConsultationMinutes}m`);

  // 7. Live Production Backend & Supabase Telemetry
  console.log('\n--- 7. Live Backend & Supabase Telemetry ---');
  try {
    const health = await api.checkHealth();
    assert(health.status === 'ok', 'Render Backend /healthz reports status ok', health.status);
    assert(health.database === 'connected', 'Supabase PostgreSQL reports connected', health.database);
    assert(health.redis === 'connected', 'Redis Cache reports connected', health.redis);
  } catch (err: any) {
    assert(false, 'Live backend health ping failed', err.message);
  }

  try {
    const apiHealth = await api.checkApiHealth();
    assert(apiHealth.status === 'ok', 'Render Backend /api/health reports status ok', apiHealth.status);
  } catch (err: any) {
    assert(false, 'Live API health ping failed', err.message);
  }

  // 8. Live Doctors & Clinics Data Query
  console.log('\n--- 8. Live Doctors & Clinics Data Query ---');
  try {
    const doctors = await api.getDoctors();
    assert(Array.isArray(doctors), 'Successfully queried live doctors from Supabase', `Count: ${doctors.length}`);
  } catch (err: any) {
    assert(false, 'Live doctors query failed', err.message);
  }

  try {
    const clinics = await api.getPublicClinics();
    assert(Array.isArray(clinics), 'Successfully queried live clinics from Supabase', `Count: ${clinics.length}`);
  } catch (err: any) {
    assert(false, 'Live clinics query failed', err.message);
  }

  console.log('\n====================================================');
  console.log(`Verification Summary: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1Verification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
