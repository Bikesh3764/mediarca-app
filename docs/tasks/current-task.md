# Current Task: Phase 1 — Project Scaffolding, Mobile Design System & Core Service Layer

**Target Directory:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca-App`  
**Reference Web App:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca`  
**Live Backend API:** `https://mediarca-mdwk.onrender.com/api`  
**Status:** COMPLETED  

---

## 1. Objectives & Scope

Execute Phase 1 of the MediArca native mobile application for the Google Play Store and iOS App Store:

1. **Scaffold Expo & React Native Project**:
   - Initialize Expo SDK 58 project with TypeScript strict mode, Expo Router, `@expo/vector-icons`, and `react-native-safe-area-context`.
   - Configure Android package `com.mediarca.app`, version `1.0.0`, version code `1`, and permissions (`CAMERA`, `VIBRATE`).
2. **Apple HIG Design Tokens & Theme System**:
   - Implement `src/constants/theme.ts` adhering strictly to `MOBILE_DESIGN.md`: Action Blue (`#0066cc`), parchment canvas (`#f5f5f7`), ink (`#1d1d1f`), and 44x44pt touch targets (`TouchTarget.minSize`).
3. **Core API & Service Layer**:
   - Port `safeFetch.ts` with bounded 15s timeouts and strict 0-retry policy for mutations.
   - Port `api.ts` with 2,500+ lines of TypeScript models for 11 Prisma entities, clinic slot duration logic, and IST date/time utilities.
   - Port Indian geographic (`indiaStates.ts`) and telephone (`phoneUtils.ts`) utilities.
4. **Base Layout & Verification UI**:
   - Implement `SafeAreaViewContainer.tsx`, `Header.tsx`, and `StatusBadge.tsx`.
   - Build real-time live production health telemetry screen in `src/app/index.tsx`.
5. **Comprehensive Markdown Documentation**:
   - Create and maintain full repository documentation mirroring the web project: `README.md`, `MOBILE_DESIGN.md`, `ARCHITECTURE.md`, `PROJECT.md`, `IMPLEMENTATION.md`, `AGENTS.md`, `MediArca_Feature_Specification.md`, and `docs/` hierarchy (`architecture.md`, `known-issues.md`, `current-task.md`, and ADRs 001–005).
6. **Git & GitHub Remote Synchronization**:
   - Track repository under GitHub repo `mediarca-app` (`https://github.com/Bikesh3764/mediarca-app.git`).

---

## 2. Verification Checklist

- [x] TypeScript compilation: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- [x] Android Hermes JS bundle compilation: `npx expo export -p android` bundles 1,710 modules into production bytecode (`.hbc`) with 0 errors.
- [x] Automated test suite: `npm run test:verify` passes 100% of assertion checks.
- [x] Live Render backend `/healthz` ping returns `status: ok`, `database: connected`, `redis: connected`.
- [x] Live Render API `/api/health` returns `status: ok`.
- [x] Live Supabase doctor and clinic roster query returns active database records.
- [x] GitHub repository created and updated: `https://github.com/Bikesh3764/mediarca-app`.
