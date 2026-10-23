# MediArca Mobile App (Android & Google Play Store)

> **Official Mobile Application for MediArca Healthcare Platform**  
> Built with **React Native**, **Expo SDK 58**, **TypeScript**, and **Apple Human Interface Guidelines (Apple HIG)**.  
> Targeting the **Google Play Store** (Android 14/15, Target SDK 34+) and iOS App Store.

---

## 🌐 Live Production Infrastructure

The mobile app connects directly to the existing production backend and database:

- **Live Production API**: [https://mediarca-mdwk.onrender.com/api](https://mediarca-mdwk.onrender.com/api)
- **Backend Health Check**: [https://mediarca-mdwk.onrender.com/healthz](https://mediarca-mdwk.onrender.com/healthz)
- **Web App Reference**: [https://bikesh3764.github.io/MediArca/](https://bikesh3764.github.io/MediArca/)
- **Database**: Supabase Cloud PostgreSQL (`db.gibgtnzhecexgwximtpi.supabase.co`, Mumbai)
- **Asset Storage & CDN**: Cloudflare R2 (`https://pub-a590817d9f404eb889f6482b025ea9ad.r2.dev`)

---

## 📱 Key Features

1. **Live Queue Radar Pass (`My Passes`)**: Real-time token number, patients ahead, estimated consultation time, and arrival check-in status.
2. **One-Tap Receptionist Direct Dial**: Instant phone dialer (`Linking.openURL`) to coordinate UPI or desk payments without upfront payment friction.
3. **Hardware QR Camera Check-In**: 60fps native camera barcode scanner (`expo-camera`) to scan clinic reception standees upon arrival.
4. **Doctor Cabin Presence Indicator**: Real-time status badges (`In Cabin`, `Stepped Out` with return time, `Not In Cabin`).
5. **Multi-Role Adaptive Interface**: Role-aware interface adapting automatically for **Patients**, **Doctors**, **Receptionists**, and **Clinics**.
6. **Play Store Compliance**: In-app self-serve account deletion, strict permissions rationale (`CAMERA` and `VIBRATE` only), and zero upfront payment disclosure.

---

## 🎨 Design Philosophy (`MOBILE_DESIGN.md`)

- **Single Action Blue (`#0066cc`)**: Interactive touch points reserved for one primary action color.
- **Alternating Canvas Rhythm**: Clean separation between Parchment (`#f5f5f7`) and Pure White (`#ffffff`).
- **44x44pt Minimum Touch Target**: Strictly enforced across all buttons, inputs, and tab triggers to prevent touch fatigue.
- **Full Pill Action Buttons**: Tactile buttons (`borderRadius: 9999`) with subtle press feedback.

---

---

## 🚀 Quick Start & Browser Preview

### Prerequisites
- Node.js 18+ (tested with v24.15.0)
- npm 9+
- Modern Web Browser (Chrome / Edge / Firefox / Safari) OR **Expo Go** app on your physical Android/iOS phone.

### Installation
```bash
# Clone the repository
git clone https://github.com/Bikesh3764/mediarca-app.git
cd mediarca-app

# Install dependencies
npm install
```

### 1. Instant Browser Localhost Preview (Web)
Run the app locally in your desktop or mobile browser with zero simulator configuration:
```bash
npm run web
# Or explicitly: npx expo start --web
```
Open **[http://localhost:8081](http://localhost:8081)** to preview all 43 responsive screens (Patient, Doctor, Receptionist, Clinic Standees, and Admin Governance).

### 2. Physical Phone Testing with Expo Go
```bash
# Start Metro bundler with QR code in terminal
npm start
```
Scan the terminal QR code with **Expo Go** on Android (or Camera app on iOS) for live hot reloading.

---

## 📲 Free Standalone APK Build (No $25 Play Store Fee Required)

You do **NOT** need to pay the $25 Google Play Developer Console registration fee to install and test this app on real physical Android smartphones.

We have pre-configured EAS Cloud Build with the `preview` profile to produce standalone, signed `.apk` binaries that you can install directly via WhatsApp, Google Drive, or USB sideloading.

### Step-by-Step APK Generation:
```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Log in or create a free Expo account
eas login

# 3. Trigger free Cloud APK Build
eas build --platform android --profile preview
```
- Expo compiles the `.apk` on their cloud servers in ~8-12 minutes.
- You receive a direct `.apk` download link and QR code in your terminal.
- Share the `.apk` via WhatsApp or download directly on Samsung, Xiaomi, Vivo, Realme, OnePlus, or Pixel devices.

👉 **Full Step-by-Step Bilingual (English & Hindi) Sideloading Guide**: See [APK_INSTALL_GUIDE.md](file:///./APK_INSTALL_GUIDE.md).

---

## 🏛️ Phase 7 Features & Architecture

Phase 7 completes the entire production scope:
1. **Clinic Facility Portal & Receptionist Standees**: Facility profile management, doctor roster approvals, staff provisioning, and high-contrast printable Counter QR Standees (`/standee` and `/(clinic)/standee`) with native sharing.
2. **Admin Governance Portal (`/(admin)`)**: State Medical Council license verification queue for doctors, clinical establishment certificate verification, and real-time support ticket triage.
3. **Google Play User Data & NMC Compliance**: Self-serve patient account deletion (`/(patient)/profile`) with "DELETE" confirmation safeguards, zero upfront payment disclosure, and automatic alignment with the National Medical Commission (NMC) 3-year statutory clinical record retention regulation.
4. **Comprehensive Legal Suite (`/legal`)**: In-app About Us, Contact Us with live database messaging, Terms of Service, Privacy Policy, and Zero Cancellation Fee Refund Policy.

---

## 🧪 Comprehensive Verification Suite

Run our 7-phase automated verification test suite and strict TypeScript checking:

```bash
# Run all 596+ unit and invariant checks across Phases 1 through 7
npm run test:verify:all

# Individual phase test runs
npm run test:verify:phase1  # Theme, safeFetch, +91 phone sanitization
npm run test:verify:phase2  # Live Queue Radar & Token pass calculations
npm run test:verify:phase3  # Receptionist Queue desk check-in & dialer
npm run test:verify:phase4  # Doctor Cabin presence & multi-clinic shifts
npm run test:verify:phase5  # Hardware QR camera scanner & sound/haptics
npm run test:verify:phase6  # Push notifications, offline cache & performance
npm run test:verify:phase7  # Clinic standees, Admin queue & Play Store compliance

# Type check (ensures 0 errors)
npm run typecheck
```

---

## 📦 Production Google Play Store Release (.aab)

When ready to publish to Google Play Store production tracks:
```bash
eas build --platform android --profile production
```

---

## 📂 Project Architecture

```
mediarca-app/
├── assets/                     # App icons, splash screens, adaptive icons
├── dist/                       # Static web bundle export (43 routes)
├── src/
│   ├── app/                    # Expo Router file-based screens
│   │   ├── _layout.tsx         # Root application layout
│   │   ├── index.tsx           # Health Dashboard & Phase 7 Launchpad
│   │   ├── explore.tsx         # Component explorer
│   │   ├── profile.tsx         # Patient Profile & Account Deletion (Play Store compliant)
│   │   ├── standee.tsx         # Clinic Counter QR Standee
│   │   ├── (admin)/            # Admin Governance (Doctor licensure & Clinic verification)
│   │   ├── (clinic)/           # Clinic Portal & Receptionist Standees
│   │   ├── (patient)/          # Patient Portal & Telemetry
│   │   └── legal/              # About, Contact, Terms, Privacy, Refund policies
│   ├── components/
│   │   ├── common/             # SafeAreaViewContainer, Header, StatusBadge
│   │   └── ...
│   ├── constants/
│   │   ├── config.ts           # Endpoints, R2 URLs, storage keys
│   │   └── theme.ts            # Apple HIG tokens, colors, 44px touch targets
│   ├── services/
│   │   ├── adminClinicUtils.ts # Clinic, Admin & Deletion validation helpers
│   │   ├── api.ts              # 2,500+ lines of typed API calls & date math
│   │   └── safeFetch.ts        # Bounded 15s timeouts & idempotent retries
│   └── utils/
│       ├── indiaStates.ts      # 28 Indian States & 8 UTs
│       └── phoneUtils.ts       # +91 phone sanitization, validation, RFC 3966
├── APK_INSTALL_GUIDE.md        # Complete guide to installing free APK without $25 fee
├── ARCHITECTURE.md             # System topology and integration guide
├── MOBILE_DESIGN.md            # Design system tokens and Apple HIG specs
├── PROJECT.md                  # Implementation phase status tracker
├── IMPLEMENTATION.md           # Technical blueprint and phase scope
├── AGENTS.md                   # Agent guidelines and code standards
├── eas.json                    # Free preview APK & production AAB build config
├── metro.config.js             # Standard Expo Metro bundler config
├── app.json                    # Expo and Android application manifest
└── package.json                # Dependencies and build scripts
```

---

## 📄 Documentation Index

- [Free APK Installation Guide](file:///./APK_INSTALL_GUIDE.md)
- [Product Specification](file:///./MediArca_Feature_Specification.md)
- [Architecture Blueprint](file:///./ARCHITECTURE.md) & [Detailed Architecture](file:///./docs/architecture.md)
- [Mobile Design System (Apple HIG)](file:///./MOBILE_DESIGN.md)
- [Project Status & Roadmap Tracker](file:///./PROJECT.md)
- [Technical Implementation](file:///./IMPLEMENTATION.md)
- [Agent Workflow Guide](file:///./AGENTS.md)
- [Known Issues & Anti-Patterns](file:///./docs/known-issues.md)
- [Active Sprint Tracker](file:///./docs/tasks/current-task.md)
- [Architecture Decision Records (ADRs)](file:///./docs/decisions/011-clinic-admin-governance-and-play-store-compliance.md)


