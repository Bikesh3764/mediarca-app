import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Header } from '@/components/common/Header';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import {
  api,
  Appointment,
  DoctorAffiliationClinic,
  DoctorSlot,
  parseDoctorSlots,
  getLocalDateString,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  CabinPresenceStatus,
  partitionDoctorQueue,
} from '@/services/doctorUtils';
import { CabinPresenceSwitcher } from '@/components/doctor/CabinPresenceSwitcher';
import { DoctorShiftSelector } from '@/components/doctor/DoctorShiftSelector';
import { PatientQueueCard } from '@/components/doctor/PatientQueueCard';

export type QueueSegment = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';

export default function DoctorQueueScreen() {
  const router = useRouter();
  const { user, isAuthenticated, role } = useAuth();

  const [date, setDate] = useState<string>(() => getLocalDateString());
  const [selectedClinicId, setSelectedClinicId] = useState<string>('all');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('all');

  const [clinics, setClinics] = useState<DoctorAffiliationClinic[]>([]);
  const [slots, setSlots] = useState<DoctorSlot[]>([]);

  const [cabinStatus, setCabinStatus] = useState<CabinPresenceStatus>(
    (user?.doctorProfile?.cabinStatus as CabinPresenceStatus) || 'IN_CABIN'
  );
  const [expectedReturnTime, setExpectedReturnTime] = useState<string | null>(
    user?.doctorProfile?.expectedReturnTime || null
  );

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeSegment, setActiveSegment] = useState<QueueSegment>('WAITING');
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);
  const [actionProcessingType, setActionProcessingType] = useState<'CALL' | 'HOLD' | null>(null);

  // Load Affiliations and clinics
  const loadDoctorAffiliations = useCallback(async () => {
    try {
      if (isAuthenticated && role?.toUpperCase() === 'DOCTOR') {
        const aff = await api.getDoctorAffiliations();
        if (aff && aff.clinics) {
          setClinics(aff.clinics);
          if (aff.clinics.length > 0 && selectedClinicId === 'all') {
            const firstClinic = aff.clinics[0];
            if (firstClinic.slots && firstClinic.slots.length > 0) {
              setSlots(firstClinic.slots);
            }
          }
        }
      }
    } catch (err) {
      // Non-fatal, fallback to doctor's own slots
      if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
      }
    }
  }, [isAuthenticated, role, selectedClinicId, user]);

  // Fetch Queue Data
  const fetchQueueData = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg(null);

    try {
      const queueRes = await api.getDoctorQueue(
        date,
        'date',
        selectedClinicId !== 'all' ? selectedClinicId : undefined,
        selectedSlotId !== 'all' ? selectedSlotId : undefined
      );

      if (queueRes) {
        const all = queueRes.allAppointments || [
          ...(queueRes.activeInConsultation ? [queueRes.activeInConsultation] : []),
          ...(queueRes.waitingQueue || []),
          ...(queueRes.completedQueue || []),
        ];
        setAppointments(all);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load live queue from healthcare network.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, selectedClinicId, selectedSlotId]);

  useEffect(() => {
    loadDoctorAffiliations();
    fetchQueueData();
  }, [loadDoctorAffiliations, fetchQueueData]);

  // Handle clinic change
  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    setSelectedSlotId('all');

    if (clinicId === 'all') {
      if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
      }
    } else {
      const target = clinics.find((c) => c.clinicId === clinicId);
      if (target && target.slots && target.slots.length > 0) {
        setSlots(target.slots);
      } else if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
      }
    }
  };

  // Partitioned queue
  const partitioned = useMemo(() => {
    return partitionDoctorQueue(appointments);
  }, [appointments]);

  // Handle Call to Cabin
  const handleCallPatient = async (appointment: Appointment) => {
    setActionProcessingId(appointment.id);
    setActionProcessingType('CALL');
    try {
      await api.callPatient(appointment.id);
      // Auto switch to In Consultation or refresh
      await fetchQueueData(false);
      setActiveSegment('IN_CONSULTATION');
    } catch (err: any) {
      Alert.alert('Action Failed', err?.message || 'Could not call patient into cabin.');
    } finally {
      setActionProcessingId(null);
      setActionProcessingType(null);
    }
  };

  // Handle Hold
  const handleHoldPatient = async (appointment: Appointment) => {
    setActionProcessingId(appointment.id);
    setActionProcessingType('HOLD');
    try {
      await api.holdConsultation(appointment.id);
      await fetchQueueData(false);
      setActiveSegment('WAITING');
    } catch (err: any) {
      Alert.alert('Action Failed', err?.message || 'Could not hold consultation.');
    } finally {
      setActionProcessingId(null);
      setActionProcessingType(null);
    }
  };

  // Navigate to consultation room
  const handleOpenConsultation = (appointment: Appointment) => {
    router.push({
      pathname: '/(doctor)/consultation/[id]',
      params: { id: appointment.id },
    });
  };

  return (
    <SafeAreaViewContainer>
      {/* Top Navigation Bar */}
      <Header
        title="Live OPD Queue"
        subtitle={`${date} • Today's Practice`}
        showBack
        rightElement={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/(doctor)/schedule')}
              activeOpacity={0.75}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/(doctor)/profile')}
              activeOpacity={0.75}
            >
              <Ionicons name="person-circle-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchQueueData(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Sticky Real-Time Cabin Presence Switcher */}
        <View style={styles.stickyPresenceWrapper}>
          <CabinPresenceSwitcher
            currentStatus={cabinStatus}
            expectedReturnTime={expectedReturnTime}
            onStatusChange={(newStatus, newReturnTime) => {
              setCabinStatus(newStatus);
              setExpectedReturnTime(newReturnTime);
            }}
          />
        </View>

        {/* Doctor Shift & Clinic Selector */}
        <View style={styles.selectorsCard}>
          <DoctorShiftSelector
            clinics={clinics}
            selectedClinicId={selectedClinicId}
            onClinicChange={handleClinicChange}
            slots={slots}
            selectedSlotId={selectedSlotId}
            onShiftChange={setSelectedSlotId}
          />
        </View>

        {/* Error Notice */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.danger} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Queue Segment Tabs: Waiting, In Consultation, Completed */}
        <View style={styles.segmentNavTrack}>
          <TouchableOpacity
            style={[
              styles.segmentNavTab,
              activeSegment === 'WAITING' && styles.segmentNavTabActive,
            ]}
            onPress={() => setActiveSegment('WAITING')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentNavText,
                activeSegment === 'WAITING' && styles.segmentNavTextActive,
              ]}
            >
              Waiting
            </Text>
            <View
              style={[
                styles.badgeCount,
                activeSegment === 'WAITING' && styles.badgeCountActive,
              ]}
            >
              <Text
                style={[
                  styles.badgeCountText,
                  activeSegment === 'WAITING' && styles.badgeCountTextActive,
                ]}
              >
                {partitioned.waiting.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentNavTab,
              activeSegment === 'IN_CONSULTATION' && styles.segmentNavTabActive,
            ]}
            onPress={() => setActiveSegment('IN_CONSULTATION')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentNavText,
                activeSegment === 'IN_CONSULTATION' && styles.segmentNavTextActive,
              ]}
            >
              In Cabin
            </Text>
            {partitioned.inConsultation ? (
              <View style={styles.activeDotBadge} />
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentNavTab,
              activeSegment === 'COMPLETED' && styles.segmentNavTabActive,
            ]}
            onPress={() => setActiveSegment('COMPLETED')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentNavText,
                activeSegment === 'COMPLETED' && styles.segmentNavTextActive,
              ]}
            >
              Completed
            </Text>
            <View
              style={[
                styles.badgeCount,
                activeSegment === 'COMPLETED' && styles.badgeCountActive,
              ]}
            >
              <Text
                style={[
                  styles.badgeCountText,
                  activeSegment === 'COMPLETED' && styles.badgeCountTextActive,
                ]}
              >
                {partitioned.completed.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content for Selected Segment */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Syncing live OPD queue...</Text>
          </View>
        ) : (
          <View style={styles.queueListContainer}>
            {/* WAITING QUEUE */}
            {activeSegment === 'WAITING' && (
              <>
                {partitioned.waiting.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Ionicons name="checkmark-done-circle-outline" size={48} color={Colors.success} />
                    <Text style={styles.emptyTitle}>Queue Clear</Text>
                    <Text style={styles.emptySubtitle}>
                      No patients are currently waiting for consultation in this shift.
                    </Text>
                  </View>
                ) : (
                  partitioned.waiting.map((appt) => (
                    <PatientQueueCard
                      key={appt.id}
                      appointment={appt}
                      onCallToCabin={handleCallPatient}
                      onOpenConsultation={handleOpenConsultation}
                      isProcessingAction={actionProcessingId === appt.id}
                      processingActionType={
                        actionProcessingId === appt.id ? actionProcessingType : null
                      }
                    />
                  ))
                )}
              </>
            )}

            {/* IN CONSULTATION */}
            {activeSegment === 'IN_CONSULTATION' && (
              <>
                {!partitioned.inConsultation ? (
                  <View style={styles.emptyStateCard}>
                    <Ionicons name="person-outline" size={48} color={Colors.inkMuted48} />
                    <Text style={styles.emptyTitle}>No Active Patient</Text>
                    <Text style={styles.emptySubtitle}>
                      No patient is currently inside the cabin. Call the next patient from the Waiting queue.
                    </Text>
                    {partitioned.waiting.length > 0 ? (
                      <TouchableOpacity
                        style={styles.callNextBtn}
                        onPress={() => handleCallPatient(partitioned.waiting[0])}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="megaphone-outline" size={16} color={Colors.inkWhite} />
                        <Text style={styles.callNextBtnText}>
                          Call Next: {partitioned.waiting[0].patientName || 'Token #' + partitioned.waiting[0].queueNumber}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <PatientQueueCard
                    appointment={partitioned.inConsultation}
                    isActiveConsultation
                    onHold={handleHoldPatient}
                    onOpenConsultation={handleOpenConsultation}
                    isProcessingAction={actionProcessingId === partitioned.inConsultation.id}
                    processingActionType={
                      actionProcessingId === partitioned.inConsultation.id ? actionProcessingType : null
                    }
                  />
                )}
              </>
            )}

            {/* COMPLETED */}
            {activeSegment === 'COMPLETED' && (
              <>
                {partitioned.completed.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Ionicons name="folder-open-outline" size={48} color={Colors.inkMuted48} />
                    <Text style={styles.emptyTitle}>No Completed Encounters Yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Finished consultations for this session will be recorded here.
                    </Text>
                  </View>
                ) : (
                  partitioned.completed.map((appt) => (
                    <PatientQueueCard
                      key={appt.id}
                      appointment={appt}
                      isCompleted
                      onOpenConsultation={handleOpenConsultation}
                    />
                  ))
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaViewContainer>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIconBtn: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  stickyPresenceWrapper: {
    zIndex: 10,
  },
  selectorsCard: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.hairline,
    ...Shadows.card,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.two,
  },
  errorBannerText: {
    ...Typography.footnote,
    color: Colors.danger,
    flex: 1,
  },
  segmentNavTrack: {
    flexDirection: 'row',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  segmentNavTab: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
  },
  segmentNavTabActive: {
    backgroundColor: Colors.canvas,
    ...Shadows.card,
  },
  segmentNavText: {
    ...Typography.footnote,
    color: Colors.inkMuted48,
    fontWeight: '600',
  },
  segmentNavTextActive: {
    color: Colors.ink,
    fontWeight: '700',
  },
  badgeCount: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.pill,
  },
  badgeCountActive: {
    backgroundColor: Colors.primaryLight,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted48,
  },
  badgeCountTextActive: {
    color: Colors.primaryDark,
  },
  activeDotBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    paddingVertical: Spacing.eight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.inkMuted48,
  },
  queueListContainer: {
    gap: Spacing.two,
  },
  emptyStateCard: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg,
    padding: Spacing.seven,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
    gap: Spacing.two,
  },
  emptyTitle: {
    ...Typography.headline,
    color: Colors.ink,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.inkMuted48,
    textAlign: 'center',
    maxWidth: 280,
  },
  callNextBtn: {
    marginTop: Spacing.two,
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callNextBtnText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
});
