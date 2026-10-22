# Current Task: Phase 2 — Multi-Role Authentication, Secure Storage & 6-Digit Email OTP

**Target Directory:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca-App`  
**Reference Web App:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca`  
**Live Backend API:** `https://mediarca-mdwk.onrender.com/api`  
**Status:** COMPLETED  

---

## 1. Objectives & Scope

Execute Phase 2 of the MediArca native mobile application for the Google Play Store and iOS App Store:

1. **Hardware-Backed Session Storage**:
   - Install and configure `expo-secure-store` with Android KeyStore and iOS Keychain encryption (`SecureStore.AFTER_FIRST_UNLOCK`).
   - Implement `src/utils/secureStore.ts` with web/mock fallbacks and corrupted payload auto-recovery.
2. **Multi-Role Authentication Engine (`AuthContext`)**:
   - Build `src/context/AuthContext.tsx` supporting 5 roles: `PATIENT`, `DOCTOR`, `RECEPTIONIST`, `CLINIC`, `ADMIN`.
   - Wired methods: `login(emailOrPhone, password, role)`, `signup(...)`, `verifyOtp(email, otp, role)`, `resendOtp(email, role)`, `logout()`, `refreshUser()`, `updateUser(...)`.
   - Optimistic session hydration on cold start with strict 401 token invalidation.
3. **Apple HIG Design System UI Components**:
   - `AppCard.tsx`: Alternating canvas surfaces with hairline borders and subtle Apple elevation.
   - `AppButton.tsx`: Full pill action buttons (`borderRadius: 9999`), 44pt minimum touch target, active tactile press state.
   - `AppInput.tsx`: 44pt touch target inputs with fixed `+91` Indian mobile badge, password visibility eye toggle, and validation callouts.
   - `AppBadge.tsx`: Semantic status and role-specific badges.
   - `ScreenWrapper.tsx`: Safe area insets, keyboard-avoiding views, and pull-to-refresh integration.
4. **Sleek Authentication Screens**:
   - `src/app/(auth)/login.tsx`: Role switcher tabs (`PATIENT`, `DOCTOR`, `RECEPTIONIST`, `CLINIC`), email / +91 mobile toggle, password input with eye toggle, error callout, and Google Sign-In button.
   - `src/app/(auth)/signup.tsx`: Role-aware fields (Doctor medical credentials, Clinic facility details, Patient biological gender), +91 mobile validation, and regulatory healthcare declarations.
   - `src/app/(auth)/verify-otp.tsx`: Auto-advancing 6-digit input boxes, 60-second countdown timer, resend button with cooldown handling, and verification calling `api.verifyEmailOtp`.
5. **Documentation & Architecture Decision Records**:
   - Created ADR `docs/decisions/006-secure-store-session-management.md`.
   - Updated `PROJECT.md` and `docs/tasks/current-task.md`.
6. **Automated Verification Suite**:
   - Built `scripts/verify-phase2.ts` testing 58 assertions across token serialization, corrupted JSON recovery, phone validation, OTP timer arithmetic, and live backend auth ping.

---

## 2. Verification Checklist

- [x] TypeScript compilation: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- [x] Phase 1 Automated Suite: `npm run test:verify:phase1` passes 64/64 tests (100%).
- [x] Phase 2 Automated Suite: `npm run test:verify:phase2` passes 58/58 tests (100%).
- [x] All Tests Suite: `npm run test:verify:all` passes 122/122 assertions (100%).
- [x] Live Render backend `/auth/login` rejects invalid credentials with 401 (guard active).
- [x] Live Render backend `/auth/register` rejects malformed inputs with 400 (validation active).
- [x] Live Render backend `/auth/verify-otp` active and operational.
- [x] Hardware SecureStore persistence validated with cold-start rehydration.
