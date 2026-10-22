# Project: MediArca Native Mobile Application (Android & iOS)

## 1. System Architecture

MediArca Mobile is the official native application for the MediArca Healthcare Platform, targeting the Google Play Store (Android 14/15, Target SDK 34+) and Apple App Store.

- **Frontend Core**: React Native, Expo SDK 58, Expo Router v58, TypeScript strict mode.
- **Design System**: Apple Human Interface Guidelines (`MOBILE_DESIGN.md`) — Action Blue (`#0066cc`), parchment canvas (`#f5f5f7`), pure white cards (`#ffffff`), high-contrast ink (`#1d1d1f`), and 44x44pt minimum touch targets.
- **Production Backend**: Express 5, Node.js, Prisma ORM 6 on Render (`https://mediarca-mdwk.onrender.com/api`).
- **Database**: Supabase PostgreSQL (`Asia/Kolkata` IST timezone, Mumbai).
- **Asset Storage & CDN**: Cloudflare R2 (`https://pub-a590817d9f404eb889f6482b025ea9ad.r2.dev`).
- **Core Guardrails**: Zero-upfront payment policy (pay-to-receptionist coordination via UPI/desk), physical clinic queue focus, 60fps hardware QR camera check-in, +91 Indian phone standard lock, role-scoped account uniqueness (`@@unique([email, role])`).

---

## 2. Implementation Roadmap & Milestones

| Milestone | Scope & Deliverables | Dependencies | Status |
| :---: | :--- | :---: | :---: |
| **Phase 1** | **Scaffold, Design Tokens & Core Service Layer**: Expo SDK 58 setup, Apple HIG tokens (`constants/theme.ts`), API service layer (`services/api.ts`, `safeFetch.ts`), IST date math utilities, Safe Area Layout, Health Ping verification, Full Markdown Documentation & GitHub repo sync. | None | **COMPLETED** |
| **Phase 2** | **Multi-Role Authentication & Secure Storage**: Hardware-backed `expo-secure-store`, multi-role login (Patient, Doctor, Receptionist, Clinic), `+91` phone validation, 6-digit email OTP screen with 60s countdown, reusable Apple HIG UI components, automated verification suite. | Phase 1 | **COMPLETED** |
| **Phase 3** | **Patient Discovery, Doctor Profiles & Step Booking**: Debounced specialty search, live cabin presence badges, weekly practice discs (`M T W T F S S`), step-by-step booking sheet, zero-upfront fee disclosure. | Phase 2 | **COMPLETED** |
| **Phase 4** | **Live Queue Pass, Receptionist Direct Dial & QR Check-In**: Live Queue Pass card, dynamic queue polling (10s/15s/60s), one-tap receptionist phone dialer (`Linking.openURL`), native 60fps camera QR scanner (`expo-camera`), haptic vibration (`expo-haptics`). | Phase 3 | **COMPLETED** |
| **Phase 5** | **Doctor Console, Live OPD Queue & Consultation Room**: Doctor live queue screen, sticky cabin presence toggle with return time modal, consultation room with vitals entry (BP, Pulse, Temp, Weight), shift and leave management. | Phase 4 | Queued |
| **Phase 6** | **Receptionist Multi-Doctor Desk & Walk-In Dispenser**: Multi-doctor queue dashboard, online appointment approvals (`PENDING_APPROVAL` → `WAITING`), walk-in token dispenser form, counter ticket scanner. | Phase 5 | **COMPLETED** |
| **Phase 7** | **Clinic/Admin Portals, Play Store Assets & EAS Build**: Clinic management, QR standee generator/export, legal compliance pages (Privacy Policy, Terms), self-serve account deletion, EAS cloud build configuration (`eas.json`), production `.aab` generation. | Phase 6 | Queued |

---

## 3. Interface Contracts & Architectural Invariants

