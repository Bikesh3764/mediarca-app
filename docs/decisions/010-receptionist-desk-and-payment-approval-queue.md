# ADR 010: Receptionist Clinical Desk, Multi-Doctor Live Switcher, Online Payment Approvals & Walk-in Token Dispenser

## Status
Accepted

## Context
In Indian outpatient clinics and polyclinics, the front desk reception team serves as the critical operational hub connecting patients, practicing doctors, and clinical payment collection. Primary operational challenges include:
1. **Zero-Upfront Payment Barrier**: Under MediArca's zero-upfront booking policy, patients reserve queue positions online without paying third-party payment gateway fees. These requests enter the system as `PENDING_APPROVAL` with an estimated token number (`Est. #X`). The official sequential queue number is issued only when the receptionist verifies cash or counter UPI payment.
2. **Offline Walk-in Volume**: A substantial portion of Indian OPD patients arrive without prior digital bookings or smartphones (e.g. elderly patients or rural walk-ins). Front desk staff require a rapid, sub-30-second registration form to issue live sequential tokens (`WAITING` status) directly into the doctor's queue.
3. **Multi-Doctor Practice Coordination**: Polyclinics host multiple practicing specialists operating across distinct consultation cabins and shifts. Receptionists need real-time multi-doctor queue oversight, doctor cabin presence visibility (`IN_CABIN`, `STEPPED_OUT`, `NOT_IN_CABIN`), and seamless doctor switching.
4. **Physical Arrival Verification**: To prevent doctors from calling absent patients, physical arrival must be attested at the counter. Receptionists require both a hardware camera scanner to scan patient mobile ticket QR codes and a one-tap check-in toggle button for phone-less walk-ins.
5. **Temporary Password Security**: When clinic administrators onboard new reception staff, temporary passwords are generated. Front desk terminals access patient identifiers and queue operations, necessitating mandatory password updates (`mustChangePassword`) before clinical operations are unlocked.

---

## Decision

### 1. Multi-Doctor Live Desk Dashboard (`src/app/(receptionist)/desk.tsx` & `/desk`)
- **Active Doctor Switcher (`ActiveDoctorSwitcher`)**:
  - Horizontal pill carousel displaying all actively practicing doctors in the clinic.
  - Doctor avatar with real-time cabin presence dot (Green: `IN_CABIN`, Amber: `STEPPED_OUT`, Gray: `NOT_IN_CABIN`), doctor specialty, and active waiting patient count badge.
  - Highlighting the currently selected practitioner in Action Blue (`#0066cc`).
- **Multi-Doctor Overview Telemetry Card (`MultiDoctorOverviewCard`)**:
  - Summary grid displaying total clinic doctors, in-cabin count, total patients waiting across all clinic cabins, and total bookings today.
  - Action pill shortcuts: `Scan QR`, `+ Walk-In`, and `Approvals Queue` with live pending count badge.
- **Desk Patient Queue Card (`DeskPatientCard`)**:
  - High-contrast sequential token badge (`#1`, `#2`, `#3`...).
  - Patient full name, phone number (`formatIndianPhone`), age/gender, shift window, and estimated consultation time.
  - Live physical arrival badges: `Checked In` (Green checkmark chip) vs `Not Arrived` (Amber clock chip).
  - One-tap arrival toggle button (`onToggleCheckIn` calling `api.checkInAppointmentDirect`) enabling instant counter check-in for patients without smartphones.

### 2. Online Payment & Approvals Queue (`src/app/(receptionist)/approvals.tsx` & `/approvals`)
- **Real-Time Request Queue**:
  - Lists online booking requests in `PENDING_APPROVAL` status with patient full name, 10-digit Indian mobile number, consultation fee (`formatDisplayCurrency`), date, shift window, and estimated token number (`Est. #X`).
  - Search filter by patient name, mobile number, or doctor name.
