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
| **Phase 4** | **Live Queue Pass, Receptionist Direct Dial & QR Check-In**: Live Queue Pass card, dynamic queue polling (10s/15s/60s), one-tap receptionist phone dialer (`Linking.openURL`), native 60fps camera QR scanner (`expo-camera`), haptic vibration (`expo-haptics`). | Phase 3 | Queued |
| **Phase 5** | **Doctor Console, Live OPD Queue & Consultation Room**: Doctor live queue screen, sticky cabin presence toggle with return time modal, consultation room with vitals entry (BP, Pulse, Temp, Weight), shift and leave management. | Phase 4 | Queued |
| **Phase 6** | **Receptionist Multi-Doctor Desk & Walk-In Dispenser**: Multi-doctor queue dashboard, online appointment approvals (`PENDING_APPROVAL` → `WAITING`), walk-in token dispenser form, counter ticket scanner. | Phase 5 | Queued |
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

## 7. Complete Documentation Index

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