### 3.1 Network Safety & Mutation Idempotency Contract (`safeFetch`)
- Bounded 15-second request timeouts (`DEFAULT_REQUEST_TIMEOUT_MS = 15000`).
- Transparent retries with exponential backoff and jitter strictly permitted on idempotent read operations (`GET`, `HEAD`) encountering 502/503/504 status codes.
- **Strictly ZERO automatic retries for mutations (`POST`, `PUT`, `PATCH`, `DELETE`)** to prevent duplicate appointment bookings, payment confirmations, or token assignments.

### 3.2 Pay-to-Receptionist Coordination Contract
- Online booking generates appointment status `PENDING_APPROVAL` with `estimatedQueueNumber` without upfront payment gateway charges.
- The Live Queue Ticket provides a one-tap direct telephone dialer (`Linking.openURL(toTelUri(receptionistPhone))`) so patients can call the receptionist to pay via UPI or pay at the desk upon arrival.
- Receptionist verifies payment and assigns the official live queue number (`WAITING` + `queueNumber`).

### 3.3 Touch Ergonomics & Accessibility Contract
- Minimum 44x44 physical points touch targets (`TouchTarget.minSize = 44`) on all clickable elements.
- Full pill action buttons (`borderRadius: 9999`) with subtle pressed state feedback.
- Clean alternation between Parchment Canvas (`#f5f5f7`) and Pure White (`#ffffff`) without muddy drop shadows.

### 3.4 IST Timezone & Localization Contract
- All clinic shift schedules, slot availability, and doctor presence calculations operate in Indian Standard Time (`Asia/Kolkata`, UTC +05:30) via `getLocalDateString()` and `getIndianTimeMinutes()`.
- Phone numbers are validated against the 10-digit Indian standard starting with digits 6–9 and formatted with standard `+91 ` prefix.
- Consultation fees are formatted with Indian Rupee symbol (`₹`).

---

## 4. Phase 1 Verification Record

- **TypeScript Typecheck**: 0 errors (`npm run typecheck` / `tsc --noEmit`).
- **Android Hermes Bytecode Compilation**: 1,710 modules cleanly bundled into production `.hbc` Hermes bytecode via Metro (`npx expo export -p android`).
- **Test Suite**: 100% pass across design tokens, mutation safety, phone validation, IST date math, and live Supabase queries (`npm run test:verify:phase1`).
- **Live Backend Telemetry**:
  - `/healthz` → `status: ok`, `database: connected` (Supabase PostgreSQL), `redis: connected`.
  - `/api/health` → `status: ok`.
  - Live Doctor Roster & Public Clinics successfully queried.
- **GitHub Repository**: Pushed and synced at `https://github.com/Bikesh3764/mediarca-app`.

---

## 5. Phase 2 Verification Record

- **TypeScript Typecheck**: 0 errors (`npm run typecheck` / `tsc --noEmit`).
- **Automated Verification Suite (`scripts/verify-phase2.ts`)**: 58/58 passed (100% pass rate).
- **All Suites (`npm run test:verify:all`)**: 122/122 assertions passed with 0 failures across both Phase 1 and Phase 2.
- **SecureStore Hardware Encryption**:
  - Validated hardware token persistence and profile serialization/deserialization.
  - Tested corrupted JSON recovery with automatic key purging and zero unhandled exceptions.
  - Verified role persistence (`PATIENT`, `DOCTOR`, `RECEPTIONIST`, `CLINIC`, `ADMIN`) and session wiping.
- **Apple HIG Auth Interfaces**:
  - Built `AppCard`, `AppButton` (44pt min height, pill radius 9999), `AppInput`, `AppBadge`, `ScreenWrapper`.
  - Built `src/app/(auth)/login.tsx` with role switcher tabs, email / +91 mobile toggle, password eye toggle, and Google Sign-In.
  - Built `src/app/(auth)/signup.tsx` with role-aware fields, credentials, and medical compliance declarations.
  - Built `src/app/(auth)/verify-otp.tsx` with auto-advancing 6-digit grid and 60-second countdown timer with resend cooldown.
