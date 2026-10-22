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

## 🚀 Quick Start & Development

### Prerequisites
- Node.js 18+ (tested with v24.15.0)
- npm 9+
- **Expo Go** app installed on your physical Android or iOS device from Google Play or Apple App Store.

### Installation
```bash
# Clone the repository
git clone https://github.com/Bikesh3764/mediarca-app.git
cd mediarca-app

# Install dependencies
npm install
```

### Running with Expo Go
```bash
# Start Metro bundler with QR code in terminal
npm start

# Or start directly for Android
npm run android

# Or run in Web preview
npm run web
```
Scan the QR code displayed in the terminal using the **Expo Go** app on your Android phone to test live with instant fast refresh.

---

## 📦 Building for Google Play Store (EAS Cloud Build)

This project is pre-configured for **EAS Cloud Builds**, which compile production `.aab` bundles entirely in the cloud without requiring local Android Studio or NDK setup on Windows.

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Log in to your Expo account
eas login

# 3. Build installable APK for internal device testing
eas build --platform android --profile preview

# 4. Build signed Android App Bundle (.aab) for Google Play Store
eas build --platform android --profile production
```

---

## 📂 Project Architecture

```
mediarca-app/
├── assets/                     # App icons, splash screens, adaptive icons
├── src/
│   ├── app/                    # Expo Router file-based screens
│   │   ├── _layout.tsx         # Root application layout
│   │   ├── index.tsx           # Live Health & Telemetry dashboard
│   │   └── explore.tsx         # Component explorer
│   ├── components/
│   │   ├── common/             # SafeAreaViewContainer, Header, StatusBadge
│   │   └── ...
│   ├── constants/
│   │   ├── config.ts           # Endpoints, R2 URLs, storage keys
│   │   └── theme.ts            # Apple HIG tokens, colors, 44px touch targets
│   ├── services/
│   │   ├── api.ts              # 2,500+ lines of typed API calls & date math
│   │   └── safeFetch.ts        # Bounded 15s timeouts & idempotent retries
│   └── utils/
│       ├── indiaStates.ts      # 28 Indian States & 8 UTs
│       └── phoneUtils.ts       # +91 phone sanitization, validation, RFC 3966
├── ARCHITECTURE.md             # System topology and integration guide
├── MOBILE_DESIGN.md            # Design system tokens and Apple HIG specs
├── PROJECT.md                  # Implementation phase status tracker
├── IMPLEMENTATION.md           # Technical blueprint and phase scope
├── AGENTS.md                   # Agent guidelines and code standards
├── app.json                    # Expo and Android application manifest
└── package.json                # Dependencies and build scripts
```

---

## 📄 Documentation Index

- [Product Specification](file:///./MediArca_Feature_Specification.md)
- [Architecture Blueprint](file:///./ARCHITECTURE.md) & [Detailed Architecture](file:///./docs/architecture.md)
- [Mobile Design System (Apple HIG)](file:///./MOBILE_DESIGN.md)
- [Project Status & Roadmap Tracker](file:///./PROJECT.md)
- [Technical Implementation](file:///./IMPLEMENTATION.md)
- [Agent Workflow Guide](file:///./AGENTS.md)
- [Known Issues & Anti-Patterns](file:///./docs/known-issues.md)
- [Active Sprint Tracker](file:///./docs/tasks/current-task.md)
- [Architecture Decision Records (ADRs)](file:///./docs/decisions/001-apple-hig-design-system.md)

