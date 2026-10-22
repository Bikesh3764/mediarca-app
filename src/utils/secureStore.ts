/**
 * SecureStore Hardware-Backed Session Persistence
 * Encapsulates expo-secure-store with fallback for Web, Node.js and headless environments.
 *
 * Keys:
 * - 'mediarca_token': Bearer JWT authentication token
 * - 'mediarca_user': Serialized JSON user profile payload
 * - 'mediarca_role': Active portal role (PATIENT, DOCTOR, RECEPTIONIST, CLINIC, ADMIN)
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const SECURE_STORAGE_KEYS = {
  TOKEN: 'mediarca_token',
  USER: 'mediarca_user',
  ROLE: 'mediarca_role',
} as const;

// In-memory fallback for testing / SSR / Node.js
const memoryStore = new Map<string, string>();

let isSecureStoreAvailableCache: boolean | null = null;

async function checkSecureStoreAvailable(): Promise<boolean> {
  if (isSecureStoreAvailableCache !== null) {
    return isSecureStoreAvailableCache;
  }
  if (Platform.OS === 'web') {
    isSecureStoreAvailableCache = false;
    return false;
  }
  try {
    if (typeof SecureStore.isAvailableAsync === 'function') {
      const available = await SecureStore.isAvailableAsync();
      isSecureStoreAvailableCache = available;
      return available;
    }
    isSecureStoreAvailableCache = false;
    return false;
  } catch {
    isSecureStoreAvailableCache = false;
    return false;
  }
}

/**
 * Persists a string securely using hardware-backed keystore on native devices,
 * with graceful fallback to localStorage on web and memory store in headless environments.
 */
export async function saveSecureItem(key: string, value: string): Promise<void> {
  try {
    const isAvailable = await checkSecureStoreAvailable();
    if (isAvailable) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
      return;
    }
  } catch (err) {
    console.warn(`[SecureStore] Failed to write key "${key}" to native secure store, falling back:`, err);
  }

  // Fallback: Web localStorage or memory store
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      // Quota exceeded or private browsing restriction
    }
  }

  memoryStore.set(key, value);
}

/**
 * Retrieves a persisted string from secure store or fallback.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    const isAvailable = await checkSecureStoreAvailable();
    if (isAvailable) {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
    }
  } catch (err) {
    console.warn(`[SecureStore] Failed to read key "${key}" from native secure store:`, err);
  }

  // Fallback: Web localStorage or memory store
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const localVal = window.localStorage.getItem(key);
      if (localVal !== null) return localVal;
    } catch {
      // Ignore
    }
  }

  return memoryStore.get(key) ?? null;
}

/**
 * Removes a key from secure store or fallback.
 */
export async function deleteSecureItem(key: string): Promise<void> {
  try {
    const isAvailable = await checkSecureStoreAvailable();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (err) {
    console.warn(`[SecureStore] Failed to delete key "${key}" from native secure store:`, err);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }

  memoryStore.delete(key);
}

// -------------------------------------------------------------
// Typed Domain Session Helpers
// -------------------------------------------------------------

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) {
    await saveSecureItem(SECURE_STORAGE_KEYS.TOKEN, token);
  } else {
    await deleteSecureItem(SECURE_STORAGE_KEYS.TOKEN);
  }
}

export async function getStoredToken(): Promise<string | null> {
  return await getSecureItem(SECURE_STORAGE_KEYS.TOKEN);
}

export async function setStoredUser(user: any | null): Promise<void> {
  if (user) {
    const serialized = JSON.stringify(user);
    await saveSecureItem(SECURE_STORAGE_KEYS.USER, serialized);
  } else {
    await deleteSecureItem(SECURE_STORAGE_KEYS.USER);
  }
}

export async function getStoredUser<T = any>(): Promise<T | null> {
  const raw = await getSecureItem(SECURE_STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error('[SecureStore] Failed to parse stored user JSON payload:', err);
    await deleteSecureItem(SECURE_STORAGE_KEYS.USER);
    return null;
  }
}

export async function setStoredRole(role: string | null): Promise<void> {
  if (role) {
    await saveSecureItem(SECURE_STORAGE_KEYS.ROLE, role);
  } else {
    await deleteSecureItem(SECURE_STORAGE_KEYS.ROLE);
  }
}

export async function getStoredRole(): Promise<string | null> {
  return await getSecureItem(SECURE_STORAGE_KEYS.ROLE);
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    deleteSecureItem(SECURE_STORAGE_KEYS.TOKEN),
    deleteSecureItem(SECURE_STORAGE_KEYS.USER),
    deleteSecureItem(SECURE_STORAGE_KEYS.ROLE),
  ]);
}