- **Live Render Production Guard Testing**:
  - Verified `/auth/login` rejects bad credentials with 401 Unauthorized (guard active).
  - Verified `/auth/register` rejects malformed bodies with 400 Bad Request (validation active).
  - Verified `/auth/verify-otp` rejects invalid OTPs.

---

## 6. Phase 3 Verification Record

- **TypeScript Typecheck**: 0 errors (`npm run typecheck` / `tsc --noEmit`).
- **Automated Verification Suite (`scripts/verify-phase3.ts`)**: 87/87 passed (100% pass rate).
- **All Suites (`npm run test:verify:all`)**: 212/212 assertions passed with 0 failures across Phase 1 (64), Phase 2 (61), and Phase 3 (87).
- **Patient Discovery & Doctor Search**:
  - Implemented instant 250ms debounced search filtering by Doctor Name, Specialty, Clinic Name, and City.
  - Built `SpecialtyPillCarousel.tsx` with 34 medical specialties and 44pt touch targets.
  - Built `DoctorCard.tsx` with Cloudflare R2 photos, verified badges, degree cleaning, and real-time cabin badge.
- **Doctor Detail Screen**:
  - Built `src/app/doctors/[id].tsx` with comprehensive credentials, medical council registration badge, about bio, and affiliated clinics with receptionist indicator.
  - Built `WeekdayDisplay.tsx` featuring Apple HIG circular 7-day letter discs (`M T W T F S S`), active today ring, and leave indicator.
  - Shift cards displaying start/end timings (`format12Hour`), patient capacity limits, average consultation minutes, and leave status pills.
  - Sticky bottom bar with consultation fee (`₹`) and 44pt pill "Book Token" button.
- **Step-by-Step Booking Engine & Zero-Upfront Policy**:
  - Built `src/app/book/[id].tsx` featuring 6-step progressive disclosure: Clinic selector with dynamic slot synchronization, IST Date selector (with non-practice day and leave guard), Shift selector with live slot capacity indicators (`Available`, `Ended`, `Full`), Patient details (Self vs. Dependent with 0–125 age bounds), and Consultation reasons.
  - Step 6 Confirmation Sheet modal: Apple HIG slide-up bottom sheet reviewing doctor, clinic, date/shift, patient details, and Zero-Upfront Payment policy before triggering mutations.
  - Auth Guard: Dynamic gate redirecting unauthenticated patients to `/(auth)/login` instead of exposing them to raw 401 API rejections.
  - Enforced Zero-Upfront Payment Policy with explicit disclosure.
  - Generates `PENDING_APPROVAL` appointment with `estimatedQueueNumber` via live backend `api.bookAppointment`.
  - Confirmation screen with token pass, receptionist telephone dialer (`Linking.openURL(toTelUri)`), clinic venue, and instructions.

---

## 7. Phase 4 Verification Record

- **TypeScript Typecheck**: 0 errors (`npm run typecheck` / `tsc --noEmit`).
- **Automated Verification Suite (`scripts/verify-phase4.ts`)**: 87/87 passed (100% pass rate).
- **All Suites (`npm run test:verify:all`)**: 299/299 assertions passed with 0 failures across Phase 1 (64), Phase 2 (61), Phase 3 (87), and Phase 4 (87).
- **Live Queue Pass & Ticket Architecture**:
  - Built `src/app/(tabs)/passes.tsx` and `src/app/passes.tsx` with segmented tabs (`Active Passes` vs `Past Visits`), pull-to-refresh (`RefreshControl`), and authentication gating.
  - Built `LiveQueueTicket.tsx` featuring active status pulse indicator banner, big bold tokens (`#X` vs `#X (Estimated)`), clinic address presentation, real-time cabin presence sync (`CabinBadge`), 3-tile metadata grid (Date, Shift, Est. Time / Status), and arrival check-in action.
  - Built `DoctorReturnTimeModal` in `LiveQueueTicket.tsx` seamlessly synchronizing when a doctor is `STEPPED_OUT`, presenting expected return time, queue token preservation assurance, and direct button to call the reception desk.
  - Arrival Check-In Card featuring explicit "Arrived & Verified" badge with checkmark indicator and step-out toggle, or "Scan Clinic QR" camera button.
  - Built `QueueTelemetryCard.tsx` displaying live queue serving token, patients ahead (`patientsAway`), dynamic wait time via `formatWaitTime`, and touchable stepped-out alert linking directly to return time modal.
  - Built `ReceptionistCallCard.tsx` with one-tap native telephone button (`Linking.openURL(toTelUri(receptionistPhone))`) with native alert fallback enabling patients to coordinate desk fee payment via UPI or coordinate arrival.
