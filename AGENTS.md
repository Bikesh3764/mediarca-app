# MediArca Mobile App: AI Agent Guidelines (AGENTS.md)

This repository contains the native mobile application for the **MediArca Healthcare Platform**, built with Expo SDK 58, Expo Router, TypeScript, and Apple Human Interface Guidelines (`MOBILE_DESIGN.md`).

---

## 1. Core Platform Guidelines

1. **Live Production API**:
   - URL: `https://mediarca-mdwk.onrender.com/api`
   - Health check: `https://mediarca-mdwk.onrender.com/healthz`
   - All network calls must pass through `src/services/api.ts` and `src/services/safeFetch.ts`.
   - Never hardcode alternative localhost URLs in production screens.

2. **Mutation Idempotency Safety**:
   - `safeFetch` strictly enforces ZERO automatic retries for mutations (`POST`, `PUT`, `PATCH`, `DELETE`).
   - Retries with exponential backoff and jitter are ONLY permitted on idempotent `GET` and `HEAD` operations on transient 502/503/504 status codes.

3. **Timezone Rule (IST Asia/Kolkata)**:
   - All clinic shift schedules, token estimates, and doctor presence calculations operate in Indian Standard Time (`Asia/Kolkata`, UTC +05:30).
   - Use `getLocalDateString()` and `getIndianTimeMinutes()` from `src/services/api.ts` rather than native device local dates.

4. **Apple HIG Design System (`MOBILE_DESIGN.md`)**:
   - Action Blue (`#0066cc`) is reserved exclusively for interactive elements.
   - Parchment canvas (`#f5f5f7`) and pure white (`#ffffff`) alternating rhythm.
   - Strictly 44x44pt minimum touch targets (`TouchTarget.minSize`).
   - Full pill buttons (`BorderRadius.pill`).

5. **Navigation Architecture**:
   - Use file-based routing in `src/app/`.
   - Never put business logic or heavy state machines inside `src/app/` files; keep logic inside `src/services/`, `src/context/`, and `src/components/`.

---

## 2. Essential CLI Commands

```bash
# Verify TypeScript without emitting JS
npx tsc --noEmit

# Install Expo-compatible dependencies (resolves matching SDK versions)
npx expo install <package>

# Start Metro bundler with interactive QR code
npm start

# Run on Android emulator / device
npm run android

# Cloud build for Google Play Store (.aab)
npx eas-cli@latest build --platform android --profile production
```

Always run `npx tsc --noEmit` before finishing any task to guarantee zero type errors.
