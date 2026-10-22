import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api, Appointment, getLocalDateString } from '@/services/api';
import { calculatePollingInterval } from '@/services/queueUtils';
import { LiveQueueTicket } from '@/components/queue/LiveQueueTicket';
import { CameraQrScannerModal } from '@/components/queue/CameraQrScannerModal';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';

export default function PassesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAST'>('ACTIVE');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setIsRefreshing] = useState(false);

  // QR Camera Scanner Modal State
  const [scannerVisible, setScannerVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // AppState tracking for adaptive background pause
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const pollingTimerRef = useRef<any>(null);

  // Fetch appointments from live backend
  const fetchAppointments = useCallback(async (isBackground = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (!isBackground) {
      // Don't show full loading spinner on periodic background refresh
      // Only show spinner on initial load if appointments are empty
      if (appointments.length === 0) setLoading(true);
    }

    try {
      const data = await api.getPatientAppointments();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err: any) {
      console.warn('Failed to fetch patient appointments:', err?.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, appointments.length]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAppointments(false);
  }, [fetchAppointments]);

  // Initial load
  useEffect(() => {
    fetchAppointments(false);
  }, [isAuthenticated]);

  // AppState change listener (pauses polling when backgrounded)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const active = nextState === 'active';
      setIsAppActive(active);
      if (active) {
        // Immediately refresh when returning to foreground
        fetchAppointments(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchAppointments]);

  // Segregate Active vs Past passes
  const todayStr = getLocalDateString();

  const activePasses = appointments.filter((a) => {
    return (
      a.status === 'WAITING' ||
      a.status === 'PENDING_APPROVAL' ||
      a.status === 'IN_CONSULTATION'
    );
  });

  const pastPasses = appointments.filter((a) => {
    return (
      a.status === 'COMPLETED' ||
      a.status === 'CANCELLED' ||
      a.status === 'REJECTED' ||
      a.status === 'EXPIRED'
    );
  });

  // Adaptive Polling Engine
  useEffect(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }

    if (!isAuthenticated || activePasses.length === 0) {
      return;
    }

    // Determine nearest patientsAhead and if any shift is active
    let minPatientsAhead: number | null = null;
    let anyShiftActive = false;

    for (const pass of activePasses) {
      const isToday = pass.appointmentDate === todayStr;
      if (isToday) {
        if (pass.liveQueue?.isShiftActive) {
          anyShiftActive = true;
        }
        if (pass.liveQueue?.patientsAway !== undefined && pass.liveQueue.patientsAway !== null) {
          if (minPatientsAhead === null || pass.liveQueue.patientsAway < minPatientsAhead) {
            minPatientsAhead = pass.liveQueue.patientsAway;
          }
        }
      }
    }

    const intervalMs = calculatePollingInterval({
      isAppActive,
      hasActivePasses: activePasses.length > 0,
      patientsAhead: minPatientsAhead,
      isShiftActive: anyShiftActive,
      isConfirmed: activePasses.some((p) => p.status === 'WAITING'),
    });

    if (intervalMs > 0) {
      pollingTimerRef.current = setTimeout(() => {
        fetchAppointments(true);
      }, intervalMs);
    }

    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, [appointments, isAppActive, isAuthenticated, activePasses, todayStr, fetchAppointments]);

  // Handlers for pass actions
  const handleCancelPass = async (id: string) => {
    try {
      await api.cancelAppointment(id);
      await fetchAppointments(true);
    } catch (err: any) {
      console.warn('Failed to cancel pass:', err?.message);
    }
  };

  const handleTogglePresence = async (id: string, isCheckedIn: boolean) => {
    await api.checkInAppointmentDirect(id, isCheckedIn);
    await fetchAppointments(true);
  };

  const handleOpenScanner = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setScannerVisible(true);
  };

  const handleScanSuccess = async (payload: { clinicId: string; code: string }) => {
    try {
      await api.checkInWithQR({
        clinicId: payload.clinicId,
        code: payload.code,
        appointmentId: selectedAppointment?.id,
      });
      await fetchAppointments(true);
    } catch (err: any) {
      console.warn('QR check-in error:', err?.message);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>My Passes</Text>
          <Text style={styles.screenSubtitle}>
            Live OPD queue tokens & clinic passes
          </Text>
        </View>

        {activePasses.length > 0 && (
          <View style={styles.activePulseBadge}>
            <View style={styles.activePulseDot} />
            <Text style={styles.activePulseText}>Live Sync</Text>
          </View>
        )}
      </View>

      {/* Segmented Tab Bar */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeTab === 'ACTIVE' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('ACTIVE')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'ACTIVE' && styles.segmentTextActive,
            ]}
          >
            Active Passes
          </Text>
          {activePasses.length > 0 && (
            <View
              style={[
                styles.countBadge,
                activeTab === 'ACTIVE' && styles.countBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  activeTab === 'ACTIVE' && styles.countBadgeTextActive,
                ]}
              >
                {activePasses.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeTab === 'PAST' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('PAST')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'PAST' && styles.segmentTextActive,
            ]}
          >
            Past Visits
          </Text>
          {pastPasses.length > 0 && (
            <View
              style={[
                styles.countBadge,
                activeTab === 'PAST' && styles.countBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  activeTab === 'PAST' && styles.countBadgeTextActive,
                ]}
              >
                {pastPasses.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Scrollable Body */}
      {authLoading || (loading && appointments.length === 0) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Syncing queue passes...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="lock-closed-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sign In to View Passes</Text>
          <Text style={styles.emptySubtitle}>
            Sign in with your patient account to access your live clinic tokens, doctor cabin presence, and QR check-in.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Ionicons name="key-outline" size={18} color={Colors.inkWhite} style={styles.btnIcon} />
            <Text style={styles.signInButtonText}>Sign In to MediArca</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {activeTab === 'ACTIVE' ? (
            activePasses.length > 0 ? (
              activePasses.map((appt) => (
                <LiveQueueTicket
                  key={appt.id}
                  appointment={appt}
                  onCancel={handleCancelPass}
                  onScanQr={handleOpenScanner}
                  onTogglePresence={handleTogglePresence}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="ticket-outline" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Active Queue Passes</Text>
                <Text style={styles.emptySubtitle}>
                  You do not have any pending or waiting consultation tokens for today.
                </Text>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={() => router.push('/explore')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="search-outline" size={18} color={Colors.inkWhite} style={styles.btnIcon} />
                  <Text style={styles.signInButtonText}>Find Doctors & Book</Text>
                </TouchableOpacity>
              </View>
            )
          ) : pastPasses.length > 0 ? (
            pastPasses.map((appt) => (
              <LiveQueueTicket
                key={appt.id}
                appointment={appt}
                onCancel={handleCancelPass}
                onScanQr={handleOpenScanner}
                onTogglePresence={handleTogglePresence}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="archive-outline" size={40} color={Colors.inkMuted80} />
              </View>
              <Text style={styles.emptyTitle}>No Past Visits Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your completed consultations and archived passes will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Hardware Camera QR Scanner Modal */}
      <CameraQrScannerModal
        visible={scannerVisible}
        onClose={() => {
          setScannerVisible(false);
          setSelectedAppointment(null);
        }}
        onScanSuccess={handleScanSuccess}
        defaultClinicId={selectedAppointment?.clinicId}
        appointmentId={selectedAppointment?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasParchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  screenTitle: {
    ...Typography.title1,
    color: Colors.ink,
  },
  screenSubtitle: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    marginTop: 2,
  },
  activePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  activePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  activePulseText: {
    ...Typography.captionBold,
    color: Colors.ink,
    fontSize: 11,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    borderRadius: BorderRadius.pill,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary,
    ...Shadows.card,
  },
  segmentText: {
    ...Typography.captionBold,
    color: Colors.inkMuted80,
    fontSize: 13,
  },
  segmentTextActive: {
    color: Colors.inkWhite,
  },
  countBadge: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.pill,
  },
  countBadgeActive: {
    backgroundColor: Colors.inkWhite,
  },
  countBadgeText: {
    ...Typography.captionBold,
    color: Colors.inkMuted80,
    fontSize: 10,
  },
  countBadgeTextActive: {
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  emptyTitle: {
    ...Typography.title2,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.inkMuted80,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 14,
    marginBottom: Spacing.five,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: TouchTarget.minHeight,
    paddingHorizontal: Spacing.six,
    borderRadius: BorderRadius.pill,
    ...Shadows.card,
  },
  btnIcon: {
    marginRight: 8,
  },
  signInButtonText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
    fontSize: 14,
  },
});
