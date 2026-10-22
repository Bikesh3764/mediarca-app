# ADR 008: Live Queue Ticket, Adaptive Polling Engine & Hardware Camera QR Check-In Architecture

## Status
Accepted

## Context
In Indian healthcare outpatient departments (OPDs), queue progression is inherently dynamic:
1. Patient arrival pace fluctuates, doctor consultation lengths vary per patient, and doctors occasionally step out of cabins to review diagnostic reports or handle emergencies.
2. If patients do not have live queue telemetry, clinic waiting areas suffer severe overcrowding, confusion about who is currently called into the cabin, and high missed-token rates.
3. Uncalibrated background or aggressive polling drains mobile battery life and overloads the Render/Supabase production infrastructure. Conversely, static polling leads to stale queue numbers when a patient is next in line.
4. Patients need physical arrival verification at the clinic counter to prevent false claims of attendance while retaining immediate telephone access to the receptionist to coordinate UPI payments or arrival delays.
5. Camera access on mobile devices requires robust permission handling, intuitive visual guidance (animated targeting viewfinder with torch toggle), and a manual check-in code fallback so users are never blocked if camera hardware is unavailable.

## Decision
1. **Live Queue Pass Screen (`src/app/(tabs)/passes.tsx` & `src/app/passes.tsx`)**:
   - Implemented segmented tabs: `Active Passes` vs `Past Visits` with count badges and native `RefreshControl` pull-to-refresh.
   - Enforced patient authentication gating with a clean Apple HIG sign-in card redirecting to `/(auth)/login`.
   - Empty state guidance with direct CTA routing to Doctor Discovery (`/explore`).

2. **Unified Apple HIG Live Ticket Card (`LiveQueueTicket`)**:
   - Features big bold token numbers clearly distinguishing between official assigned tokens (`#X`) and pre-approval tokens (`#X (Estimated)`).
   - Real-time Cabin Presence synchronization (`CabinBadge`) displaying `IN_CABIN` (Action Blue `#0066cc`), `STEPPED_OUT` (Amber `#f59e0b` with return time modal), or `NOT_IN_CABIN`.
   - 3-tile metadata grid displaying Date (with `Today` badge), Shift window (cleaned via `cleanSlotName`), and live status / wait time.
   - Integrated Arrival Status card: Shows "Checked In at Clinic" with active presence dot, or "Not Checked In" with one-tap "Scan Clinic QR" button.

3. **Queue Telemetry Engine (`QueueTelemetryCard`)**:
   - Visual telemetry flow showing currently served token (`Serving: Queue #X`), patients ahead of user (`patientsAway`), and dynamic wait time via `formatWaitTime`.
   - Dedicated active consultation callout when patient's token is actively called or consultation is in progress.

4. **One-Tap Receptionist Direct Dialing (`ReceptionistCallCard`)**:
   - Assigned clinic receptionist name and one-tap native telephone button (`Linking.openURL(toTelUri(receptionistPhone))`).
   - Clear disclosure explaining the Zero-Upfront Payment policy: patients can call the receptionist to pay via UPI over call or pay at the desk upon arrival to confirm their token.

5. **Adaptive Polling Engine (`calculatePollingInterval`)**:
   - Calculates interval dynamically based on AppState, shift activity, and queue proximity:
     - **0ms (paused)**: When app is backgrounded (`AppState.currentState !== 'active'`) or zero active passes exist, eliminating unnecessary battery and network drain.
     - **10s (10,000ms)**: High-frequency polling when patient is near the front of the queue (`patientsAway <= 2`) during an active clinic shift.
     - **15s (15,000ms)**: Standard foreground polling during an active clinic shift.
     - **60s (60,000ms)**: Low-frequency polling when the shift has not started, has ended, or for future-dated tickets.

6. **Hardware Camera QR Check-In Modal (`CameraQrScannerModal`)**:
   - Native 60fps camera viewfinder using `expo-camera` (`CameraView` with `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`).
   - Animated laser scan line (`Animated.loop`), flashlight/torch toggle (`enableTorch`), and close button.
   - Decodes QR payloads supporting JSON (`{"clinicId": "...", "checkinCode": "..."}`), URL parameters (`/clinic-checkin?clinicId=...&code=...`), and raw IDs.
   - Triggers native tactile haptic feedback (`expo-haptics`) upon successful barcode detection.
   - Graceful permission degradation: UI with "Grant Permission" and "Open Settings" (`Linking.openSettings()`), with a manual 6-character check-in code input fallback.

## Consequences
- Real-time queue transparency reduces waiting room anxiety and eliminates missed consultation calls.
- Battery-efficient and server-friendly network footprint with adaptive polling intervals and background pause.
- Flawless camera check-in workflow with haptic confirmation and manual code fallback for 100% arrival reliability.
- Direct phone coordination enables rapid UPI fee collection directly by clinic front-desk staff.
- Compliance with Google Play Store hardware camera permissions (`android.permission.CAMERA` and `android.permission.VIBRATE`).
