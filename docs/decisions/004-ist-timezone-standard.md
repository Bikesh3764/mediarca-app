# ADR 004: Indian Standard Time (IST / Asia/Kolkata) Healthcare Date Standard

## Status
Accepted

## Context
Indian healthcare clinics, OPD schedules, doctor shift windows, and token queues operate strictly within Indian Standard Time (IST, UTC +05:30). If a mobile app evaluates dates and shift boundaries using native device local time (`new Date().toLocaleDateString()`), users traveling outside India or users with incorrectly configured device clocks would see wrong doctor slot availability and invalid booking calendars.

## Decision
1. All appointment dates, clinic schedule windows, and token timestamps must be evaluated using IST helper functions in `src/services/api.ts`:
   - `getLocalDateString(d: Date = new Date())`: Formats date as `YYYY-MM-DD` pinned to `timeZone: 'Asia/Kolkata'`.
   - `getIndianTimeMinutes(d: Date = new Date())`: Returns minutes since midnight (0–1439) in IST.
2. Form date inputs and booking APIs must never pass raw device local ISO strings without converting to IST calendar dates.

## Consequences
- Guaranteed consistency of clinic shift schedules and doctor presence indicators regardless of the physical location or system timezone of the patient's device.
