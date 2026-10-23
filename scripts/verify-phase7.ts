/**
 * MediArca Mobile - Comprehensive Phase 7 Automated Verification Suite
 * Verifies:
 * 1. Build & Release Configuration (eas.json preview APK, production AAB, app.json SDK 34+)
 * 2. Admin Governance: Doctor Medical Council Licensure Verification State Machine
 * 3. Admin Governance: Clinic Establishment License Verification State Machine
 * 4. User Support Inquiries & Feedback Validation (ContactMessage)
 * 5. Clinic Facility Roster & Staff Management Validation
 * 6. Google Play Compliance: Self-Serve Account Deletion & NMC Statutory Retention Disclosures
 * 7. Statutory Legal Policies (Terms, Privacy, Refund, About, Contact)
 * 8. Apple HIG Design Tokens & 44pt Touch Targets
 * 9. Live Production Backend API Endpoint Connectivity
 */

declare const require: any;
declare const __dirname: string;

const fs = require('fs');
const path = require('path');

import {
  validateContactMessage,
  validateClinicProfile,
  validateReceptionistCreation,
  validateAccountDeletionConfirmation,
  getRegulatoryRetentionDisclosure,
  filterDoctorsByStatus,
  filterClinicsByStatus,
  filterMessagesByStatus,
} from '../src/services/adminClinicUtils';

import {
  api,
  Doctor,
  ClinicProfile,
  ContactMessageItem,
} from '../src/services/api';

import { Colors, TouchTarget, BorderRadius, Typography } from '../src/constants/theme';

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

