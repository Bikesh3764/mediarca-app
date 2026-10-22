# ADR 006: Hardware-Backed SecureStore Session Management & Multi-Role Auth Architecture

## Status
Accepted

## Context
MediArca manages sensitive healthcare data for Patients, Doctors, Receptionists, and Clinic Administrators. On mobile devices, storing JWT authentication tokens and cached user profiles in unencrypted `AsyncStorage` or plain file storage presents severe security and compliance vulnerabilities under healthcare data protection standards (NDHM/ABDM) and Google Play Store security policies.

Furthermore, on cold start, the app needs instantaneous session hydration to avoid jarring visual jumps or unauthorized screen flashes, while handling transient network outages without prematurely logging users out.

## Decision
1. **Hardware-Backed Cryptographic Storage (`expo-secure-store`)**:
   - Utilize `expo-secure-store` with Android KeyStore and iOS Keychain encryption (`SecureStore.AFTER_FIRST_UNLOCK`).
   - Store bearer JWT token (`mediarca_token`), cached user profile (`mediarca_user`), and active role (`mediarca_role`).
2. **Defensive Web & SSR Fallback**:
   - Implement `checkSecureStoreAvailable()` to gracefully fall back to web `localStorage` or memory store when running on web, unit test, or Node.js environments.
3. **Resilient Session Hydration**:
   - Optimistically hydrate user state from cached SecureStore profile on app launch so UI is rendered immediately without blocking spinners.
   - Concurrently verify session via live `api.getMe()`.
   - Strictly invalidate session ONLY upon explicit HTTP 401 Unauthorized errors from the backend. Transient network drops or 5xx gateway errors preserve the cached session.
4. **Corrupted JSON Recovery**:
   - Wrap all JSON deserialization in try/catch blocks; if corrupted data is detected, purge the key and gracefully reset session state without crashing the host application.

## Consequences
- Total protection of JWT tokens against root/jailbreak memory dumping.
- Zero flicker cold start user experience.
- Full compliance with Google Play Store data safety and Android Keystore standards.