- **Adaptive Polling Engine**:
  - Implemented `calculatePollingInterval`: 0ms (paused) when app is backgrounded (`AppState !== 'active'`) or 0 active passes; 10s (10,000ms) when near front of queue (`patientsAway <= 2` or in consultation) during an active clinic shift; 15s (15,000ms) during an active clinic shift; 60s (60,000ms) when shift is inactive or for future-dated tickets.
- **Hardware Camera QR Check-In (`CameraQrScannerModal`)**:
  - Viewfinder with `expo-camera` (`CameraView` with `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`).
  - Animated laser scan line (`Animated.loop`), flashlight/torch toggle, and close button.
  - Multi-format payload decoding: JSON (`{"clinicId": "...", "checkinCode": "..."}` or `{"id": "cl_..."}`), URL parameters (`/clinic-checkin?clinicId=...&code=...`), URL path segments (`/clinics/cl_...`), and raw IDs via `parseQrPayload`.
  - Tactile haptic feedback via `expo-haptics` (`Haptics.notificationAsync`) triggering on confirmed arrival verification.
  - Clear permission handling with settings redirect (`Linking.openSettings()`) and manual 6-character check-in code input fallback with clinic ID prevalidation.

---

## 8. Phase 5 Verification Record

- **TypeScript Typecheck**: 0 errors (`npm run typecheck` / `tsc --noEmit`).
- **Automated Verification Suite (`scripts/verify-phase5.ts`)**: 108/108 passed (100% pass rate).
- **All Suites (`npm run test:verify:all`)**: 407/407 assertions passed with 0 failures across Phase 1 (64), Phase 2 (61), Phase 3 (87), Phase 4 (87), and Phase 5 (108).
- **Doctor Live OPD Queue Architecture**:
  - Built `src/app/(doctor)/queue.tsx`, `/doctor/queue`, and `/queue` featuring sticky real-time Cabin Presence Switcher (`CabinPresenceSwitcher`) with `IN_CABIN` (Green indicator: "In Cabin"), `STEPPED_OUT` (Amber indicator: "Stepped Out", with quick return time selector sheet: 10m, 15m, 30m, 45m or custom modal), and `NOT_IN_CABIN` (Gray/Red indicator: "Not in Cabin").
  - Optimistic UI state updates with automatic rollback and error recovery upon network failure calling `api.updateCabinPresence`.
  - Shift Switcher & Venue Selector (`DoctorShiftSelector`) enabling doctors practicing across multiple clinics and shifts to dynamically filter queue telemetry.
  - Queue Segmented View (`PatientQueueCard`) separating `Waiting` (ordered ascending by `queueNumber`, with "Checked-In at Clinic" physical arrival indicator), `In Consultation` (active patient with pulse indicator), and `Completed` visits.
  - Atomic patient queue actions: `Call to Cabin` (`api.callPatient`), `Hold / Step Out` (`api.holdConsultation`), and `Open Consultation`.
