# Current Task: Phase 6 — Receptionist Clinical Desk, Multi-Doctor Live Switcher, Online Approvals & Walk-In Dispenser

**Target Directory:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca-App`  
**Reference Web App:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca`  
**Live Backend API:** `https://mediarca-mdwk.onrender.com/api`  
**Status:** COMPLETED  

---

## 1. Objectives & Scope

Execute Phase 6 of the MediArca native mobile application for Google Play Store and iOS App Store:

1. **Multi-Doctor Live Desk Dashboard (`src/app/(receptionist)/desk.tsx` & `/desk`)**:
   - **Active Doctor Switcher (`ActiveDoctorSwitcher`)**:
     - Horizontal pill carousel displaying all actively practicing doctors in the clinic.
     - Doctor avatar with real-time cabin presence dot (Green: `IN_CABIN`, Amber: `STEPPED_OUT`, Gray: `NOT_IN_CABIN`), doctor specialty, and active waiting count badge.
     - Single-tap doctor selection highlighting the active practitioner in Action Blue (`#0066cc`).
   - **Multi-Doctor Overview Telemetry Card (`MultiDoctorOverviewCard`)**:
     - Clinic status grid: Total doctors, in-cabin count, total patients waiting across all clinic cabins, and total today bookings.
     - Quick action shortcuts: `Scan QR`, `+ Walk-In`, and `Approvals Queue` with live pending count badge.
   - **Desk Patient Card (`DeskPatientCard`)**:
     - High-contrast sequential token badge (`#1`, `#2`, `#3`...).
     - Patient full name, phone number (`formatIndianPhone`), age/gender, shift window, and estimated consultation time.
     - Live physical arrival badges: `Checked In` (Green checkmark chip) vs `Not Arrived` (Amber clock chip).
     - One-tap arrival toggle button calling `api.checkInAppointmentDirect` enabling instant counter check-in for patients without smartphones.

2. **Online Payment & Approvals Queue (`src/app/(receptionist)/approvals.tsx` & `/approvals`)**:
   - Real-time queue listing booking requests in `PENDING_APPROVAL` status with patient full name, 10-digit Indian phone, consultation fee, date, shift window, and estimated token number (`Est. #X`).
   - Search filter by patient name, phone number, or doctor name.
   - Direct action: `Approve Payment & Assign Token` calling `api.approveAppointment(id)`. Confirms counter cash or UPI payment, transitions ticket from `PENDING_APPROVAL` to `WAITING`, and locks in the official guaranteed sequential queue number.
   - Decline action with clinical/operational reason dialog calling `api.rejectAppointment(id, reason)`.

3. **Rapid Walk-in Token Dispenser (`src/app/(receptionist)/walkin.tsx` & `/walkin`)**:
   - Streamlined counter registration form: Patient full name, 10-digit Indian mobile number (+91 validation), practicing doctor selector, and shift slot selector.
   - Family member / dependent booking toggle with age validation (0–125 years).
   - Reason for visit / chief complaint input.
   - Direct action: `Dispense Token` calling live `api.createWalkinAppointment` generating instant sequential live token number (`WAITING` + `queueNumber`).
   - Instant token confirmation sheet (`WalkinConfirmationModal`) displaying large 44pt queue token number (`#X`), doctor name, clinic facility, shift window, and estimated consultation time with native SMS / WhatsApp sharing.

4. **Counter Desk Camera QR Scanner (`src/components/receptionist/DeskQrScannerModal.tsx`)**:
   - Fast hardware camera scanner powered by `expo-camera` (`CameraView`) to scan arriving patients' mobile ticket QR codes directly at the counter.
   - `parseTicketQrPayload` engine decoding JSON payloads, URL query parameters, URL path UUID segments, and raw UUID / `appt_` strings.
   - Direct check-in integration via `api.checkInAppointmentDirect(appointmentId, true)` with tactile success haptic vibration (`Haptics.notificationAsync`) and manual ID search tab fallback.

5. **Mandatory Temporary Password Guard (`MustChangePasswordModal`)**:
   - Enforces `mustChangePassword` flow on first login for receptionist accounts created by clinic with a temporary password.
   - Validates current password, minimum 8-character new password, password diversity check (`new !== current`), and confirmation matching.
   - Calls `api.changeReceptionistPassword` and updates session credentials upon success.

6. **Documentation & Architecture Decision Records**:
   - Created ADR `docs/decisions/010-receptionist-desk-and-payment-approval-queue.md`.
   - Updated `PROJECT.md` and `docs/tasks/current-task.md`.

7. **Automated Verification Suite (`scripts/verify-phase6.ts`)**:
   - Built dedicated Phase 6 suite testing 92 assertions covering walk-in dispenser payload validation (+91 phone, name bounds, age, dependents), temporary password guards, counter QR ticket parser across all formats, multi-doctor aggregation metrics, ascending queue token sorting, payment approval state machine transitions (`PENDING_APPROVAL` → `WAITING` + official token, rejection handling, role authorization), Apple HIG design tokens, and live Render backend receptionist API queries.
   - Total test assertions across all suites: 499/499 tests passing (100%).

---

## 2. Verification Checklist

- [x] TypeScript compilation: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- [x] Phase 1 Automated Suite: `npm run test:verify:phase1` passes 64/64 tests (100%).
- [x] Phase 2 Automated Suite: `npm run test:verify:phase2` passes 61/61 tests (100%).
- [x] Phase 3 Automated Suite: `npm run test:verify:phase3` passes 87/87 tests (100%).
- [x] Phase 4 Automated Suite: `npm run test:verify:phase4` passes 87/87 tests (100%).
- [x] Phase 5 Automated Suite: `npm run test:verify:phase5` passes 108/108 tests (100%).
- [x] Phase 6 Automated Suite: `npm run test:verify:phase6` passes 92/92 tests (100%).
- [x] All Tests Suite: `npm run test:verify:all` passes 499/499 assertions (100%).
- [x] Multi-Doctor Live Desk Dashboard (`ActiveDoctorSwitcher`) with avatar, cabin presence dot, specialty, and waiting count verified.
- [x] Multi-Doctor Overview Telemetry Card (`MultiDoctorOverviewCard`) with clinic metrics and quick action shortcuts verified.
- [x] Desk Patient Queue Card (`DeskPatientCard`) with token `#X`, patient details, arrival badges (`Checked In` vs `Not Arrived`), and one-tap check-in toggle button verified.
- [x] Online Payment Approvals Queue (`approvals.tsx`) with fee display, search filter, and `Approve Payment & Assign Token` (`PENDING_APPROVAL` → `WAITING` + official sequential queue number) verified.
- [x] Rejection flow with clinical reason dialog (`rejectAppointment`) verified.
- [x] Rapid Walk-in Token Dispenser (`walkin.tsx`) with 10-digit Indian mobile validation (+91), doctor selector, shift selector, and `api.createWalkinAppointment` verified.
- [x] Walk-in Token Confirmation Sheet (`WalkinConfirmationModal`) with large 44pt token `#X`, details table, and native sharing verified.
- [x] Counter Desk Hardware Camera QR Scanner (`DeskQrScannerModal`) with `expo-camera`, laser animation, torch toggle, `parseTicketQrPayload`, and direct check-in verified.
- [x] Mandatory Temporary Password Guard (`MustChangePasswordModal`) enforcing `mustChangePassword` flow verified.
- [x] Apple HIG 44pt touch targets, full pill buttons (`borderRadius: 9999`), Action Blue (`#0066cc`), and Parchment canvas (`#f5f5f7`) verified.
- [x] Live Render backend communication operational.
