# Current Task: Phase 4 — Live Queue Pass, Receptionist Direct Dial & Hardware Camera QR Check-In

**Target Directory:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca-App`  
**Reference Web App:** `c:\Users\Bikesh Ray\OneDrive\Desktop\MediArca`  
**Live Backend API:** `https://mediarca-mdwk.onrender.com/api`  
**Status:** COMPLETED  

---

## 1. Objectives & Scope

Execute Phase 4 of the MediArca native mobile application for the Google Play Store and iOS App Store:

1. **Live Queue Pass Screen (`src/app/(tabs)/passes.tsx` & `src/app/passes.tsx`)**:
   - Segmented tabs: `Active Passes` vs `Past Visits` with count badges and native `RefreshControl` pull-to-refresh.
   - Authentication guard gating access with Apple HIG "Sign In to View Passes" prompt and redirect to `/(auth)/login`.
   - Empty state guidance with direct CTA routing to Doctor Discovery (`/explore`).

2. **Apple HIG Live Ticket Card (`src/components/queue/LiveQueueTicket.tsx`)**:
   - Big bold live ticket card distinguishing official assigned tokens (`#X`) from pre-approval tokens (`#X (Estimated)`).
   - Doctor details with photo/monogram avatar, specialty, clinic venue, and real-time cabin presence badge (`CabinBadge`).
   - 3-tile Apple HIG metadata grid: Date (with `Today` badge), Shift window (cleaned via `cleanSlotName`), and Est. Time / Status (`formatWaitTime`).
   - Dependent patient details banner when `isForOther` is true.
   - Physical arrival check-in status card: "Checked In at Clinic" with active presence dot, or "Not Checked In" with "Scan Clinic QR" CTA.
   - Cancel / withdraw token action with alert confirmation.

3. **Queue Telemetry Engine (`src/components/queue/QueueTelemetryCard.tsx`)**:
   - Visual telemetry flow showing currently served token (`Serving: Queue #X`), patients ahead of user (`patientsAway`), and dynamic wait time via `formatWaitTime`.
   - Active consultation callout banner when patient's token is actively called or consultation is in progress.
   - Cabin status alerts when doctor stepped out (with estimated return time) or not in cabin.

4. **One-Tap Receptionist Direct Dialing (`src/components/queue/ReceptionistCallCard.tsx`)**:
   - Assigned clinic receptionist name and one-tap native telephone button (`Linking.openURL(toTelUri(receptionistPhone))`).
   - Clear disclosure explaining the Zero-Upfront Payment policy: patients can call the receptionist to pay via UPI over call or pay at the desk upon arrival to confirm their token.

5. **Adaptive Polling Engine (`src/services/queueUtils.ts` -> `calculatePollingInterval`)**:
   - 0ms (paused) when app is backgrounded (`AppState.currentState !== 'active'`) or zero active passes exist, eliminating unnecessary battery and network drain.
   - 10s (10,000ms) high-frequency polling when patient is near the front of the queue (`patientsAway <= 2`) during an active clinic shift.
   - 15s (15,000ms) standard foreground polling during an active clinic shift.
   - 60s (60,000ms) low-frequency polling when the shift has not started, has ended, or for future-dated tickets.

6. **Hardware Camera QR Check-In Modal (`src/components/queue/CameraQrScannerModal.tsx`)**:
   - Native 60fps camera viewfinder using `expo-camera` (`CameraView` with `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`).
   - Animated laser scan line (`Animated.loop`), flashlight/torch toggle (`enableTorch`), and close button.
   - Decodes QR payloads supporting JSON (`{"clinicId": "...", "checkinCode": "..."}`), URL parameters (`/clinic-checkin?clinicId=...&code=...`), and raw IDs via `parseQrPayload`.
   - Native tactile haptic feedback (`expo-haptics`) upon successful barcode detection.
   - Graceful permission degradation: UI with "Grant Permission" and "Open Settings" (`Linking.openSettings()`), with manual 6-character check-in code input fallback.

7. **Documentation & Architecture Decision Records**:
   - Created ADR `docs/decisions/008-live-queue-ticket-and-hardware-camera-checkin.md`.
   - Updated `PROJECT.md` and `docs/tasks/current-task.md`.

8. **Automated Verification Suite**:
   - Built `scripts/verify-phase4.ts` testing 87 assertions across adaptive polling calculations (10s/15s/60s/0s), boundary wait time formatting (preventing ~0 mins, ~60 mins, and ~1h 60m), QR payload decoding (JSON, URL paths, query parameters, URL-encoded strings, raw IDs), ticket state lifecycle, tokenDisplay normalization, clinic address presentation, doctor return time modal sync, telephone URI formatting, manual check-in code validation, Apple HIG design tokens, and live backend queue queries.
   - Total test assertions across all suites: 299/299 tests passing (100%).

---

## 2. Verification Checklist

- [x] TypeScript compilation: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- [x] Phase 1 Automated Suite: `npm run test:verify:phase1` passes 64/64 tests (100%).
- [x] Phase 2 Automated Suite: `npm run test:verify:phase2` passes 61/61 tests (100%).
- [x] Phase 3 Automated Suite: `npm run test:verify:phase3` passes 87/87 tests (100%).
- [x] Phase 4 Automated Suite: `npm run test:verify:phase4` passes 87/87 tests (100%).
- [x] All Tests Suite: `npm run test:verify:all` passes 299/299 assertions (100%).
- [x] Adaptive polling intervals verified: 10s (front of queue <= 2 or in consultation), 15s (active shift), 60s (idle/future), 0s (backgrounded).
- [x] QR payload parser verified: JSON (with id/clinicId), URLs (with query parameters and path segments), query parameters, URL-encoded strings, raw IDs.
- [x] One-tap receptionist phone dialer (`Linking.openURL(toTelUri)`) and Alert fallback verified.
- [x] Native hardware camera QR viewfinder (`expo-camera`), torch toggle, and tactile haptic vibration (`expo-haptics`) configured.
- [x] Manual check-in code fallback input with clinic ID prevalidation implemented for zero-friction arrival verification.
- [x] Doctor Cabin Presence sync with interactive Stepped Out Return Time modal verified.
- [x] Arrival Check-in Card with explicit "Arrived & Verified" badge verified.
- [x] Big bold ticket card with active status pulse indicator, clinic address, and `#X (Estimated)` formatting verified.
- [x] Apple HIG 44pt touch targets and full pill buttons verified.
- [x] Live Render backend `/appointments/queue-preview` queries operational.