- **OPD Consultation Room (`src/app/(doctor)/consultation/[id].tsx` & `/doctor/consultation/[id]`)**:
  - Patient Summary Card: Name, age, gender, phone (`formatIndianPhone`), dependent patient banner, and chief complaint / symptoms.
  - Clinical Vitals Card (`VitalsCard`): Real-time physiological bounds validation for Blood Pressure (systolic 60–260 / diastolic 40–160 mmHg, `systolic > diastolic`), Pulse (30–220 bpm), Body Temperature (90.0°F–110.0°F), and Weight (1.0–350.0 kg).
  - Clinical Diagnosis & Notes: Assessment field, observations textarea, and patient advice.
  - One-tap `Complete & Finish Consultation` calling `api.completeAppointment`, confirming encounter closure and directing the patient to the front desk for physical prescription collection and checkout.
- **Doctor Schedule & Leave Manager (`src/app/(doctor)/schedule.tsx` & `/doctor/schedule`)**:
  - Apple HIG 7-Day circular discs (`M T W T F S S`) with quick presets (`Weekdays`, `Mon-Sat`, `All 7`).
  - Shift Capacity Configuration: Start/end timings, max patient capacity, and dynamic average consultation minutes calculation (`calculateAverageConsultationMinutes`) supporting overnight shifts.
  - Emergency "Take Leave Today" toggle calling `api.addDoctorLeave(doctorId, { type: 'TODAY' })` to immediately halt new tokens.
  - Scheduled Absence Manager: Date-range picker for future vacation dates (`isDoctorOnLeave`) and leave cancellation.
- **Doctor Profile & Affiliations (`src/app/(doctor)/profile.tsx` & `/doctor/profile`)**:
  - Cloudflare R2 avatar photo upload integrated with `expo-image-picker` with compression quality (`quality: 0.8`) and direct multipart upload to `api.uploadAvatar`.
  - Clinic Affiliations Management: Lists active affiliated clinics and handles incoming clinic requests with one-tap `Accept` and `Reject` actions (`api.respondToClinicAffiliation`).

---

## 9. Phase 6 Verification Record

- **TypeScript Typecheck**: 0 errors (`npm run typecheck` / `tsc --noEmit`).
- **Automated Verification Suite (`scripts/verify-phase6.ts`)**: 100/100 passed (100% pass rate).
- **All Suites (`npm run test:verify:all`)**: 507/507 assertions passed with 0 failures across Phase 1 (64), Phase 2 (61), Phase 3 (87), Phase 4 (87), Phase 5 (108), and Phase 6 (100).
- **Multi-Doctor Live Desk Dashboard (`src/app/(receptionist)/desk.tsx`, `/desk`)**:
  - Horizontal pill doctor carousel (`ActiveDoctorSwitcher.tsx`) displaying doctor avatar, cabin presence dot (`IN_CABIN`, `STEPPED_OUT`, `NOT_IN_CABIN`), doctor specialty, and active waiting patient count badge.
  - Multi-Doctor Telemetry Overview (`MultiDoctorOverviewCard.tsx`): Clinic header with 4-tile metric telemetry (active doctors, waiting queue, pending approvals, total bookings) and quick-action navigation buttons.
  - Desk Patient Queue Cards (`DeskPatientCard.tsx`): 44pt token badge `#X`, patient details, Indian phone formatter, live arrival badges (`Checked In` vs `Not Arrived`), direct telephone dialer (`Linking.openURL`), and one-tap physical arrival toggle (`api.checkInAppointmentDirect`) for phone-less arrivals.
- **Online Payment & Approvals Queue (`src/app/(receptionist)/approvals.tsx`, `/approvals`)**:
  - Lists online booking requests in `PENDING_APPROVAL` status with patient details, consultation fee in INR (`formatDisplayCurrency`), date, shift window, and estimated token number (`Est. #X`).
  - Search filter by patient name, mobile number, or doctor name.
  - One-tap `Approve Payment & Assign Token` calling `api.approveAppointment(id)`: atomically transitions ticket from `PENDING_APPROVAL` to `WAITING` and assigns official sequential queue number.
  - `Reject / Decline` modal dialog capturing operational/clinical rejection justification before calling `api.rejectAppointment(id, reason)`.
