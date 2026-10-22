/**
 * Phase 1 Deep Verification Script for MediArca Mobile
 * Executes live health pings against production Render backend,
 * validates database connectivity, checks phone & IST utilities,
 * and verifies design system tokens.
 */

import { api, getLocalDateString, getIndianTimeMinutes } from '../src/services/api';
import { Colors, TouchTarget } from '../src/constants/theme';
import { isValidIndianPhone, formatIndianPhone, toTelUri, sanitizeIndianPhone } from '../src/utils/phoneUtils';
import { isSafeToRetryMethod } from '../src/services/safeFetch';

async function runPhase1Verification() {
  console.log('====================================================');
  console.log('🩺 MediArca Mobile - Phase 1 Verification Suite');
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
  console.log('--- 1. Design System Tokens ---');
  assert(Colors.primary === '#0066cc', 'Action Blue token is #0066cc', Colors.primary);
  assert(Colors.canvasParchment === '#f5f5f7', 'Parchment canvas token is #f5f5f7', Colors.canvasParchment);
  assert(Colors.ink === '#1d1d1f', 'High contrast Ink token is #1d1d1f', Colors.ink);
  assert(TouchTarget.minSize >= 44, 'Touch target adheres to 44x44pt rule', `${TouchTarget.minSize}pt`);

  // 2. SafeFetch Retry Policy Verification
  console.log('\n--- 2. SafeFetch Mutation Safety ---');
  assert(isSafeToRetryMethod('GET') === true, 'GET is safe to retry');
  assert(isSafeToRetryMethod('HEAD') === true, 'HEAD is safe to retry');
  assert(isSafeToRetryMethod('POST') === false, 'POST is NEVER auto-retried (mutation safety)');
  assert(isSafeToRetryMethod('PUT') === false, 'PUT is NEVER auto-retried (mutation safety)');
  assert(isSafeToRetryMethod('PATCH') === false, 'PATCH is NEVER auto-retried (mutation safety)');
  assert(isSafeToRetryMethod('DELETE') === false, 'DELETE is NEVER auto-retried (mutation safety)');

  // 3. Indian Phone Number Utilities Verification
  console.log('\n--- 3. Phone & Dialing Utilities ---');
  assert(isValidIndianPhone('9820012345') === true, '10-digit Indian mobile is valid');
  assert(isValidIndianPhone('+919820012345') === true, '+91 prefix mobile is valid');
  assert(isValidIndianPhone('1234567890') === false, 'Invalid mobile rejected (does not start with 6-9)');
  assert(sanitizeIndianPhone('+91 98200 12345') === '9820012345', 'Sanitizes whitespace and prefix');
  assert(formatIndianPhone('9820012345') === '+91 9820012345', 'Formats with standard prefix');
  assert(toTelUri('9820012345') === 'tel:+919820012345', 'RFC 3966 tel: URI generated for dialer');

  // 4. IST Date Arithmetic Verification
  console.log('\n--- 4. IST Date & Time Math ---');
  const istDate = getLocalDateString();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(istDate), 'IST Date string matches YYYY-MM-DD', istDate);
  const istMinutes = getIndianTimeMinutes();
  assert(istMinutes >= 0 && istMinutes < 1440, 'IST Minutes in day is within 0..1439', `${istMinutes}m`);

  // 5. Live Production Backend Health Check
  console.log('\n--- 5. Live Backend & Supabase Telemetry ---');
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

  // 6. Live Doctors & Clinics Query Verification
  console.log('\n--- 6. Live Doctors & Clinics Data Query ---');
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