- **Atomic Actions**:
  - `Approve Payment & Assign Token`: Confirms counter cash or UPI payment, calling `api.approveAppointment(id)`. Atomically transitions ticket from `PENDING_APPROVAL` to `WAITING` and locks in the official guaranteed queue number.
  - `Decline`: Modal dialog capturing clinical or operational justification before transitioning to `REJECTED` via `api.rejectAppointment(id, reason)`.

### 3. Rapid Walk-in Token Dispenser (`src/app/(receptionist)/walkin.tsx` & `/walkin`)
- **Streamlined Counter Form**:
  - Patient full name (minimum 2 characters).
  - 10-digit Indian mobile number (+91 prefix validation).
  - Practicing doctor selector chips and shift slot selector.
  - Family member / dependent booking checkbox with age validation (0–125 years).
  - Reason for visit / chief complaint input.
- **Direct Live Dispensing**:
  - `Dispense Token`: Calls live backend `api.createWalkinAppointment` generating instant sequential live token number (`WAITING` + `queueNumber`).
- **Instant Token Confirmation Sheet (`WalkinConfirmationModal`)**:
  - Modal sheet displaying large 44pt queue token number (`#X`), doctor name, clinic facility, shift window, and estimated consultation time.
  - Native SMS / WhatsApp sharing via `Share.share` and one-tap reset for next patient.

### 4. Counter Desk Hardware Camera QR Scanner (`src/components/receptionist/DeskQrScannerModal.tsx`)
- Native hardware camera viewfinder powered by `expo-camera` (`CameraView`).
- `parseTicketQrPayload` engine decoding JSON payloads (`{"appointmentId": "..."}`), URL parameters (`?appointmentId=...` / `?id=...`), URL path UUID segments, and raw UUID / `appt_` strings.
- Direct check-in integration via `api.checkInAppointmentDirect(appointmentId, true)` with tactile success vibration (`Haptics.notificationAsync`) and manual ID search tab fallback.

### 5. Mandatory Temporary Password Guard (`MustChangePasswordModal`)
- Modal sheet automatically triggered when `user.mustChangePassword` is active.
- Non-dismissible security overlay enforcing current temporary password entry, minimum 8-character new password, password diversity check (`new !== current`), and confirmation matching.
- Updates session credentials upon successful API response (`api.changeReceptionistPassword`).

### 6. Automated Verification Suite (`scripts/verify-phase6.ts`)
- 100 comprehensive automated assertions verifying:
  - Walk-in payload validation (+91 Indian phone, name bounds, age ranges, dependent fields, alphabetical checks).
  - Temporary password change validation (min 8 characters, diversity rule, confirmation matching).
  - Ticket QR payload parsing across JSON (including single-quoted JSON), URL query parameters (`appointmentId`, `ticketId`, `ticket_id`), URL path UUIDs, and raw strings.
  - Multi-doctor metrics aggregation and ascending sequential token sorting.
  - State machine transitions (`PENDING_APPROVAL` → `WAITING` with official tokens, rejection handling, role authorization).
  - Apple HIG design token compliance (44pt touch targets, `#0066cc` Action Blue, `#f5f5f7` canvas, 9999 pill borders).
  - Live Render production backend health, doctor catalog queries, and live unauthenticated receptionist auth guard verification.

---

## Consequences
- Front desk receptionists possess an intuitive, high-velocity counter workspace for managing high-volume Indian clinic queues.
- The Zero-Upfront Payment policy is fully safeguarded: official queue positions are granted only upon confirmed fee receipt.
- Walk-in patients receive instant live token assignments with printable/shareable confirmation passes.
- Offline and phone-less arrivals can be checked in with a single touch, preventing empty-cabin delays.
- Temporary passwords are securely transitioned on first login, protecting sensitive patient health records.
- 507/507 automated assertions across Phases 1 through 6 pass with 100% success and 0 TypeScript errors (`npm run typecheck`).