- **Rapid Walk-in Token Dispenser (`src/app/(receptionist)/walkin.tsx`, `/walkin`)**:
  - Sub-30-second registration form for phone-less/counter patients.
  - Validates 10-digit Indian mobile number (`validateWalkinPayload`), patient full name, age (0–125), gender, doctor selector, shift selector, and chief complaint.
  - Direct token creation calling `api.createWalkinAppointment`: instantly generates `WAITING` status appointment with sequential token.
  - Printable / Shareable Confirmation Modal (`WalkinConfirmationModal.tsx`): 44pt token badge `#X`, details grid, native sharing (`Share.share`), and one-tap reset for next patient.
- **Counter Desk Hardware Camera QR Scanner (`src/components/receptionist/DeskQrScannerModal.tsx`)**:
  - Hardware camera scanner using `expo-camera` (`CameraView`) with laser animation, torch toggle, and multi-format payload decoding (`parseTicketQrPayload`).
  - Scans patient mobile ticket QR codes at the counter and triggers arrival verification with haptic feedback (`expo-haptics`).
  - Manual appointment ID entry fallback with prevalidation.
- **Temporary Password Guard (`src/components/receptionist/MustChangePasswordModal.tsx`)**:
  - Mandatory password change modal enforcing `mustChangePassword` flow on first login for receptionist accounts (`api.changePasswordDirect`).
  - Enforces minimum 8 characters, password confirmation matching, and prevents dismissal until password is updated.

---

## 10. Complete Documentation Index

- **Product Specification**: [MediArca_Feature_Specification.md](file:///./MediArca_Feature_Specification.md)
- **Mobile Design System**: [MOBILE_DESIGN.md](file:///./MOBILE_DESIGN.md)
- **System Architecture**: [ARCHITECTURE.md](file:///./ARCHITECTURE.md) & [docs/architecture.md](file:///./docs/architecture.md)
- **Project Tracker**: [PROJECT.md](file:///./PROJECT.md)
- **Technical Implementation**: [IMPLEMENTATION.md](file:///./IMPLEMENTATION.md)
- **Agent Guidelines & Rules**: [AGENTS.md](file:///./AGENTS.md)
- **Known Issues & Anti-Patterns**: [docs/known-issues.md](file:///./docs/known-issues.md)
- **Active Sprint & Checklist**: [docs/tasks/current-task.md](file:///./docs/tasks/current-task.md)
- **Architecture Decision Records**:
  - [ADR 001: Apple HIG Design System Tokens](file:///./docs/decisions/001-apple-hig-design-system.md)
  - [ADR 002: Technology Stack (Expo SDK 58 & Expo Router)](file:///./docs/decisions/002-expo-sdk-58-router.md)
  - [ADR 003: Network Safety & Mutation Idempotency](file:///./docs/decisions/003-safe-fetch-mutation-idempotency.md)
  - [ADR 004: IST (Asia/Kolkata) Healthcare Date Standard](file:///./docs/decisions/004-ist-timezone-standard.md)
  - [ADR 005: Direct Connection to Live Render Backend](file:///./docs/decisions/005-direct-render-production-wiring.md)
  - [ADR 006: Hardware-Backed SecureStore Session Management](file:///./docs/decisions/006-secure-store-session-management.md)
  - [ADR 007: Patient Discovery & Zero-Upfront Token Booking](file:///./docs/decisions/007-patient-discovery-and-zero-upfront-booking.md)
  - [ADR 008: Live Queue Ticket & Hardware Camera Check-In](file:///./docs/decisions/008-live-queue-ticket-and-hardware-camera-checkin.md)
  - [ADR 009: Doctor OPD Live Queue Console & Consultation Workflow](file:///./docs/decisions/009-doctor-opd-console-and-consultation-workflow.md)
  - [ADR 010: Receptionist Clinical Desk & Online Approvals Queue](file:///./docs/decisions/010-receptionist-desk-and-payment-approval-queue.md)

