# MediArca Mobile App: Architectural Blueprint & System Topology

**Document Version:** 1.0.0  
**Target Platform:** Android (Google Play Store) & iOS (Apple App Store)  
**Primary Framework:** React Native with Expo SDK 58, Expo Router, TypeScript  
**Live Production API:** `https://mediarca-mdwk.onrender.com/api`  
**Database Host:** Supabase Cloud PostgreSQL (Mumbai AP-South)  
**CDN & Storage:** Cloudflare R2 (`https://pub-a590817d9f404eb889f6482b025ea9ad.r2.dev`)  

---

## 1. Architectural Topology

```
+-------------------------------------------------------------+
|                 MediArca Mobile Application                 |
|             (React Native / Expo SDK 58 / TypeScript)        |
+-------------------------------------------------------------+
                               |
                      HTTPS REST Endpoints
                    (safeFetch with Retries)
                               |
                               v
+-------------------------------------------------------------+
|               MediArca Production Backend API               |
|            https://mediarca-mdwk.onrender.com/api           |
|            (Express 5, Node.js, Prisma ORM 6)               |
+-------------------------------------------------------------+
                               |
               +---------------+---------------+
               |                               |
               v                               v
+---------------------------+   +---------------------------+
|  Supabase PostgreSQL DB   |   |   Cloudflare R2 Bucket    |
| (Mumbai, India AP-South)  |   |  Doctor Avatars & Clinic  |
|   11 Core Prisma Models   |   |  https://pub-a59081...    |
+---------------------------+   +---------------------------+
```

---

## 2. Layered Mobile Architecture

### Layer 1: Core Configuration & Design Tokens (`src/constants/`)
- `config.ts`: Centralizes production URLs (`ENV.API_BASE_URL`), CDN URLs (`ENV.R2_PUBLIC_URL`), and SecureStore cache keys (`mediarca_token`, `mediarca_user`).
- `theme.ts`: Implements Apple Human Interface Guidelines tokens:
  - Single Action Blue (`#0066cc`) for user intent and interactive touchpoints.
  - Alternating Parchment Canvas (`#f5f5f7`) and Pure White (`#ffffff`).
  - 44x44pt minimum touch target rule (`TouchTarget.minSize`).
  - High-contrast typography ink (`#1d1d1f`).

### Layer 2: Network & Idempotency Engine (`src/services/`)
- `safeFetch.ts`:
  - Enforces bounded 15-second timeouts (`DEFAULT_REQUEST_TIMEOUT_MS = 15000`) to prevent infinite loading spinners on unstable mobile connections.
  - Transparent retries with exponential backoff and jitter strictly restricted to idempotent read operations (`GET`, `HEAD`) encountering transient 502/503/504 status codes.
  - **Zero automatic retries for mutations (`POST`, `PUT`, `PATCH`, `DELETE`)** to prevent duplicate appointment creation, payment confirmation, or token dispensing.
- `api.ts`:
  - Full TypeScript models for all 11 Prisma database entities.
  - Slot duration and capacity math (`avgConsultationMinutes = durationInMinutes / maxPatients`).
  - IST date arithmetic and Indian phone sanitization.
  - Health check verification telemetry endpoints (`checkHealth()`, `checkApiHealth()`).

### Layer 3: Presentation & Safe Area Components (`src/components/common/`)
- `SafeAreaViewContainer.tsx`: Handles safe notches, status bars, and home indicator gestures across iOS and Android.
- `Header.tsx`: Apple HIG header with 44px back touch targets.
- `StatusBadge.tsx`: Semantic status pills for cabin presence (`IN_CABIN`, `STEPPED_OUT`, `NOT_IN_CABIN`) and appointment states.

### Layer 4: State & Session Management (`src/context/`)
- Hardware-backed token persistence via `expo-secure-store`.
- Multi-role session management with per-portal authentication scoping.

---

## 3. Google Play Store Compliance Invariants

1. **Target SDK 34+ (Android 14/15)**: Configured in `app.json` for Android modern permissions and edge-to-edge support.
2. **Minimal Permissions Rationale**: Only `android.permission.CAMERA` (QR standee scan only) and `android.permission.VIBRATE` (haptic tactile feedback).
3. **Zero Upfront Payment Disclosure**: Clear messaging that medical consultation fees are settled directly at clinic front desks, ensuring full compliance with Google Play digital billing policies.
4. **Self-Serve Account Deletion**: Dedicated in-app account deletion CTA calling `api.deleteAccount()` to wipe user profile and clinical history.
