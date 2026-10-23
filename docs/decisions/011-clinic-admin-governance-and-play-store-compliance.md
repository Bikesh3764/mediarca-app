# ADR 011: Clinic Facility Administration, Medical Council Governance, and Play Store Statutory Compliance

## Status
**Accepted & Implemented** (Phase 7 Completed)

## Context
Phase 7 concludes the core release engineering for MediArca Mobile, delivering the final management, governance, compliance, and packaging layers required for clinical deployment and store distribution:
1. **Free Standalone Distribution**: The user cannot purchase a $25 Google Play Store Developer account at this time. The application must support free standalone distribution (`.apk`) via Expo Application Services (EAS) cloud builds and browser testing on `localhost:8081` via `react-native-web`.
2. **Clinic Management Portal**: Clinics require self-service facility profile management, photo/banner uploads, doctor roster management (approving incoming affiliation requests and sending doctor invitations), receptionist account provisioning, and counter QR standee generation.
3. **Medical Council & Establishment Governance**: Platform administrators must verify medical council licenses for practicing doctors (`VERIFIED`, `REJECTED`, `SUSPENDED`) and clinic establishment licenses, in addition to processing patient support inquiries (`ContactMessage`).
4. **Google Play User Data & In-App Account Deletion**: Google Play Developer Policies require apps with account creation to provide an in-app path for self-service account deletion. This must be balanced with the Indian National Medical Commission (NMC) Regulations and Medical Council of India (MCI) Code of Medical Ethics Regulation 1.3, which mandates a 3-year statutory retention period for patient consultation notes, diagnostic vitals, and prescriptions.
5. **Statutory Legal Compliance Suite**: Legal terms, privacy policy (including camera permission disclosure for QR check-ins and zero data selling pledge), refund policy (clarifying zero-upfront online payments and clinic counter billing), and contact/feedback forms.

## Decisions

### 1. Free Sideloading Architecture via EAS Preview Profile
- Configured `eas.json` with a dedicated `preview` profile specifying `"buildType": "apk"` under `android`.
- This enables compiling installable `.apk` packages on Expo's cloud builders without requiring local Android Studio/NDK installations or a $25 Google Play Console account.
- The `production` profile is configured with `"buildType": "app-bundle"` (`.aab`) with auto-incrementing version codes for future Play Store submission once the account is acquired.
- Configured web support via `@expo/metro-runtime` and `react-native-web` with `"bundler": "metro"` in `app.json` so developers can run `npm run web` / `npx expo start --web` on `http://localhost:8081`.

### 2. Clinic Roster & Front Desk Staff State Machine
- Created `src/app/(clinic)/index.tsx` implementing:
  - Facility Profile with photo upload via `expo-image-picker` and `api.uploadAvatar`.
  - Doctor Roster Management with affiliation status handling (`ACCEPTED`, `PENDING`), invitation dispatch (`api.addDoctorToClinic`), response handling (`api.respondToDoctorAffiliation`), and roster detachment (`api.removeDoctorFromClinic`).
  - Desk Staff Provisioning (`api.addClinicReceptionist`) generating credentialed accounts with temporary password enforcement and deactivation controls (`api.removeClinicReceptionist`).
  - Quick CTA to launch the Counter QR Standee Screen (`src/app/(clinic)/standee.tsx`).

### 3. High-Resolution Clinic QR Standee Screen
- Created `src/app/(clinic)/standee.tsx` rendering an Apple HIG-styled counter standee with:
  - High-res QR code generated from standard JSON payload (`clinicId`, `clinicName`, `code`).
  - Clinic details (Name, Address, Phone, Standee Code).
  - Clear patient instruction steps (Open MediArca, Tap Camera Scan on active pass, Instant arrival recorded).
  - Native Share / Print button utilizing React Native's `Share.share` API for counter printing.

### 4. Admin Governance & Licensure Verification Console
- Created `src/app/(admin)/index.tsx` providing:
  - Doctor Licensure Verification Queue: Status filter (`ALL`, `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`) and atomic verification state transitions via `api.verifyDoctor`.
  - Clinic Establishment Verification Queue: Validating registered clinic venues via `api.verifyClinic`.
  - Support & Inquiries Queue: Listing contact messages submitted by users, marking as read (`api.markContactMessageRead`), and deleting inquiries (`api.deleteContactMessage`).

### 5. Google Play In-App Account Deletion & NMC Statutory Balance
- Implemented `src/app/(patient)/profile.tsx` featuring:
  - Health Profile: Blood group, date of birth, gender, emergency contact, and personal info.
  - Self-Serve Account Deletion Flow: Accessible under a high-visibility Danger Zone.
  - Double-Confirmation Safety: Requires typing the keyword `DELETE` in uppercase.
  - NMC & MCI Regulatory Disclosure: Informs the patient that authentication credentials, personal identifiers (email, phone, avatar), and device push tokens are purged immediately, while historical consultation records and prescriptions remain archived in an anonymized state for the mandatory 3-year statutory audit retention period under NMC regulations.

### 6. Statutory Legal Policy Disclosures
- Created dedicated legal routes:
  - `src/app/legal/terms.tsx`: Zero upfront payment model, token reservations, queue arrival rules, emergency disclaimers.
  - `src/app/legal/privacy.tsx`: Camera permission disclosure (QR check-in only), zero data monetization pledge, NMC retention disclosure, and in-app account deletion instructions.
  - `src/app/legal/refund.tsx`: Zero online charges, free cancellation, and clinic desk on-site fee collection.
  - `src/app/legal/about.tsx`: MediArca mission, core principles, and OPD queue pledge.
  - `src/app/legal/contact.tsx`: Feedback form validating inputs via `validateContactMessage` and submitting to `api.sendContactMessage`.

## Verification Metrics
- 96 automated assertions passing in `scripts/verify-phase7.ts`.
- 590 total assertions passing across Phases 1 through 7 in `npm run test:verify:all`.
- 0 TypeScript compiler errors under `npm run typecheck`.
- 43 static web routes successfully exported to `dist/` with Expo Metro Router.
