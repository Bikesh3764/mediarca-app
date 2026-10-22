# MediArca Mobile App: Project Implementation Plan & Status Tracker

This tracker documents the phased development of the MediArca native mobile application for Android (Google Play Store) and iOS.

---

## 1. High-Level Implementation Phases

| Phase | Description | Deliverables | Status |
| :---: | :--- | :--- | :---: |
| **Phase 1** | **Project Scaffold, Design System & Core Service Layer** | Expo SDK 58 setup, TypeScript config, Apple HIG theme tokens (`constants/theme.ts`), API service layer (`services/api.ts`, `safeFetch.ts`), IST date math utilities, Safe Area Layout, Health Ping verification, Git & GitHub repository creation. | **COMPLETED** |
| **Phase 2** | **Multi-Role Authentication & Secure Storage** | Hardware-backed `expo-secure-store`, multi-role login (Patient, Doctor, Receptionist, Clinic), `+91` phone field, 6-digit email OTP screen, Google Sign-In setup. | Queued |
| **Phase 3** | **Patient Discovery, Doctor Profiles & Step Booking Flow** | Specialty carousel, debounced search, live cabin presence badges (`IN_CABIN`, `STEPPED_OUT`, `NOT_IN_CABIN`), weekly practice discs (`M T W T F S S`), step-by-step booking sheet, zero upfront fee disclosure. | Queued |
| **Phase 4** | **Live Queue Pass, Receptionist Direct Dial & QR Check-In** | Live Queue Pass card, dynamic queue polling (10s/15s/60s), one-tap receptionist phone dialer (`Linking.openURL`), native 60fps camera QR scanner (`expo-camera`), haptic vibration (`expo-haptics`). | Queued |
| **Phase 5** | **Doctor Console, Live OPD Queue & Consultation Room** | Doctor live queue screen, sticky cabin presence toggle with return time modal, consultation room with vitals entry (BP, Pulse, Temp, Weight), shift and leave management. | Queued |
| **Phase 6** | **Receptionist Multi-Doctor Desk & Walk-In Dispenser** | Multi-doctor queue dashboard, online appointment approvals (`PENDING_APPROVAL` → `WAITING`), walk-in token dispenser form, counter ticket scanner. | Queued |
| **Phase 7** | **Clinic/Admin Portals, Play Store Assets & EAS Build** | Clinic management, QR standee generator/export, legal compliance pages (Privacy Policy, Terms), self-serve account deletion, EAS cloud build configuration (`eas.json`), production `.aab` generation. | Queued |

---

## 2. Detailed Task Breakdown: Phase 1

- [x] **Project Scaffolding**:
  - [x] Create React Native Expo SDK 58 project with TypeScript in `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca-App`.
  - [x] Configure Expo Router v58 file-based routing.
  - [x] Configure `react-native-safe-area-context` and `@expo/vector-icons`.
  - [x] Configure Android package naming (`com.mediarca.app`) in `app.json`.
- [x] **Theme & Design System**:
  - [x] Create `src/constants/theme.ts` with Action Blue (`#0066cc`), parchment canvas (`#f5f5f7`), ink (`#1d1d1f`), and 44x44pt touch targets.
  - [x] Create `MOBILE_DESIGN.md` establishing color tokens, typography scales, and accessibility targets.
- [x] **Service Layer & Business Logic**:
  - [x] Port `safeFetch.ts` with bounded 15s timeouts and idempotent retry policy.
  - [x] Port `api.ts` with 2,500+ lines of TypeScript models, clinic slots calculation, and live backend connection (`https://mediarca-mdwk.onrender.com/api`).
  - [x] Port IST (Asia/Kolkata) date/time arithmetic helpers and India state lists.
  - [x] Implement backend health check ping test.
- [x] **Base Layout & Verification UI**:
  - [x] Implement `SafeAreaViewContainer` and navigation header wrappers.
  - [x] Implement live health ping verification screen.
- [x] **Documentation & Repository**:
  - [x] Create `README.md`, `MOBILE_DESIGN.md`, `ARCHITECTURE.md`, `PROJECT.md`, `IMPLEMENTATION.md`, and `AGENTS.md`.
  - [x] Initialize Git repository, create GitHub repository `mediarca-app`, and push initial commit.
