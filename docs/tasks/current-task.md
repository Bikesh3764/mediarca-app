# Current Task: Phase 7 — Clinic Management, Admin Governance, Free Standalone APK Build, and Play Store Statutory Compliance

**Target Directory:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca-App`  
**Reference Web App:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca`  
**Live Backend API:** `https://mediarca-mdwk.onrender.com/api`  
**Status:** COMPLETED (All 7 Phases Finished • 596/596 Assertions Passing)  

---

## 1. Objectives & Scope Completed

1. **Free Standalone Distribution & Testing (`eas.json` & Web Support)**:
   - Configured `eas.json` with `preview` profile generating standalone `.apk` for free device installation without paying $25 Google Play Developer fee.
   - Configured `production` profile with signed `.aab` (Android App Bundle) for future Play Store submission.
   - Configured web support via `react-native-web`, `react-dom`, `@expo/metro-runtime`, and Metro bundler, enabling local browser preview on `http://localhost:8081` (`npm run web`).
   - Successfully compiled 43 static web routes with zero bundle errors.

2. **Clinic Management Portal (`src/app/(clinic)/index.tsx` & `/standee`)**:
   - Facility profile view, details editing (`api.updateClinicProfile`), and facility photo upload using `expo-image-picker` and `api.uploadAvatar`.
   - Doctor roster management: Affiliated doctors list, incoming request approvals (`api.respondToDoctorAffiliation`), doctor invitations (`api.addDoctorToClinic`), and detachment (`api.removeDoctorFromClinic`).
   - Desk staff management: Receptionist account provisioning (`api.addClinicReceptionist`) and account deactivation (`api.removeClinicReceptionist`).
   - High-resolution counter QR Standee screen (`src/app/(clinic)/standee.tsx`) with native share/save button (`Share.share`) for counter printing.

3. **Admin Governance Portal (`src/app/(admin)/index.tsx`)**:
   - Doctor Medical Council licensure verification queue with status filtering (`ALL`, `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`) and status transitions (`api.verifyDoctor`).
   - Clinic establishment license verification queue with status filtering and transitions (`api.verifyClinic`).
   - Platform support messages & contact inquiries queue (`ContactMessage`) with mark-as-read (`api.markContactMessageRead`) and delete operations (`api.deleteContactMessage`).

4. **Patient Profile & Play Store Compliant Self-Serve Account Deletion (`src/app/(patient)/profile.tsx`)**:
   - Health profile details: Blood group, date of birth, gender, emergency contact, and personal info.
   - Save changes via `api.updateUserProfile`.
   - Danger Zone: In-app self-serve account deletion with double confirmation ("DELETE" uppercase check) calling `api.requestAccountDeletion`.
   - Explicit National Medical Commission (NMC) & MCI Regulation 1.3 statutory retention disclosures (3-year medical record retention for clinical notes & prescriptions vs immediate purging of auth tokens, emails, phones, notification credentials).

5. **Statutory Legal Compliance Suite (`src/app/legal/`)**:
   - `about.tsx`: MediArca mission, core principles, and OPD queue pledge.
   - `contact.tsx`: Feedback form with Indian mobile (+91) validation calling `api.sendContactMessage` / `submitContactMessage`.
   - `terms.tsx`: Terms of Service covering zero-upfront payment policy, token generation, counter payments, and emergency disclaimers.
   - `privacy.tsx`: Privacy policy covering camera access rationale (QR check-in only), zero data selling pledge, NMC retention disclosure, and in-app account deletion.
   - `refund.tsx`: Refund policy detailing zero upfront online payments, free cancellation, and clinic desk on-site fee collection.

6. **Documentation & Architecture Decision Records**:
   - Created `APK_INSTALL_GUIDE.md`: Comprehensive English & Hindi step-by-step instructions for generating the free `.apk` with EAS, sideloading on Samsung/Xiaomi/Vivo/Pixel phones, sharing via WhatsApp, and running web localhost on `http://localhost:8081`.
   - Created ADR `docs/decisions/011-clinic-admin-governance-and-play-store-compliance.md`.
   - Updated `PROJECT.md` and `README.md`.

7. **Automated Verification Suite (`scripts/verify-phase7.ts`)**:
   - 89 automated assertions passing covering EAS build profiles, app.json target SDK 34+, doctor/clinic verification state machines, contact message validation, clinic roster management, account deletion safety checks, legal page disclosures, Apple HIG design tokens, and live backend endpoint queries.
   - Cumulative automated tests across all 7 phases: **596/596 assertions passing (100%)**.
   - TypeScript verification: `npm run typecheck` passes with **0 errors**.
