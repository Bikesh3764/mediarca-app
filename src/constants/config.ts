/**
 * MediArca Mobile Configuration
 * Live Production API & CDN Endpoints
 */

export const ENV = {
  // Live Render Backend API
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    'https://mediarca-mdwk.onrender.com/api',

  // Cloudflare R2 Public Asset Storage CDN
  R2_PUBLIC_URL:
    process.env.EXPO_PUBLIC_R2_PUBLIC_URL ||
    'https://pub-a590817d9f404eb889f6482b025ea9ad.r2.dev',

  // Google OAuth Web Client ID
  GOOGLE_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    '',

  // Storage Keys for SecureStore
  STORAGE_KEYS: {
    AUTH_TOKEN: 'mediarca_token',
    USER_PROFILE: 'mediarca_user',
    OFFLINE_QUEUE_PASS: 'mediarca_cached_queue_pass',
  },
} as const;
