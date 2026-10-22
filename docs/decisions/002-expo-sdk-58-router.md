# ADR 002: Technology Stack Selection — React Native with Expo SDK 58 and Expo Router

## Status
Accepted

## Context
MediArca requires a native mobile application targeting the Google Play Store (Android) and Apple App Store (iOS). The codebase must directly reuse 2,500+ lines of domain logic, TypeScript data models, and date arithmetic from the web repository while remaining maintainable and easily compilable without complex local NDK setups on Windows.

## Decision
1. Adopt **React Native with Expo SDK 58** and **TypeScript strict mode**.
2. Adopt **Expo Router v58** for file-based routing in `src/app/`.
3. Adopt **EAS Cloud Build** (`eas.json`) to compile production `.aab` bundles in the cloud, completely bypassing local Android Studio NDK and path configuration issues.
4. Enable immediate physical device testing via the **Expo Go** application.

## Consequences
- 100% type safety and direct sharing of API data contracts with zero translation overhead.
- Fast iteration cycle with Expo Go and zero native compilation friction on developer machines.
