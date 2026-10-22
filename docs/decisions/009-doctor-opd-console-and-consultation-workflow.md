# ADR 009: Doctor OPD Live Queue Console, Clinical Vitals Validation & Consultation Workflow

## Status
Accepted

## Context
In Indian outpatient clinics and polyclinics, doctors operate under intense patient volumes with multi-shift schedules across multiple clinic facilities. Key operational challenges include:
1. **Cabin Presence Volatility**: Doctors frequently step out of their consultation cabins to examine patients in procedure rooms, review diagnostic reports, or attend brief emergencies. Without real-time cabin presence states, patients and clinic staff are unaware of availability, causing queue stagnation.
2. **Multi-Shift and Multi-Clinic Practice**: Doctors practice across multiple shifts (Morning OPD, Evening OPD) and different clinic affiliations, each with unique consultation capacities and fee structures.
3. **Queue State Transitions**: Patient intake requires clear segmentation between patients currently waiting (ordered by token number), the patient actively inside the cabin (`IN_CONSULTATION`), and completed visits. Doctors need atomic actions (`Call to Cabin`, `Hold / Step Out`, `Open Consultation Room`).
4. **Clinical Data Integrity**: During consultation intake, patient vitals (Blood Pressure, Pulse, Body Temperature, Weight) must be validated against physiological clinical bounds before concluding visits to prevent documentation errors.
5. **Zero-Upfront Prescription Handover**: Under the Zero-Upfront Payment policy, finishing an encounter directs the patient to the clinic front desk for physical prescription collection and fee checkout.
6. **Schedule & Absence Management**: Doctors require immediate emergency leave controls ("Take Leave Today") and planned date-range absence scheduling to block booking slots without breaking future queue allocations.

## Decision
1. **Doctor OPD Live Queue Screen (`src/app/(doctor)/queue.tsx` & `/doctor/queue`)**:
   - **Sticky Real-Time Cabin Presence Switcher (`CabinPresenceSwitcher`)**:
     - Three discrete states: `IN_CABIN` (Green indicator: "In Cabin"), `STEPPED_OUT` (Amber indicator: "Stepped Out"), `NOT_IN_CABIN` (Gray indicator: "Not in Cabin").
     - Quick return time selector sheet with presets (`10m`, `15m`, `30m`, `45m`) and custom duration modal with 12-hour IST time calculation (`calculateExpectedReturnTime`).
     - Optimistic UI updates with automatic state rollback and error recovery upon network failures.
   - **Multi-Shift & Venue Selector (`DoctorShiftSelector`)**:
     - Allows toggling between practicing clinic facilities and specific OPD shifts (`cleanSlotName`), dynamically filtering the live queue.
   - **Queue Segmented View (`PatientQueueCard`)**:
     - `Waiting`: Ordered strictly by token number ascending (`queueNumber`), displaying verified physical arrival status ("Checked In at Clinic" with active presence dot).
     - `In Consultation`: Highlighting the active patient inside the cabin with pulse indicator and direct encounter controls.
     - `Completed`: Archive of finished encounters with encounter review access.
   - **Atomic Patient Queue Actions**:
     - `Call to Cabin`: Calls backend `api.callPatient` transitioning appointment to `IN_CONSULTATION`.
     - `Hold / Step Out`: Calls backend `api.holdConsultation` placing patient back in the waiting queue.
     - `Open Consultation`: Navigates to the consultation room.

2. **OPD Consultation Room (`src/app/(doctor)/consultation/[id].tsx` & `/doctor/consultation/[id]`)**:
   - **Patient Summary Card**: Displays patient name, age, gender, phone (`formatIndianPhone`), dependent booking indicator, and chief complaint / symptoms.
   - **Vitals Input Card (`VitalsCard`)**:
     - Real-time clinical bounds validation:
       - Blood Pressure: Systolic (60–260 mmHg) / Diastolic (40–160 mmHg) with `systolic > diastolic` constraint.
       - Pulse Rate: 30–220 bpm.
       - Body Temperature: 90.0°F–110.0°F.
       - Patient Weight: 1.0–350.0 kg.
     - Visual validation feedback: Green checkmarks on valid fields and specific clinical guidance text on invalid values.
   - **Diagnosis & Notes**: Assessment, clinical observations, and patient instructions.
   - **Finish Action**: One-tap `Complete & Finish Consultation` calling `api.completeAppointment`, confirming closure and directing patient to front desk for physical prescription collection.

3. **Doctor Schedule & Leave Manager (`src/app/(doctor)/schedule.tsx` & `/doctor/schedule`)**:
   - **Apple HIG Practice Discs (`M T W T F S S`)**: 7 circular discs mapped to `APPLE_HIG_WEEKDAYS` (`MON` through `SUN`) with quick presets (`Weekdays`, `Mon-Sat`, `All 7`).
   - **Shift Capacity Configuration**: Start/end timings, max patient capacity, and dynamic average consultation minutes calculation (`calculateAverageConsultationMinutes`) supporting overnight shifts.
   - **Emergency "Take Leave Today" Toggle**: Real-time switch calling `api.addDoctorLeave(doctorId, { type: 'TODAY' })` to immediately halt new tokens.
   - **Scheduled Absence Manager**: Date-range picker for future vacation dates (`isDoctorOnLeave`) and leave cancellation.

4. **Doctor Profile & Affiliations (`src/app/(doctor)/profile.tsx` & `/doctor/profile`)**:
   - **Cloudflare R2 Avatar Upload**: Integrated with `expo-image-picker` with compression quality (`quality: 0.8`) and direct multipart upload to `api.uploadAvatar`.
   - **Clinic Affiliations Management**: Lists active affiliated clinics and handles incoming clinic requests with one-tap `Accept` and `Reject` actions (`api.respondToClinicAffiliation`).

5. **Automated Verification Suite (`scripts/verify-phase5.ts`)**:
   - 98 dedicated automated test assertions verifying BP bounds, inverted pressures, pulse ranges, temperature ranges, weight limits, expected return time math, queue partitioning, ascending token ordering, arrival check-in flags, shift consultation duration arithmetic, HIG weekday discs, leave range detection, and live Render backend doctor queries.

## Consequences
- Doctors have complete operational control over their cabin availability, eliminating waiting room uncertainty for patients.
- Clinical data entry is protected by strict physiological bounds, preventing erroneous medical records.
- Seamless multi-shift and multi-clinic support accommodates modern Indian polyclinic workflows.
- Zero-upfront payment policy and prescription handover are clearly communicated at encounter finish.
- Zero TypeScript errors (`npm run typecheck`) and 397/397 passing tests across all test suites ensure rock-solid production stability.