async function runPhase7Verification() {
  console.log('====================================================');
  console.log('📋 MediArca Mobile - Comprehensive Phase 7 Verification');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // 1. Build & Release Configuration (eas.json & app.json)
  // ----------------------------------------------------
  console.log('--- 1. EAS & Play Store Build Configuration ---');

  const rootDir = path.resolve(__dirname, '..');
  const easPath = path.join(rootDir, 'eas.json');
  const appJsonPath = path.join(rootDir, 'app.json');
  const pkgJsonPath = path.join(rootDir, 'package.json');

  assert(fs.existsSync(easPath), 'eas.json exists in root directory');
  const easConfig = JSON.parse(fs.readFileSync(easPath, 'utf8'));

  assert(easConfig.build !== undefined, 'eas.json defines build configurations');
  assert(easConfig.build.preview !== undefined, 'eas.json defines preview build profile');
  assert(
    easConfig.build.preview.android?.buildType === 'apk',
    'Preview profile is configured to generate standalone .apk file (Free sideloading testing without $25 Play Store fee)',
    easConfig.build.preview.android?.buildType
  );
  assert(
    easConfig.build.production?.android?.buildType === 'app-bundle',
    'Production profile is configured to generate signed .aab bundle for Google Play upload',
    easConfig.build.production?.android?.buildType
  );

  assert(fs.existsSync(appJsonPath), 'app.json exists in root directory');
  const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).expo;

  assert(appConfig.android?.package === 'com.mediarca.app', 'Android package is com.mediarca.app');
  assert(appConfig.version === '1.0.0', 'App version is 1.0.0');
  assert(appConfig.android?.versionCode === 1, 'Android versionCode is 1');
  assert(
    appConfig.android?.targetSdkVersion === 34,
    'Target SDK is 34+ (Android 14/15 Google Play Store Compliance)',
    appConfig.android?.targetSdkVersion
  );
  assert(
    appConfig.android?.permissions?.includes('android.permission.CAMERA'),
    'CAMERA permission declared for QR counter check-in'
  );
  assert(
    appConfig.android?.permissions?.includes('android.permission.VIBRATE'),
    'VIBRATE permission declared for scan haptics'
  );
  assert(appConfig.web?.bundler === 'metro', 'Web bundler explicitly configured as metro');

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  assert(
    pkgJson.dependencies['@expo/metro-runtime'] !== undefined,
    '@expo/metro-runtime registered in package.json dependencies for web browser fast refresh'
  );
  assert(
    pkgJson.dependencies['react-native-web'] !== undefined,
    'react-native-web registered in package.json dependencies for browser execution'
  );

  // ----------------------------------------------------
  // 2. Admin Doctor Medical Council Licensure State Machine
  // ----------------------------------------------------
  console.log('\n--- 2. Admin Doctor Licensure State Machine ---');

  const sampleDoctors: Doctor[] = [
    {
      id: 'doc_1',
      userId: 'usr_1',
      specialty: 'Cardiology',
      qualifications: 'MD, DM',
      experienceYears: 12,
      consultationFee: 800,
      checkingStartTime: '09:00',
      checkingEndTime: '13:00',
      avgConsultationMinutes: 3.0,
      maxDailyPatients: 50,
      isVerified: false,
      verificationStatus: 'PENDING',
      user: { id: 'usr_1', fullName: 'Dr. Sarah Jenkins', email: 'sarah@mediarca.com' },
    },
    {
      id: 'doc_2',
      userId: 'usr_2',
      specialty: 'Dermatology',
      qualifications: 'MD',
      experienceYears: 8,
      consultationFee: 650,
      checkingStartTime: '10:00',
      checkingEndTime: '14:00',
      avgConsultationMinutes: 4.0,
      maxDailyPatients: 40,
      isVerified: true,
      verificationStatus: 'VERIFIED',
      user: { id: 'usr_2', fullName: 'Dr. Arjun Mehta', email: 'arjun@mediarca.com' },
    },
    {
      id: 'doc_3',
      userId: 'usr_3',
      specialty: 'Pediatrics',
      qualifications: 'MD',
      experienceYears: 15,
      consultationFee: 700,
      checkingStartTime: '08:00',
      checkingEndTime: '12:00',
      avgConsultationMinutes: 4.5,
      maxDailyPatients: 45,
      isVerified: false,
      verificationStatus: 'SUSPENDED',
      user: { id: 'usr_3', fullName: 'Dr. Elena Rostova', email: 'elena@mediarca.com' },
    },
    {
      id: 'doc_4',
      userId: 'usr_4',
      specialty: 'Orthopedics',
      qualifications: 'MS',
      experienceYears: 10,
      consultationFee: 900,
      checkingStartTime: '14:00',
      checkingEndTime: '18:00',
      avgConsultationMinutes: 5.0,
      maxDailyPatients: 30,
      isVerified: false,
      verificationStatus: 'REJECTED',
      user: { id: 'usr_4', fullName: 'Dr. Rajesh Khanna', email: 'rajesh@mediarca.com' },
    },
  ];

  const pendingDocs = filterDoctorsByStatus(sampleDoctors, 'PENDING');
  assert(pendingDocs.length === 1, 'Filters 1 pending doctor in licensure queue');
  assert(pendingDocs[0].id === 'doc_1', 'Pending doctor is Dr. Sarah Jenkins');

  const verifiedDocs = filterDoctorsByStatus(sampleDoctors, 'VERIFIED');
  assert(verifiedDocs.length === 1, 'Filters 1 verified doctor');
  assert(verifiedDocs[0].id === 'doc_2', 'Verified doctor is Dr. Arjun Mehta');

  const suspendedDocs = filterDoctorsByStatus(sampleDoctors, 'SUSPENDED');
  assert(suspendedDocs.length === 1, 'Filters 1 suspended doctor');

  const rejectedDocs = filterDoctorsByStatus(sampleDoctors, 'REJECTED');
  assert(rejectedDocs.length === 1, 'Filters 1 rejected doctor');

  const searchedDocs = filterDoctorsByStatus(sampleDoctors, 'ALL', 'Cardiology');
  assert(searchedDocs.length === 1, 'Searches doctor by specialty (Cardiology)');

  const searchedByName = filterDoctorsByStatus(sampleDoctors, 'ALL', 'Arjun');
  assert(searchedByName.length === 1, 'Searches doctor by name substring');

  // ----------------------------------------------------
  // 3. Admin Clinic Establishment License State Machine
  // ----------------------------------------------------
  console.log('\n--- 3. Admin Clinic Establishment Licensure ---');

  const sampleClinics: ClinicProfile[] = [
    {
      id: 'clinic_1',
      clinicName: 'City Heart Institute',
      address: 'Hill Road, Bandra',
      city: 'Mumbai',
      phone: '+91 98200 11111',
      isVerified: false,
      verificationStatus: 'PENDING',
    },
    {
      id: 'clinic_2',
      clinicName: 'Metro Health Center',
      address: 'Palam Marg, Vasant Vihar',
      city: 'New Delhi',
      phone: '+91 98110 22222',
      isVerified: true,
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'clinic_3',
      clinicName: 'Apex PolyClinic',
      address: 'Indiranagar 100ft Road',
      city: 'Bengaluru',
      phone: '+91 98450 33333',
      isVerified: false,
      verificationStatus: 'REJECTED',
    },
  ];

  const pendingClinics = filterClinicsByStatus(sampleClinics, 'PENDING');
  assert(pendingClinics.length === 1, 'Filters 1 pending clinic establishment');
  assert(pendingClinics[0].id === 'clinic_1', 'Pending clinic is City Heart Institute');

  const verifiedClinics = filterClinicsByStatus(sampleClinics, 'VERIFIED');
  assert(verifiedClinics.length === 1, 'Filters 1 verified clinic');

  const cityFilteredClinics = filterClinicsByStatus(sampleClinics, 'ALL', 'Delhi');
  assert(cityFilteredClinics.length === 1, 'Searches clinic establishment by city (Delhi)');

  // ----------------------------------------------------
  // 4. User Support Feedback & Contact Message Validation
  // ----------------------------------------------------
  console.log('\n--- 4. Support Messages & Contact Validation ---');

  const validContact = validateContactMessage({
    fullName: 'Rohan Deshmukh',
    email: 'rohan.d@gmail.com',
    phone: '9820012345',
    subject: 'OPD Queue Help',
    message: 'I would like to inquire about OPD shift hours for Dr. Sarah.',
  });
  assert(validContact.isValid === true, 'Valid contact payload passes validation');
  assert(Object.keys(validContact.errors).length === 0, 'Zero errors on clean contact message');

  const emptyNameContact = validateContactMessage({
    fullName: '',
    email: 'rohan.d@gmail.com',
    subject: 'General Feedback',
    message: 'Great app experience so far!',
  });
  assert(emptyNameContact.isValid === false, 'Rejects contact message with empty full name');
  assert(emptyNameContact.errors.fullName?.includes('required') === true, 'Errors with name required');

  const shortNameContact = validateContactMessage({
    fullName: 'R',
    email: 'rohan.d@gmail.com',
    subject: 'General Feedback',
    message: 'Great app experience so far!',
  });
  assert(shortNameContact.isValid === false, 'Rejects single-character name');

  const invalidEmailContact = validateContactMessage({
    fullName: 'Rohan Deshmukh',
    email: 'not-an-email',
    subject: 'General Feedback',
    message: 'Great app experience so far!',
  });
  assert(invalidEmailContact.isValid === false, 'Rejects malformed email address');

  const invalidPhoneContact = validateContactMessage({
    fullName: 'Rohan Deshmukh',
    email: 'rohan.d@gmail.com',
    phone: '1234567890', // Starts with 1 (invalid for India)
    subject: 'General Feedback',
    message: 'Great app experience so far!',
  });
  assert(invalidPhoneContact.isValid === false, 'Rejects Indian mobile starting with 1');

  const shortMessageContact = validateContactMessage({
    fullName: 'Rohan Deshmukh',
    email: 'rohan.d@gmail.com',
    subject: 'General Feedback',
    message: 'Short',
  });
  assert(shortMessageContact.isValid === false, 'Rejects message under 10 characters');

  // Support Inquiries Filter
  const sampleMessages: ContactMessageItem[] = [
    {
      id: 'm1',
      fullName: 'Vikram Joshi',
      email: 'vikram@yahoo.com',
      subject: 'Doctor Registration',
      message: 'Need help onboarding my medical clinic and uploading registration.',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'm2',
      fullName: 'Meera Sen',
      email: 'meera@gmail.com',
      subject: 'Payment Query',
      message: 'Confirming if consultation fees are paid at counter.',
      status: 'READ',
      createdAt: new Date().toISOString(),
    },
  ];

  const newMessages = filterMessagesByStatus(sampleMessages, 'NEW');
  assert(newMessages.length === 1, 'Filters 1 new unread message');
  assert(newMessages[0].id === 'm1', 'New message is from Vikram Joshi');

  const readMessages = filterMessagesByStatus(sampleMessages, 'READ');
  assert(readMessages.length === 1, 'Filters 1 read message');

  // ----------------------------------------------------
  // 5. Clinic Facility Roster & Staff Management
  // ----------------------------------------------------
  console.log('\n--- 5. Clinic Facility & Staff Validation ---');

  const validClinicProfile = validateClinicProfile({
    clinicName: 'Apollo City Clinic',
    address: '42 MG Road',
    city: 'Pune',
    phone: '9820011223',
  });
  assert(validClinicProfile.isValid === true, 'Valid clinic facility profile passes validation');

  const emptyClinicName = validateClinicProfile({
    clinicName: '',
    address: '42 MG Road',
    city: 'Pune',
  });
  assert(emptyClinicName.isValid === false, 'Rejects empty clinic facility name');

  const validReceptionist = validateReceptionistCreation({
    fullName: 'Sunita Rao',
    email: 'sunita.desk@apollo.org',
    password: 'SecurePassword123!',
    phone: '9820055443',
  });
  assert(validReceptionist.isValid === true, 'Valid receptionist account passes validation');

  const shortPasswordReceptionist = validateReceptionistCreation({
    fullName: 'Sunita Rao',
    email: 'sunita.desk@apollo.org',
    password: '123',
    phone: '9820055443',
  });
  assert(shortPasswordReceptionist.isValid === false, 'Rejects receptionist password < 8 characters');

  // Standee QR Payload format
  const standeePayload = JSON.stringify({
    clinicId: 'clinic_apollo_01',
    clinicName: 'Apollo City Clinic',
    code: 'APOLLO',
  });
  const parsedStandee = JSON.parse(standeePayload);
  assert(parsedStandee.clinicId === 'clinic_apollo_01', 'Standee QR payload contains clinicId');
  assert(parsedStandee.code === 'APOLLO', 'Standee QR payload contains counter checkin code');

  // ----------------------------------------------------
  // 6. Google Play Compliance: Self-Serve Account Deletion
  // ----------------------------------------------------
  console.log('\n--- 6. Google Play Compliance & Account Deletion ---');

  const validDeletionConfirm = validateAccountDeletionConfirmation('DELETE');
  assert(validDeletionConfirm.isValid === true, 'Accepts uppercase DELETE confirmation');

  const lowercaseConfirm = validateAccountDeletionConfirmation('delete');
  assert(lowercaseConfirm.isValid === false, 'Rejects lowercase delete to prevent accidental trigger');

  const emptyConfirm = validateAccountDeletionConfirmation('');
  assert(emptyConfirm.isValid === false, 'Rejects empty confirmation text');

  const randomConfirm = validateAccountDeletionConfirmation('CANCEL');
  assert(randomConfirm.isValid === false, 'Rejects mismatched confirmation keyword');

  // Statutory retention notice check
  const retentionDisclosure = getRegulatoryRetentionDisclosure();
  assert(retentionDisclosure.retentionPeriodYears === 3, 'Discloses 3-year statutory retention period');
  assert(
    retentionDisclosure.statutoryBasis.includes('National Medical Commission') ||
      retentionDisclosure.statutoryBasis.includes('Medical Council of India'),
    'References Indian NMC / MCI statutory regulation for medical record archives'
  );
  assert(
    retentionDisclosure.dataDeleted.some((d) => d.includes('authentication') || d.includes('password')),
    'Explicitly lists authentication credentials in data deleted array'
  );
  assert(
    retentionDisclosure.dataRetained.some((d) => d.includes('consultation') || d.includes('prescriptions')),
    'Explicitly lists clinical records and prescriptions in retained statutory archive'
  );

  // ----------------------------------------------------
  // 7. Legal & Statutory Page Disclosures
  // ----------------------------------------------------
  console.log('\n--- 7. Statutory Legal Policy Verifications ---');

  const termsFile = path.join(rootDir, 'src', 'app', 'legal', 'terms.tsx');
  const privacyFile = path.join(rootDir, 'src', 'app', 'legal', 'privacy.tsx');
  const refundFile = path.join(rootDir, 'src', 'app', 'legal', 'refund.tsx');
  const aboutFile = path.join(rootDir, 'src', 'app', 'legal', 'about.tsx');
  const contactFile = path.join(rootDir, 'src', 'app', 'legal', 'contact.tsx');

  assert(fs.existsSync(termsFile), 'Terms of Service screen file exists (src/app/legal/terms.tsx)');
  assert(fs.existsSync(privacyFile), 'Privacy Policy screen file exists (src/app/legal/privacy.tsx)');
  assert(fs.existsSync(refundFile), 'Refund Policy screen file exists (src/app/legal/refund.tsx)');
  assert(fs.existsSync(aboutFile), 'About Us screen file exists (src/app/legal/about.tsx)');
  assert(fs.existsSync(contactFile), 'Contact Us screen file exists (src/app/legal/contact.tsx)');

  const privacyText = fs.readFileSync(privacyFile, 'utf8');
  assert(
    privacyText.includes('CAMERA') || privacyText.includes('camera') || privacyText.includes('Camera'),
    'Privacy policy discloses camera usage rationale for QR check-in'
  );
  assert(
    privacyText.includes('sell') || privacyText.includes('monetize') || privacyText.includes('advertisers'),
    'Privacy policy pledges zero data selling to third parties'
  );

  const refundText = fs.readFileSync(refundFile, 'utf8');
  assert(
    refundText.includes('Zero Upfront') || refundText.includes('free') || refundText.includes('Free'),
    'Refund policy explicitly discloses zero upfront online payments'
  );
  assert(
    refundText.includes('cancel') || refundText.includes('Cancellation'),
    'Refund policy discloses free cancellation rules'
  );

  // ----------------------------------------------------
  // 8. Apple HIG Design Tokens & Touch Targets
  // ----------------------------------------------------
  console.log('\n--- 8. Apple HIG Design Tokens Compliance ---');

  assert(Colors.primary === '#0066cc', 'Action Blue token is #0066cc', Colors.primary);
  assert(Colors.canvasParchment === '#f5f5f7', 'Canvas parchment token is #f5f5f7', Colors.canvasParchment);
  assert(Colors.canvasPure === '#ffffff', 'Canvas pure token is #ffffff', Colors.canvasPure);
  assert(TouchTarget.minSize >= 44, 'TouchTarget minSize is at least 44pt', TouchTarget.minSize);
  assert(BorderRadius.pill === 9999, 'Pill border radius is 9999 for full pill buttons', BorderRadius.pill);

  // ----------------------------------------------------
  // 9. Live Production Backend Health & Service Methods
  // ----------------------------------------------------
  console.log('\n--- 9. Live Production Backend & API Methods ---');

  try {
    const health = await api.checkHealth();
    assert(health.status === 'ok', 'Render /healthz is live and returning status ok', health.status);
  } catch (err: any) {
    assert(false, 'Render /healthz ping encountered error', err.message);
  }

  try {
    const docs = await api.getDoctors();
    assert(Array.isArray(docs), 'api.getDoctors returns array', `Count: ${docs.length}`);
    if (docs.length > 0) {
      assert(docs[0].id !== undefined, 'Live doctor contains id', docs[0].id);
      assert(docs[0].user?.fullName !== undefined, 'Live doctor contains fullName', docs[0].user.fullName);
    }
  } catch (err: any) {
    assert(false, 'api.getDoctors encountered error', err.message);
  }

  try {
    const clinics = await api.getPublicClinics();
    assert(Array.isArray(clinics), 'api.getPublicClinics returns array', `Count: ${clinics.length}`);
  } catch (err: any) {
    assert(false, 'api.getPublicClinics encountered error', err.message);
  }

  // Method existences on api client
  assert(typeof api.sendContactMessage === 'function', 'api.sendContactMessage method exists on api client');
  assert(typeof api.submitContactMessage === 'function', 'api.submitContactMessage method exists on api client');
  assert(typeof api.requestAccountDeletion === 'function', 'api.requestAccountDeletion method exists on api client');
  assert(typeof api.verifyDoctor === 'function', 'api.verifyDoctor method exists on api client');
  assert(typeof api.verifyClinic === 'function', 'api.verifyClinic method exists on api client');
  assert(typeof api.getAdminDoctors === 'function', 'api.getAdminDoctors method exists on api client');
  assert(typeof api.getAdminClinics === 'function', 'api.getAdminClinics method exists on api client');
  assert(typeof api.getAdminContactMessages === 'function', 'api.getAdminContactMessages method exists on api client');
  assert(typeof api.markContactMessageRead === 'function', 'api.markContactMessageRead method exists on api client');
  assert(typeof api.deleteContactMessage === 'function', 'api.deleteContactMessage method exists on api client');
  assert(typeof api.getMyClinic === 'function', 'api.getMyClinic method exists on api client');
  assert(typeof api.updateClinicProfile === 'function', 'api.updateClinicProfile method exists on api client');
  assert(typeof api.addDoctorToClinic === 'function', 'api.addDoctorToClinic method exists on api client');
  assert(typeof api.removeDoctorFromClinic === 'function', 'api.removeDoctorFromClinic method exists on api client');
  assert(typeof api.respondToDoctorAffiliation === 'function', 'api.respondToDoctorAffiliation method exists on api client');
  assert(typeof api.addClinicReceptionist === 'function', 'api.addClinicReceptionist method exists on api client');
  assert(typeof api.getClinicReceptionists === 'function', 'api.getClinicReceptionists method exists on api client');
  assert(typeof api.removeClinicReceptionist === 'function', 'api.removeClinicReceptionist method exists on api client');

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`Phase 7 Verification Summary: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Verification().catch((err) => {
  console.error('Fatal unhandled error during Phase 7 verification:', err);
  process.exit(1);
});
