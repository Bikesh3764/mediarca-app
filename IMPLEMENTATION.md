# MediArca Mobile App: Technical Implementation Blueprint (IMPLEMENTATION.md)

**Document Version:** 1.0.0  
**Target Environment:** Android (Google Play Store) & iOS  
**Framework:** React Native with Expo SDK 58, Expo Router, TypeScript  
**Live Production API:** `https://mediarca-mdwk.onrender.com/api`  
**Database:** Supabase Cloud PostgreSQL (Mumbai AP-South)  

---

## 1. Executive Implementation Summary

The MediArca Mobile App translates the fullstack web platform into a high-performance native application adhering to Apple Human Interface Guidelines (`MOBILE_DESIGN.md`). It reuses the 2,500+ lines of domain logic in `services/api.ts` with zero backend changes.

### Key Milestones:
1. **Phase 1 (Completed)**: Scaffolding, Apple HIG theme tokens, TypeScript interfaces, `safeFetch` idempotent retry engine, live health verification screen, and full Markdown repository documentation.
2. **Phase 2**: Multi-role authentication with hardware-backed `expo-secure-store`, `+91` phone field, and 6-digit email OTP verification.
3. **Phase 3**: Patient doctor discovery carousel, live cabin indicators, weekly shift discs, and zero upfront payment booking.
4. **Phase 4**: Dynamic Live Queue Radar Pass, one-tap receptionist phone dialer, and 60fps hardware QR camera check-in (`expo-camera`).
5. **Phase 5**: Doctor OPD live queue console, cabin presence toggle modal, vitals recording room, and schedule manager.
6. **Phase 6**: Receptionist multi-doctor waiting queue, desk payment approval & sequential token dispenser.
7. **Phase 7**: Play Store compliance verification, EAS Cloud Build configuration, and signed production `.aab` generation.

---

## 2. Phase 1 Architecture Verification

### Layer 1: Configuration & Tokens (`src/constants/`)
- `config.ts`: Centralizes `ENV.API_BASE_URL` (`https://mediarca-mdwk.onrender.com/api`), `R2_PUBLIC_URL`, and SecureStore keys.
- `theme.ts`: Implements Action Blue (`#0066cc`), parchment canvas (`#f5f5f7`), ink (`#1d1d1f`), and 44x44pt touch targets (`TouchTarget.minSize`).

### Layer 2: Network & Idempotency (`src/services/`)
- `safeFetch.ts`: Enforces 15-second bounded timeouts and ensures mutations (`POST`, `PUT`, `PATCH`, `DELETE`) receive strictly 0 automatic retries.
- `api.ts`: Full typed client supporting 11 Prisma models, slot calculation, queue previews, IST time conversions, and telemetry health checks.

### Layer 3: Presentation & Safe Area (`src/components/common/`)
- `SafeAreaViewContainer.tsx`: Provides safe notch, status bar, and home gesture handling across iOS and Android.
- `Header.tsx`: Apple HIG header with 44px back touch target.
- `StatusBadge.tsx`: Semantic status pills for cabin presence and appointment states.

---

## 3. Google Play Store Policy Adherence

| Policy Requirement | Implementation in MediArca Mobile |
| :--- | :--- |
| **Target SDK 34+** | Configured in `app.json` for Android 14/15 compatibility. |
| **Zero Upfront Billing Disclosure** | Disclosed on booking and ticket passes that consultation fees are settled directly at clinic front desks via cash or UPI. |
| **Self-Serve Account Deletion** | Wired to `api.deleteAccount()` in Patient Profile to purge account credentials and clinical records. |
| **Minimal Permissions** | Strict rationale for `CAMERA` (QR standee scan only) and `VIBRATE` (tactile haptic scan feedback). |
