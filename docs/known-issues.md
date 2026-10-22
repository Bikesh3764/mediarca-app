# MediArca Mobile: Known Issues, Edge Cases & Engineering Lessons

## 1. Active Mobile Edge Cases & Mitigations

### 1.1 Render Backend Cold-Start Spinup
- **Edge Case**: The production backend hosted on Render spins down when idle on free/starter tiers. Cold starts may take 30–50 seconds.
- **Mitigation**:
  - `src/app/index.tsx` implements a live warmup and health verification dashboard on startup.
  - `src/services/safeFetch.ts` uses bounded 15s timeouts for regular requests and offers clear retry actions rather than hanging indefinitely.

### 1.2 Unstable Cellular Network During Appointment Booking
- **Edge Case**: Mobile devices frequently experience brief signal dropouts (switching between 5G, 4G, and Wi-Fi) while creating an appointment or confirming payment.
- **Mitigation**:
  - `safeFetch` strictly enforces **ZERO automatic retries for mutations (`POST`, `PUT`, `PATCH`, `DELETE`)**.
  - If a POST request drops before the server response is received, automatic retries could produce duplicate appointments or tokens. Instead, the application raises `ApiTimeoutError`, allowing the UI to present an explicit confirmation prompt.

### 1.3 Midnight IST Calendar Day Crossover
- **Edge Case**: In Indian OPDs, late evening shifts may extend past 11:30 PM. At 12:00 AM IST, the calendar date advances while the shift is still active.
- **Mitigation**:
  - Date evaluations throughout `api.ts` use `getLocalDateString()` and `getIndianTimeMinutes()` pinned to `Asia/Kolkata` (UTC +05:30) via `Intl.DateTimeFormat`.
  - Active consultation queues carry over during active shift windows.

### 1.4 Camera Permission Denials on Android
- **Edge Case**: Patient or receptionist denies camera access when opening the hardware QR scanner.
- **Mitigation**:
  - The camera viewfinder detects permission state and presents an Apple-styled recovery banner with a direct "Open Settings" link (`Linking.openSettings()`).

### 1.5 Dual-Role Accounts with Same Email
- **Edge Case**: A doctor or clinic staff member uses their email to book an appointment for themselves as a patient.
- **Mitigation**:
  - The backend enforces `@@unique([email, role])`.
  - The mobile authentication store scopes stored tokens to `[email, role]` pairs.

---

## 2. Engineering Lessons Learned & Anti-Patterns to Avoid

1. **Anti-Pattern: Automatic Retries on Mobile POST/PUT**
   - *Lesson*: Never auto-retry mutation endpoints on mobile networks. Retrying a `POST /appointments` on a timeout can double-book slots or create conflicting tokens.
2. **Anti-Pattern: Using Device Local Time for Clinical Schedules**
   - *Lesson*: If a patient travels abroad or has an incorrectly set device clock, native `new Date()` methods will evaluate slots and presence incorrectly. Always use `getLocalDateString()` and `getIndianTimeMinutes()` pinned to `Asia/Kolkata`.
3. **Anti-Pattern: Touch Targets Smaller than 44x44pt**
   - *Lesson*: Small 24px or 32px clickable areas cause significant user frustration and accidental taps on mobile touchscreens. Strictly enforce `TouchTarget.minSize = 44`.
4. **Anti-Pattern: Multiple Competing Accent Colors**
   - *Lesson*: Maintain visual discipline under Apple HIG (`MOBILE_DESIGN.md`). Reserve Action Blue (`#0066cc`) exclusively for interactive intent.
