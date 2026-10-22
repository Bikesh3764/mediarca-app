# ADR 003: Network Safety & Mutation Idempotency Policy (`safeFetch`)

## Status
Accepted

## Context
Mobile devices frequently drop cellular packets when switching between 5G, 4G, and Wi-Fi networks. An automatic retry on a failed mutation request (such as `POST /appointments` or `POST /tokens/call`) can cause duplicate appointments, phantom visits, or race conditions.

## Decision
1. In `src/services/safeFetch.ts`, enforce bounded 15-second timeouts (`DEFAULT_REQUEST_TIMEOUT_MS = 15000`) for standard requests and 30-second timeouts for uploads.
2. Restrict automatic retries with exponential backoff and jitter **strictly to idempotent read operations (`GET`, `HEAD`)** encountering transient 502, 503, or 504 reverse proxy responses.
3. Enforce **ZERO automatic retries for mutations (`POST`, `PUT`, `PATCH`, `DELETE`)**. If a mutation fails or times out, the client immediately throws `ApiTimeoutError`, leaving retry decisions to user-initiated actions.

## Consequences
- Guaranteed elimination of duplicate appointments and payment confirmations caused by silent background retries.
- Predictable and fast failover on unstable mobile network connections.
