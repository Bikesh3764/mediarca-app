import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { api, getLocalDateString } from '@/services/api';
import { ENV } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { AppBadge } from '@/components/ui/AppBadge';

interface HealthTelemetry {
  apiStatus: 'ONLINE' | 'OFFLINE' | 'CHECKING';
  database: string;
  redis: string;
  latencyMs: number;
  lastChecked: string;
  doctorCount: number | null;
  clinicCount: number | null;
  errorMessage?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, role, logout } = useAuth();
  const [telemetry, setTelemetry] = useState<HealthTelemetry>({
    apiStatus: 'CHECKING',
    database: 'Checking...',
    redis: 'Checking...',
    latencyMs: 0,
    lastChecked: '--',
    doctorCount: null,
    clinicCount: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runHealthVerification = useCallback(async () => {
    setIsRefreshing(true);
    const startTime = Date.now();

    try {
      const healthData = await api.checkHealth();
      const latency = Date.now() - startTime;

      let doctorsTotal = 0;
      let clinicsTotal = 0;

      try {
        const doctors = await api.getDoctors();
        doctorsTotal = Array.isArray(doctors) ? doctors.length : 0;
      } catch {
        // Non-critical metric fetch
      }

      try {
        const clinics = await api.getPublicClinics();
        clinicsTotal = Array.isArray(clinics) ? clinics.length : 0;
      } catch {
        // Non-critical metric fetch
      }

      setTelemetry({
        apiStatus: 'ONLINE',
        database: healthData.database || 'connected',
        redis: healthData.redis || 'connected',
        latencyMs: latency,
        lastChecked: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        doctorCount: doctorsTotal,
        clinicCount: clinicsTotal,
      });
    } catch (err: any) {
      setTelemetry((prev) => ({
        ...prev,
        apiStatus: 'OFFLINE',
        database: 'unavailable',
        redis: 'unavailable',
        latencyMs: Date.now() - startTime,
        lastChecked: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        errorMessage: err?.message || 'Connection failed',
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    runHealthVerification();
  }, [runHealthVerification]);

  return (
    <SafeAreaViewContainer
      scrollable
      refreshing={isRefreshing}
      onRefresh={runHealthVerification}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="pulse" size={24} color={Colors.inkWhite} />
          </View>
          <View>
            <Text style={styles.brandTitle}>MediArca</Text>
            <Text style={styles.brandSubtitle}>Mobile Engine • Phase 1</Text>
          </View>
        </View>
        <StatusBadge
          status={
            telemetry.apiStatus === 'ONLINE'
              ? 'IN_CABIN'
              : telemetry.apiStatus === 'CHECKING'
              ? 'STEPPED_OUT'
              : 'NOT_IN_CABIN'
          }
          customLabel={telemetry.apiStatus}
        />
      </View>

      {/* Hero Status Card */}
      <View style={[styles.card, styles.heroCard]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>Live Production API</Text>
          <Text style={styles.cardHeaderPill}>{telemetry.latencyMs}ms</Text>
        </View>

        <Text style={styles.apiEndpointText} numberOfLines={1}>
          {ENV.API_BASE_URL}
        </Text>

        <View style={styles.divider} />

        {/* Telemetry Metrics */}
        <View style={styles.metricGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Database (Postgres)</Text>
            <View style={styles.metricValueRow}>
              <View
                style={[
                  styles.metricDot,
                  {
                    backgroundColor:
                      telemetry.database === 'connected'
                        ? Colors.success
                        : Colors.danger,
                  },
                ]}
              />
              <Text style={styles.metricValueText}>{telemetry.database}</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Redis Cache</Text>
            <View style={styles.metricValueRow}>
              <View
                style={[
                  styles.metricDot,
                  {
                    backgroundColor:
                      telemetry.redis === 'connected'
                        ? Colors.success
                        : Colors.danger,
                  },
                ]}
              />
              <Text style={styles.metricValueText}>{telemetry.redis}</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Active Doctors</Text>
            <Text style={styles.metricValueLarge}>
              {telemetry.doctorCount !== null ? telemetry.doctorCount : '--'}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Verified Clinics</Text>
            <Text style={styles.metricValueLarge}>
              {telemetry.clinicCount !== null ? telemetry.clinicCount : '--'}
            </Text>
          </View>
        </View>

        <Text style={styles.timestampFootnote}>
          Last verified: {telemetry.lastChecked} • Today (IST): {getLocalDateString()}
        </Text>
      </View>

      {/* Action CTA Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={runHealthVerification}
        disabled={isRefreshing}
        activeOpacity={0.85}
      >
        {isRefreshing ? (
          <ActivityIndicator color={Colors.inkWhite} size="small" />
        ) : (
          <>
            <Ionicons name="refresh" size={18} color={Colors.inkWhite} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Ping Live Backend</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Phase 2: Live Authentication Portal Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Auth & Session State</Text>
          {isAuthenticated && role ? (
            <AppBadge role={role} label={role} size="sm" />
          ) : (
            <AppBadge variant="neutral" label="Unauthenticated" size="sm" />
          )}
        </View>

        {isAuthenticated && user ? (
          <View style={styles.userProfileBlock}>
            <View style={styles.userProfileRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.userInfoCol}>
                <Text style={styles.userNameText}>{user.fullName}</Text>
                <Text style={styles.userSubText}>{user.email}</Text>
                {user.phone ? <Text style={styles.userPhoneText}>{user.phone}</Text> : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={async () => {
                await logout();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color={Colors.danger} />
              <Text style={styles.signOutButtonText}>Sign Out from Device</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.authActionBlock}>
            <Text style={styles.sectionSubtitle}>
              Hardware-backed SecureStore session management with multi-role support.
            </Text>

            <TouchableOpacity
              style={styles.signInPrimaryButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Ionicons name="key-outline" size={18} color={Colors.inkWhite} />
              <Text style={styles.signInPrimaryText}>Launch Authentication Portal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Phase 3: Patient Discovery & Booking Action Card */}
      {/* Phase 4: Live Queue Ticket & QR Check-In Action Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Live Queue Passes & Check-In</Text>
          <AppBadge variant="primary" label="Phase 4 Live" size="sm" />
        </View>
        <Text style={styles.sectionSubtitle}>
          Real-time queue ticket telemetry, adaptive polling (10s/15s/60s), one-tap receptionist calling, and native camera QR check-in.
        </Text>

        <TouchableOpacity
          style={styles.signInPrimaryButton}
          onPress={() => router.push('/passes')}
          activeOpacity={0.85}
        >
          <Ionicons name="ticket-outline" size={18} color={Colors.inkWhite} />
          <Text style={styles.signInPrimaryText}>View Active Queue Passes</Text>
        </TouchableOpacity>
      </View>

      {/* Phase 4 Deliverables Checklist Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Phase 4 Deliverables</Text>
        <Text style={styles.sectionSubtitle}>
          Live Queue Ticket, adaptive polling engine, receptionist phone dialer, and native camera QR standee scanner.
        </Text>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Live Queue Pass Screen (Active Passes vs Past Visits) with Pull-to-Refresh</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>LiveQueueTicket Card with Est. vs Confirmed Tokens & Doctor Cabin Sync</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>QueueTelemetryCard with Serving Token, Patients Ahead & formatWaitTime</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>ReceptionistCallCard with One-Tap Native Dialer (Linking.openURL)</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>CameraQrScannerModal with expo-camera, Laser Scan Line & Torch Toggle</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Adaptive Polling Engine (10s Front-of-Queue, 15s Shift, 60s Idle, 0s Background)</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>QR Payload Decoding (JSON, URLs, query params) & Haptic Vibration</Text>
        </View>
      </View>

      {/* Phase 3 Deliverables Checklist Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Phase 3 Deliverables</Text>
        <Text style={styles.sectionSubtitle}>
          Patient discovery, doctor profile, Apple HIG weekday discs, and step-by-step booking.
        </Text>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Debounced Doctor Search (Name, Specialty, Clinic, City)</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Horizontal Specialty Pill Carousel with 44pt Touch Targets</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>DoctorCard with Real-Time CabinBadge (In Cabin, Stepped Out)</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Doctor Detail Screen with 7-Day Apple HIG WeekdayDisplay Discs</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Multi-Step Booking Flow (Clinic, IST Date, Shift, Patient Info)</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Zero-Upfront Payment Policy & Estimated Token Confirmation</Text>
        </View>
      </View>

      {/* Phase 2 Verification Checklist Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Phase 2 Deliverables</Text>
        <Text style={styles.sectionSubtitle}>
          Secure authentication, session persistence, and Apple HIG auth screens.
        </Text>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>expo-secure-store Hardware Token Persistence</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>AuthContext with 5 Portal Roles & Cold Hydration</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Apple HIG Login Screen (+91 Mobile & Password Toggle)</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Role-Aware Signup Screen & Regulatory Terms</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>6-Digit Email OTP Screen with 60s Countdown</Text>
        </View>

        <View style={styles.checklistRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.checklistText}>Reusable AppCard, AppButton, AppInput, AppBadge, ScreenWrapper</Text>
        </View>
      </View>

      {/* Navigation Links */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/explore')}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryButtonText}>Open Doctor Discovery</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </SafeAreaViewContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
    marginTop: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  brandTitle: {
    ...Typography.title1,
    color: Colors.ink,
  },
  brandSubtitle: {
    ...Typography.caption,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    ...Shadows.card,
  },
  heroCard: {
    backgroundColor: Colors.canvas,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  cardHeaderTitle: {
    ...Typography.subheadline,
    color: Colors.inkMuted80,
    fontWeight: '600',
  },
  cardHeaderPill: {
    ...Typography.captionBold,
    backgroundColor: Colors.primaryLight,
    color: Colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  apiEndpointText: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.three,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.sm,
    padding: Spacing.three,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.inkMuted48,
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  metricValueText: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  metricValueLarge: {
    ...Typography.title1,
    color: Colors.ink,
  },
  timestampFootnote: {
    ...Typography.caption,
    color: Colors.inkMuted48,
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  primaryButton: {
    height: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
    ...Shadows.card,
  },
  buttonIcon: {
    marginRight: Spacing.two,
  },
  primaryButtonText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
  secondaryButton: {
    height: TouchTarget.minHeight,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.six,
  },
  secondaryButtonText: {
    ...Typography.bodyBold,
    color: Colors.primaryDark,
  },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.ink,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...Typography.subheadline,
    color: Colors.inkMuted48,
    marginBottom: Spacing.three,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: Spacing.two,
  },
  checklistText: {
    ...Typography.body,
    color: Colors.ink,
    fontSize: 14,
    flex: 1,
  },
  userProfileBlock: {
    marginTop: Spacing.two,
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  userAvatarText: {
    color: Colors.inkWhite,
    fontSize: 20,
    fontWeight: '700',
  },
  userInfoCol: {
    flex: 1,
  },
  userNameText: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  userSubText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    marginTop: 2,
  },
  userPhoneText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.pill,
    minHeight: TouchTarget.minHeight,
  },
  signOutButtonText: {
    ...Typography.captionBold,
    color: Colors.danger,
  },
  authActionBlock: {
    marginTop: Spacing.two,
  },
  signInPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
    ...Shadows.card,
  },
  signInPrimaryText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
});
