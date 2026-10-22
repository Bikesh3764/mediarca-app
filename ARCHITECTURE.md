# MediArca Mobile App: System Architecture & Integration Guide

The MediArca Mobile App is built for production deployment on the Google Play Store (and iOS App Store). It communicates with the existing live production backend and PostgreSQL database with zero server modifications.

---

## 1. System Topology

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
| (Mumbai, India AP-South)  |   |  Doctor Avatars & Presc.  |
|   11 Core Prisma Models   |   |  https://pub-a59081...    |
+---------------------------+   +---------------------------+
```

---

## 2. Directory & Component Layout

```
MediArca-App/
├── assets/                  # App icons, splash screens, adaptive icons
├── src/
│   ├── app/                 # Expo Router file-based screens
│   │   ├── (auth)/          # Authentication routes (login, register, otp)
│   │   ├── (patient)/       # Patient portal routes (tabs, booking, pass)
│   │   ├── (doctor)/        # Doctor console routes (queue, consult, schedule)
│   │   ├── (receptionist)/  # Receptionist desk routes (approvals, walk-in)
│   │   ├── _layout.tsx      # Root application layout with providers
│   │   └── index.tsx        # Entry router & backend warmup screen
│   ├── components/          # Reusable UI components
│   │   ├── common/          # SafeAreaViewContainer, Header, Buttons, Badges
│   │   ├── cards/           # DoctorCard, QueueTicketCard, ShiftSelector
│   │   └── modals/          # CabinStatusModal, LeavePickerModal, ZeroUpfrontModal
│   ├── constants/           # Design system tokens and theme definitions
│   │   ├── theme.ts         # Colors, typography, spacing, touch targets
│   │   └── config.ts        # API endpoints, Cloudflare R2 URLs, storage keys
│   ├── context/             # Global application state providers
│   │   ├── AuthContext.tsx  # Multi-role authentication & session manager
│   │   └── QueueContext.tsx # Live queue ticket & polling controller
│   ├── services/            # Production API layer
│   │   ├── api.ts           # 2,500+ lines of typed API calls & date helpers
│   │   ├── safeFetch.ts     # Bounded timeouts (15s) & idempotent retry engine
│   │   └── storage.ts       # SecureStore auth token wrapper
│   └── utils/               # Shared business logic and formatters
│       ├── dateUtils.ts     # IST (Asia/Kolkata) date/time calculations
│       ├── indiaStates.ts   # 36 Indian states & union territories
│       └── phoneUtils.ts    # +91 phone formatting and validation
├── ARCHITECTURE.md          # System architecture and backend wiring
├── MOBILE_DESIGN.md         # Apple HIG design tokens and touch metrics
├── PROJECT.md               # Implementation roadmap and status tracker
├── README.md                # Developer onboarding and run instructions
├── app.json                 # Expo and Android application manifest
└── package.json             # Dependencies and build scripts
```

---

## 3. Production Backend Integration

The mobile application connects directly to the live backend:
- **API Base URL**: `https://mediarca-mdwk.onrender.com/api`
- **Render Cold-Start Warmup**: `api.checkHealth()` queries `https://mediarca-mdwk.onrender.com/api/health` or `/healthz` on cold start with exponential backoff to handle Render free-tier idle spin-up.
- **Image URL Resolver**: `getFileUrl()` automatically converts `r2://` image references into public Cloudflare R2 CDN links (`https://pub-a590817d9f404eb889f6482b025ea9ad.r2.dev/...`).
- **IST Time Synchronization**: All slot generation and checking window evaluations utilize `Asia/Kolkata` timezone (UTC +05:30) independently of device local timezone.

---

## 4. Security & Compliance Architecture

1. **Encrypted Token Storage**: Auth tokens (`mediarca_token`) and user profiles (`mediarca_user`) are stored securely using `expo-secure-store` on native devices with hardware encryption (KeyStore on Android, Keychain on iOS), falling back gracefully in development.
2. **Idempotent Network Safety (`safeFetch`)**:
   - Strictly 0 automatic retries for mutations (`POST`, `PUT`, `PATCH`, `DELETE`) to avoid duplicate appointment bookings or billing calls.
   - Transparent retry with jitter on transient network drops (502, 503, 504) for read queries (`GET`).
   - 15-second bounded timeouts to prevent infinite UI freezes.
3. **Google Play Store Policy Compliance**:
   - **Target SDK 34+ (Android 14/15)** configured in `app.json`.
   - **Self-Serve In-App Account Deletion**: Dedicated endpoint (`api.deleteAccount()`) allowing users to permanently wipe their profile and medical history.
   - **Zero Upfront Payment Disclosure**: Compliant with Google Play billing policies since medical consultation fees are settled directly at the clinic desk via cash or UPI.
   - **Minimal Permissions**: Only `CAMERA` (for scanning clinic check-in QR standees) and `VIBRATE` (for haptic tactile feedback).
