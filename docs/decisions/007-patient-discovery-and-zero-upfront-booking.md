# ADR 007: Patient Discovery & Zero-Upfront Token Booking Architecture

## Status
Accepted

## Context
In healthcare platforms operating across India, patients require rapid discovery of certified doctors by specialty, locality, clinic facility, and real-time cabin presence. Furthermore, patient appointment booking in Indian outpatient departments (OPDs) faces distinct operational realities:
1. Online upfront digital payment friction causes high abandonment rates when patients are uncertain if a doctor is physically present or on leave.
2. In-clinic payment workflows (UPI payment directly to the front desk or cash at reception) represent the overwhelming preference of outpatient clinics.
3. Google Play Store digital goods billing policies enforce that healthcare services rendered physically in clinics qualify for physical point-of-care payment models without in-app purchase tax levies.
4. Patients need transparent visibility into their estimated token queue number, doctor practice days, and direct telephone access to the clinic receptionist.

## Decision
1. **Multi-Field Instant Debounced Discovery Engine**:
   - Implemented `DoctorDiscoveryScreen` with a 250ms debounced search index matching simultaneously across doctor full name, medical specialty, clinic facility name, and geographic city/address.
   - Pinned an Apple HIG horizontal specialty pill carousel with 44pt touch targets for instant specialty filtering.
2. **Real-Time Doctor Cabin Presence Pill (`CabinBadge`)**:
   - Real-time visual indicator displaying three states: `IN_CABIN` (Action Blue `#0066cc`), `STEPPED_OUT` (Amber `#f59e0b` with dynamic return time estimation, e.g., `Back 15m`), and `NOT_IN_CABIN` (Neutral `#8e8e93`).
3. **Apple HIG 7-Day Circular Practice Discs (`WeekdayDisplay`)**:
   - Modeled weekly practice days as sleek circular letter discs (`M T W T F S S`), highlighting practicing days in solid black (`#1d1d1f`), off days in muted gray, and today's day with an Active Blue ring (`#0066cc`).
   - Integrated live IST date calculations (`getLocalDateString`, `getDayOfWeekCode`) to automatically indicate whether the doctor is practicing today or on leave.
4. **Step-by-Step Multi-Stage Booking Flow**:
   - Progressive disclosure covering: (1) Clinic selection for multi-facility doctors, (2) IST Date picker with non-practice days disabled, (3) Shift selection with live capacity metrics (`Available`, `Ended`, `Full`), (4) Patient details supporting Self-Booking vs. Family Member/Dependent with age validation (0–125), and (5) Consultation reason and symptoms.
5. **Enforced Zero-Upfront Payment Policy**:
   - Clear and prominent disclosure: *"No payment required now. An estimated token will be issued. Pay ₹XXX directly to the clinic receptionist via UPI or at the desk."*
   - Submits payload to live backend `api.bookAppointment` generating `PENDING_APPROVAL` with `estimatedQueueNumber`.
   - Post-booking confirmation screen reveals the estimated token number, clinic facility details, and a 44pt one-tap telephone dialer (`Linking.openURL('tel:...')`) to call the receptionist to confirm via UPI over call or pay upon arrival.

## Consequences
- Frictionless patient booking experience with zero upfront drop-off.
- Total compliance with Google Play Store physical healthcare service billing policies.
- Elimination of no-show confusion through receptionist telephone coordination and clear estimated queue tokens.
