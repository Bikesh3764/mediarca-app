# MediArca Mobile — Product & Feature Specification

## 1. Product Overview

**MediArca Mobile** is the native Android (Google Play Store) and iOS application for the MediArca Healthcare Platform. It provides a touch-optimized, high-performance in-clinic queue management and outpatient appointment booking system tailored specifically for Indian outpatient departments (OPDs), polyclinics, doctors, receptionists, and patients.

The mobile app operates directly against the live MediArca production API (`https://mediarca-mdwk.onrender.com/api`) and Supabase PostgreSQL database in Mumbai, India (`Asia/Kolkata` timezone), with zero intermediate mock servers or separate mobile backends.

### Core Architectural Philosophy

1. **Physical Clinic & Queue Focus**: Built exclusively for real-world physical clinic visits. Telemedicine, video consultations, and digital prescription builders are intentionally excluded to keep the application fast, responsive, and laser-focused on real-time clinic throughput.
2. **Zero-Upfront Payment Policy**: Patients book OPD appointments without paying upfront via digital payment gateways. Online bookings generate an estimated queue token (`PENDING_APPROVAL`). The patient coordinates payment directly with the clinic receptionist (either over the phone via UPI, or at the front desk upon arrival). The receptionist confirms payment and assigns the official live queue number (`WAITING`). This eliminates upfront payment friction and complies with Google Play digital billing policies.
3. **Role-Adaptive Interface**: A single unified mobile application adapts dynamically for **Patients**, **Doctors**, **Receptionists**, and **Clinics**, using secure hardware-backed token storage (`expo-secure-store`) and per-portal account scoping (`@@unique([email, role])`).
4. **Hardware QR Camera Check-In**: Native 60fps camera viewfinder (`expo-camera`) with tactile haptic feedback (`expo-haptics`) enables patients to scan clinic reception QR standees upon physical arrival, transitioning ticket state to *"Checked In at Clinic • Waiting Area"*.
5. **Strict Indian Healthcare Localization**:
   - Currency: Indian Rupee (`₹`) exclusively.
   - Telephone: Indian standard `+91` 10-digit mobile number validation and RFC 3966 `tel:` URI generation.
   - Timezone: Indian Standard Time (IST / `Asia/Kolkata`, UTC +05:30) evaluated across all clinic shift schedules, slot availability, and doctor presence calculations.

---

## 2. Platform Roles & Mobile Feature Scope

```
┌─────────────────────────────────────────────────────────────────┐
│                    MediArca Mobile Application                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
     ┌──────────────┬────────────┼─────────────┬─────────────┐
     ▼              ▼            ▼             ▼             ▼
  Patient         Doctor       Clinic     Receptionist     Admin
  Portal         Console       Portal         Desk        Center
```

### 2.1 Patient Portal

Designed following Apple Human Interface Guidelines (`MOBILE_DESIGN.md`) for an effortless, distraction-free clinic visit experience:

1. **Practitioner & Clinic Discovery**:
   - Debounced search across doctor name, medical specialty, clinic name, and city.
   - Doctor cards with live **Doctor Cabin Presence Badges** (`In Cabin`, `Stepped Out` with return time, `Not In Cabin`).
   - Weekly practice discs (`M T W T F S S`) displaying active consultation days.
   - Consultation fee displayed in Indian Rupees (`₹`).

2. **Step-by-Step Appointment Booking**:
   - Select clinic facility, consultation date, and practitioner shift window.
   - Book for self or family members/dependents (capturing dependent name, age, and gender).
   - Zero-upfront payment disclosure generating status `PENDING_APPROVAL` with estimated queue token `#X`.

3. **Live Queue Radar Pass (`My Passes`)**:
   - Active pass card with real-time token badge, patients ahead, and dynamic wait-time countdown.
   - **One-Tap "Call Receptionist" Action**: Direct telephone dialer (`Linking.openURL(toTelUri(phone))`) to coordinate UPI payment or confirm arrival.
   - **Hardware Camera QR Check-In**: Instant arrival confirmation upon scanning the front desk QR standee.
   - Real-time cabin status synchronization with doctor's active consultation room.

4. **Patient Profile & Account Management**:
   - Health profile: Blood group, emergency contacts, chronic conditions.
   - **Google Play In-App Self-Serve Account Deletion**: Dedicated endpoint (`api.deleteAccount()`) allowing users to permanently wipe their profile and medical records.

---

### 2.2 Doctor Console

Optimized for healthcare practitioners to conduct fast-paced OPD consultations without administrative friction:

1. **OPD Live Queue State Machine**:
   - Tabs: `Waiting` (arrived patients), `In Consultation` (currently in cabin), `Completed`.
   - Atomic `Call Patient` action: Enforces that exactly one patient is `IN_CONSULTATION` per practitioner across all facilities.
   - Patient hold & step-out controls: `Hold Consultation` returns patient safely to waiting queue.

2. **Sticky Cabin Presence Toggle**:
   - One-tap status switcher: `IN_CABIN`, `STEPPED_OUT` (with quick return time modal: 5m, 10m, 15m, 30m), `NOT_IN_CABIN`.
   - Propagates immediately to all patient queue tickets and search cards.

3. **Schedule & Absence Management**:
   - Weekly active days selector (`M T W T F S S`).
   - "Take Leave Today" instant emergency toggle.
   - Date-range scheduled leave manager blocking advance slot bookings.

---

### 2.3 Receptionist Desk

Counter interface for front-desk staff to manage multi-doctor patient queues:

1. **Multi-Doctor Waiting List**: Live view of all practicing doctors in the clinic with real-time patient arrival indicators.
2. **Payment Confirmation & Sequential Token Dispenser**:
   - One-tap `Approve Payment & Confirm Token`: Converts `PENDING_APPROVAL` into `WAITING` with official sequential queue number upon cash or UPI verification.
3. **Walk-In Token Creation**: Rapid counter registration for offline patients without smartphone access.
4. **Counter Camera Scanner**: Verify patient mobile ticket QR codes at the reception counter.

---

### 2.4 Clinic Profile & Facility Branding

1. Dedicated clinic profile management with dynamic facility avatar / exterior photo crop & Cloudflare R2 upload.
2. High-resolution counter QR Standee generator with download/print action.
3. Affiliated practitioner roster and receptionist access delegation.

---

## 3. Technical & Store Compliance Specifications

| Requirement | Implementation | Compliance Standard |
| :--- | :--- | :--- |
| **Operating System** | Android 14/15 (Target SDK 34+) & iOS 17+ | Google Play Store 2026 Policy |
| **Touch Ergonomics** | 44x44pt minimum touch target across all interactive elements | Apple HIG & Material 3 Touch Standards |
| **Primary Accent** | Action Blue `#0066cc` reserved exclusively for interactive elements | MediArca Design System (`MOBILE_DESIGN.md`) |
| **Network Engine** | `safeFetch` with 15s timeouts & 0 automatic retries on mutations | Mutation Idempotency Safety |
| **Permissions** | `CAMERA` (QR standee scan only) and `VIBRATE` (haptic tactile feedback) | Google Play Minimal Permissions Policy |
| **Build Pipeline** | EAS Cloud Build (`eas build --platform android --profile production`) | Google Play App Bundle (`.aab`) |
