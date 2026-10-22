# Current Task: Phase 5 — Doctor Live OPD Queue, Consultation Room & Schedule Manager

**Target Directory:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca-App`  
**Reference Web App:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca`  
**Live Backend API:** `https://mediarca-mdwk.onrender.com/api`  
**Status:** COMPLETED  

---

## 1. Objectives & Scope

Execute Phase 5 of the MediArca native mobile application for the Google Play Store and iOS App Store:

1. **Doctor OPD Live Queue Screen (`src/app/(doctor)/queue.tsx` & `/doctor/queue`, `/queue`)**:
   - **Sticky Real-Time Cabin Presence Switcher (`CabinPresenceSwitcher`)**:
     - `IN_CABIN` (Green indicator: "In Cabin")
     - `STEPPED_OUT` (Amber indicator: "Stepped Out", with quick return time selector sheet: 10m, 15m, 30m, 45m or custom time)
     - `NOT_IN_CABIN` (Gray/Red indicator: "Not in Cabin")
     - Real-time optimistic UI update with automatic state rollback on network failure calling `api.updateCabinPresence`.
   - **Multi-Shift Switcher & Clinic Selector (`DoctorShiftSelector`)**:
     - Filter queue by affiliated clinic facility and OPD shift (Morning OPD, Evening OPD) using `cleanSlotName`.
   - **Queue Segmented View (`PatientQueueCard`)**:
     - `Waiting`: Ordered strictly by token number ascending (`queueNumber`), with "Checked-In at Clinic" physical arrival indicator.
     - `In Consultation`: Highlighting currently active patient in cabin.
     - `Completed`: Archive of completed encounters.
   - **Atomic Patient Queue Actions**:
     - `Call to Cabin` (`api.callPatient`)
     - `Hold / Step Out` (`api.holdConsultation`)
     - `Open Consultation` (navigates to consultation room).

2. **OPD Consultation Room Screen (`src/app/(doctor)/consultation/[id].tsx` & `/doctor/consultation/[id]`)**:
   - **Patient Summary Card**: Name, Age, Gender, Phone (`formatIndianPhone`), Dependent patient banner, Chief Complaint / Symptoms, Token number.
   - **Vitals Input Card (`VitalsCard`)**:
     - Clinical bounds validation for Blood Pressure (Systolic 60-260 / Diastolic 40-160 mmHg, systolic > diastolic), Pulse (30-220 bpm), Body Temperature (90.0°F-110.0°F), and Weight (1.0-350.0 kg).
     - Live validation feedback with error messaging and success checkmarks.
   - **Clinical Diagnosis & Notes**: Assessment input and observations textarea.
   - **One-Tap Complete & Finish Action**:
     - Calls live backend `api.completeAppointment` (`completeConsultation`).
     - Clear notice directing the patient to the front desk for physical prescription collection and checkout.

3. **Doctor Schedule & Leave Management Screen (`src/app/(doctor)/schedule.tsx` & `/doctor/schedule`)**:
   - **Active Practice Days**: Apple HIG circular discs (`M T W T F S S`) with quick presets (`Weekdays`, `Mon-Sat`, `All 7`).
   - **Shift Configuration**: Start/end timings, max patient capacity, and dynamic average consultation minutes calculation (`calculateAverageConsultationMinutes`) supporting overnight shifts.
   - **Emergency "Take Leave Today" Toggle**: Real-time switch calling `api.addDoctorLeave(doctorId, { type: 'TODAY' })` to immediately halt new tokens.
   - **Scheduled Absence Manager**: Date-range picker for future vacation dates (`isDoctorOnLeave`) and leave cancellation.

4. **Doctor Profile & Clinic Affiliations Screen (`src/app/(doctor)/profile.tsx` & `/doctor/profile`)**:
   - **Cloudflare R2 Avatar Photo Upload**: Integrated with `expo-image-picker` with compression quality (`quality: 0.8`) and direct multipart upload to `api.uploadAvatar`.
   - **Clinic Affiliations Management**: Lists active affiliated clinics and handles incoming clinic requests with one-tap `Accept` and `Reject` actions (`api.respondToClinicAffiliation`).

5. **Documentation & Architecture Decision Records**:
   - Created ADR `docs/decisions/009-doctor-opd-console-and-consultation-workflow.md`.
   - Updated `PROJECT.md` and `docs/tasks/current-task.md`.

6. **Automated Verification Suite**:
   - Built `scripts/verify-phase5.ts` testing 108 assertions across BP bounds (systolic 60-260, diastolic 40-160, systolic > diastolic, unit suffixes), pulse ranges, temperature ranges, weight limits, expected return time math in IST UTC+05:30 across timezones, queue partitioning (including HOLD/CALLING/CONFIRMED), ascending token ordering, arrival check-in flags, shift consultation duration arithmetic, HIG weekday discs, historical TODAY leave isolation, timezone-safe Mon-Sat practice day calculations, and live Render backend doctor queries.
   - Total test assertions across all suites: 407/407 tests passing (100%).

---

## 2. Verification Checklist

- [x] TypeScript compilation: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- [x] Phase 1 Automated Suite: `npm run test:verify:phase1` passes 64/64 tests (100%).
- [x] Phase 2 Automated Suite: `npm run test:verify:phase2` passes 61/61 tests (100%).
- [x] Phase 3 Automated Suite: `npm run test:verify:phase3` passes 87/87 tests (100%).
- [x] Phase 4 Automated Suite: `npm run test:verify:phase4` passes 87/87 tests (100%).
- [x] Phase 5 Automated Suite: `npm run test:verify:phase5` passes 108/108 tests (100%).
- [x] All Tests Suite: `npm run test:verify:all` passes 407/407 assertions (100%).
- [x] Sticky Header Cabin Presence Switcher with In Cabin, Stepped Out (with 10m/15m/30m/45m/custom modal), and Not in Cabin verified.
- [x] Shift Switcher and Clinic Selector for multi-shift doctors verified.
- [x] Queue segmented view (Waiting ordered by token number, In Cabin, Completed) verified.
- [x] Patient actions: Call to Cabin, Hold, Open Consultation Room verified.
- [x] OPD Consultation Room with Patient Summary, Vitals Card, Diagnosis, Notes, and one-tap finish consultation verified.
- [x] Clinical bounds validation for BP (120/80), Pulse (30-220 bpm), Temp (90-110°F), and Weight (1-350 kg) verified.
- [x] Physical prescription collection guidance banner at encounter finish verified.
- [x] Doctor Schedule Manager with Apple HIG 7-day discs (M T W T F S S) verified.
- [x] Emergency "Take Leave Today" toggle and scheduled absence date-range picker verified.
- [x] Doctor Profile with Cloudflare R2 avatar photo upload and incoming clinic request Accept/Reject verified.
- [x] Apple HIG 44pt touch targets and full pill buttons verified.
- [x] Live Render backend doctor queries operational.
