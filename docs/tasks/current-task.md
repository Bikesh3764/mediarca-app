# Current Task: Phase 3 — Patient Discovery, Doctor Profiles & Step-by-Step Booking

**Target Directory:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca-App`  
**Reference Web App:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca`  
**Live Backend API:** `https://mediarca-mdwk.onrender.com/api`  
**Status:** COMPLETED  

---

## 1. Objectives & Scope

Execute Phase 3 of the MediArca native mobile application for the Google Play Store and iOS App Store:

1. **Patient Discovery Screen (`src/app/explore.tsx` & `src/app/doctors/index.tsx`)**:
   - Instant 250ms debounced search index matching simultaneously across doctor name, specialty, clinic facility name, and city.
   - Pinned Apple HIG horizontal specialty pill carousel (`SpecialtyPillCarousel.tsx`) with 44pt touch targets supporting 34 medical specialties.
   - Doctor discovery cards (`DoctorCard.tsx`) displaying photo/monogram avatar, verified shield badge, degrees formatted via `formatDoctorDegrees`, experience years, clinic affiliation, consultation fee in ₹, and real-time cabin badge.
   - Pull-to-refresh (`RefreshControl`), empty search state with filter reset, and error retry state.

2. **Doctor Detail Screen (`src/app/doctors/[id].tsx`)**:
   - Comprehensive doctor bio, specialty, and formatted medical qualifications.
   - Sleek 7-day Apple HIG circular letter discs (`M T W T F S S`) via `WeekdayDisplay.tsx`, highlighting practicing days, off days, and active today indicator with IST date arithmetic.
   - OPD Shift cards with formatted 12-hour timings (`format12Hour`), patient capacity limits, average consultation minutes, and leave status.
   - Affiliated clinics list with street addresses and one-tap telephone dialer (`Linking.openURL(toTelUri(clinic.phone))`).
   - Sticky bottom bar with consultation fee (`₹`) and 44pt pill "Book Token" CTA button.

3. **Step-by-Step Booking Flow (`src/app/book/[id].tsx`)**:
   - Step 1: Clinic venue selector for multi-facility doctors.
   - Step 2: Date selector with IST arithmetic (`getLocalDateString`, `getTomorrowDateString`, `getDayOfWeekCode`), disabling non-practice days and doctor leave days.
   - Step 3: Shift selector with live slot capacity indicators (`Available`, `Ended`, `Full`) and dynamic queue preview metrics (`api.getQueuePreview`).
   - Step 4: Patient information supporting "Book for Myself" (pre-filled from session) vs. "Book for Dependent" with strict age validation (0–125) and gender selection.
   - Step 5: Reason for visit and symptoms input fields.
   - Step 6: Confirmation sheet strictly enforcing the Zero-Upfront Payment Policy:
     - Clear disclosure: *"No payment required now. An estimated token will be issued. Pay ₹XXX directly to the clinic receptionist via UPI or at the desk."*
     - Submits payload to live backend `api.bookAppointment` generating `PENDING_APPROVAL` with `estimatedQueueNumber`.
     - Confirmation screen with token pass, receptionist telephone dialer, clinic address, and next instructions.

4. **Reusable UI Components**:
   - `src/components/common/CabinBadge.tsx`: Apple HIG pill badge for `IN_CABIN`, `STEPPED_OUT` (with dynamic return time), and `NOT_IN_CABIN`.
   - `src/components/common/WeekdayDisplay.tsx`: Circular 7-day discs with today's presence ring and leave badge.
   - `src/components/discovery/SpecialtyPillCarousel.tsx`: Horizontal specialty carousel with active fill state and 44pt touch targets.
   - `src/components/discovery/DoctorCard.tsx`: Tactile doctor card with monogram fallback, verified badge, fee, and booking CTA.

5. **Documentation & Architecture Decision Records**:
   - Created ADR `docs/decisions/007-patient-discovery-and-zero-upfront-booking.md`.
   - Updated `PROJECT.md` and `docs/tasks/current-task.md`.

6. **Automated Verification Suite**:
   - Built `scripts/verify-phase3.ts` testing 70 assertions across doctor search, specialty mapping, degree cleaning, cabin presence, weekday arithmetic, slot evaluation, booking payload validation, and live backend queries.
   - Total test assertions across all suites: 195/195 tests passing (100%).

---

## 2. Verification Checklist

- [x] TypeScript compilation: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- [x] Phase 1 Automated Suite: `npm run test:verify:phase1` passes 64/64 tests (100%).
- [x] Phase 2 Automated Suite: `npm run test:verify:phase2` passes 61/61 tests (100%).
- [x] Phase 3 Automated Suite: `npm run test:verify:phase3` passes 70/70 tests (100%).
- [x] All Tests Suite: `npm run test:verify:all` passes 195/195 assertions (100%).
- [x] Live Render backend `/doctors` endpoint queries live doctors from Supabase.
- [x] Live Render backend `/doctors/:id` endpoint resolves doctor profile.
- [x] Live Render backend `/appointments/queue-preview` computes next queue token and patients ahead.
- [x] Zero-Upfront Payment Policy disclosure clearly integrated.
- [x] Apple HIG 44pt touch targets and circular discs verified.
