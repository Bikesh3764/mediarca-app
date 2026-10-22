import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import {
  api,
  getLocalDateString,
  ReceptionistDashboardData,
  ReceptionistLinkedDoctor,
  ReceptionistQueueItem,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ActiveDoctorSwitcher } from '@/components/receptionist/ActiveDoctorSwitcher';
import { MultiDoctorOverviewCard } from '@/components/receptionist/MultiDoctorOverviewCard';
import { DeskPatientCard } from '@/components/receptionist/DeskPatientCard';
import { DeskQrScannerModal } from '@/components/receptionist/DeskQrScannerModal';
import { MustChangePasswordModal } from '@/components/receptionist/MustChangePasswordModal';
import { sortReceptionistQueue } from '@/services/receptionistUtils';

export default function DeskScreen() {
  const router = useRouter();
  const { user, isAuthenticated, role } = useAuth();

  const [deskData, setDeskData] = useState<ReceptionistDashboardData | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [queueItems, setQueueItems] = useState<ReceptionistQueueItem[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isUpdatingCheckInId, setIsUpdatingCheckInId] = useState<string | null>(null);

  // Modals
  const [isScannerVisible, setIsScannerVisible] = useState<boolean>(false);

  const mustChangePassword = Boolean(user?.mustChangePassword);

  // Load Desk Profile & Linked Doctors
  const fetchDeskData = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await api.getMyReceptionist();
      setDeskData(data);

      const docs = data?.doctors || [];
      // Auto-select first doctor if none currently selected or previous not in list
      setSelectedDoctorId((prev) => {
        if (prev && docs.some((d) => d.doctorId === prev)) return prev;
        return docs.length > 0 ? docs[0].doctorId : null;
      });

      // Fetch pending approvals count
      try {
        const pending = await api.getPendingAppointments();
        setPendingApprovalsCount(Array.isArray(pending) ? pending.length : 0);
      } catch {
        // Non-critical
      }
    } catch (err: any) {
      console.warn('Failed to load receptionist desk data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch queue for currently selected doctor
  const fetchDoctorQueue = useCallback(async (doctorId: string) => {
    try {
      const todayStr = getLocalDateString();
      const res = await api.getReceptionistDoctorQueue(doctorId, todayStr);
      const appts = res?.appointments || [];
      const sorted = sortReceptionistQueue(appts);
      setQueueItems(sorted);
    } catch (err) {
      console.warn('Failed to fetch doctor queue:', err);
      setQueueItems([]);
    }
  }, []);

  useEffect(() => {
    fetchDeskData();
  }, [fetchDeskData]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchDoctorQueue(selectedDoctorId);
    }
  }, [selectedDoctorId, fetchDoctorQueue]);

  // Handle Arrival Check-In Toggle
  const handleToggleCheckIn = async (appointmentId: string, currentStatus: boolean) => {
    setIsUpdatingCheckInId(appointmentId);
    try {
      const nextStatus = !currentStatus;
      await api.checkInAppointmentDirect(appointmentId, nextStatus);

      // Optimistic update
      setQueueItems((prev) =>
        prev.map((item) =>
          item.id === appointmentId
            ? { ...item, isCheckedIn: nextStatus, checkedInAt: nextStatus ? new Date().toISOString() : null }
            : item
        )
      );

      // Re-fetch queue to synchronize
      if (selectedDoctorId) {
        fetchDoctorQueue(selectedDoctorId);
      }
    } catch (err: any) {
      Alert.alert('Check-In Error', err?.message || 'Failed to update arrival status.');
    } finally {
      setIsUpdatingCheckInId(null);
    }
  };

  const selectedDoctor = (deskData?.doctors || []).find((d) => d.doctorId === selectedDoctorId);

  return (
    <SafeAreaViewContainer
      scrollable
      refreshing={isRefreshing}
      onRefresh={() => fetchDeskData(true)}
    >
      {/* 1. Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.deskIconWrap}>
            <Ionicons name="desktop-outline" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Clinical Desk</Text>
            <Text style={styles.headerSubtitle}>
              {deskData?.clinic?.clinicName || 'Reception Counter'} • {getLocalDateString()}
            </Text>
          </View>
        </View>

        {/* Quick Nav to Approvals */}
        <TouchableOpacity
          style={styles.approvalsBadgeBtn}
          onPress={() => router.push('/(receptionist)/approvals')}
          activeOpacity={0.8}
        >
          <Ionicons name="card-outline" size={16} color={Colors.primary} />
          {pendingApprovalsCount > 0 && (
            <View style={styles.pendingBadgeDot}>
              <Text style={styles.pendingBadgeText}>{pendingApprovalsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Clinic Overview Telemetry Card */}
      <MultiDoctorOverviewCard
        clinic={deskData?.clinic}
        doctors={deskData?.doctors || []}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenScanQr={() => setIsScannerVisible(true)}
        onOpenWalkin={() => router.push('/(receptionist)/walkin')}
        onOpenApprovals={() => router.push('/(receptionist)/approvals')}
      />

      {/* 3. Horizontal Doctor Switcher Pill Carousel */}
      <ActiveDoctorSwitcher
        doctors={deskData?.doctors || []}
        selectedDoctorId={selectedDoctorId}
        onSelectDoctor={(docId) => setSelectedDoctorId(docId)}
      />

      {/* 4. Active Selected Doctor Banner */}
      {selectedDoctor && (
        <View style={styles.selectedDocBanner}>
          <View style={styles.selectedDocLeft}>
            <Text style={styles.selectedDocName}>
              {selectedDoctor.fullName?.startsWith('Dr.')
                ? selectedDoctor.fullName
                : `Dr. ${selectedDoctor.fullName}`}
            </Text>
            <Text style={styles.selectedDocSpecialty}>
              {selectedDoctor.specialty} • Fee: ₹{selectedDoctor.consultationFee}
            </Text>
          </View>

          <View style={styles.selectedDocStatusCol}>
            <View
              style={[
                styles.cabinStatusChip,
                selectedDoctor.cabinStatus === 'IN_CABIN'
                  ? styles.cabinIn
                  : selectedDoctor.cabinStatus === 'STEPPED_OUT'
                  ? styles.cabinOut
                  : styles.cabinAbsent,
              ]}
            >
              <View
                style={[
                  styles.cabinStatusDot,
                  {
                    backgroundColor:
                      selectedDoctor.cabinStatus === 'IN_CABIN'
                        ? Colors.success
                        : selectedDoctor.cabinStatus === 'STEPPED_OUT'
                        ? Colors.warning
                        : Colors.danger,
                  },
                ]}
              />
              <Text
                style={[
                  styles.cabinStatusText,
                  {
                    color:
                      selectedDoctor.cabinStatus === 'IN_CABIN'
                        ? Colors.success
                        : selectedDoctor.cabinStatus === 'STEPPED_OUT'
                        ? Colors.warning
                        : Colors.danger,
                  },
                ]}
              >
                {selectedDoctor.cabinStatus === 'IN_CABIN'
                  ? 'In Cabin'
                  : selectedDoctor.cabinStatus === 'STEPPED_OUT'
                  ? 'Stepped Out'
                  : 'Not In Cabin'}
              </Text>
            </View>
            {selectedDoctor.expectedReturnTime ? (
              <Text style={styles.returnTimeText}>
                Back ~{selectedDoctor.expectedReturnTime}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {/* 5. Patient Queue List */}
      <View style={styles.queueSection}>
        <View style={styles.queueHeaderRow}>
          <Text style={styles.queueSectionTitle}>
            TODAY'S QUEUE ({queueItems.length})
          </Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              if (selectedDoctorId) fetchDoctorQueue(selectedDoctorId);
            }}
          >
            <Ionicons name="reload" size={14} color={Colors.primary} />
            <Text style={styles.refreshBtnText}>Sync</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading doctor's queue...</Text>
          </View>
        ) : queueItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={40} color={Colors.inkMuted48} />
            <Text style={styles.emptyTitle}>Queue is Clear</Text>
            <Text style={styles.emptySubtitle}>
              No appointments registered for this doctor today.
            </Text>
            <TouchableOpacity
              style={styles.emptyWalkinBtn}
              onPress={() => router.push('/(receptionist)/walkin')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add" size={16} color={Colors.inkWhite} />
              <Text style={styles.emptyWalkinBtnText}>Dispense Walk-In Token</Text>
            </TouchableOpacity>
          </View>
        ) : (
          queueItems.map((item) => (
            <DeskPatientCard
              key={item.id}
              appointment={item}
              doctorName={selectedDoctor?.fullName}
              onToggleCheckIn={handleToggleCheckIn}
              isUpdatingCheckIn={isUpdatingCheckInId === item.id}
            />
          ))
        )}
      </View>

      {/* Camera QR Scanner Modal */}
      <DeskQrScannerModal
        visible={isScannerVisible}
        onClose={() => {
          setIsScannerVisible(false);
          if (selectedDoctorId) fetchDoctorQueue(selectedDoctorId);
        }}
        onScanSuccess={async (appointmentId) => {
          await api.checkInAppointmentDirect(appointmentId, true);
          if (selectedDoctorId) fetchDoctorQueue(selectedDoctorId);
        }}
      />

      {/* Enforce MustChangePassword Modal on First Login */}
      <MustChangePasswordModal
        visible={mustChangePassword}
        onSuccess={() => {
          fetchDeskData();
        }}
      />
    </SafeAreaViewContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  deskIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.title2,
    fontWeight: '700',
    color: Colors.ink,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted48,
    marginTop: 1,
  },
  approvalsBadgeBtn: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasPure,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.subtle,
  },
  pendingBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.warning,
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.inkWhite,
  },
  selectedDocBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  selectedDocLeft: {
    flex: 1,
  },
  selectedDocName: {
    fontSize: Typography.fontSize.headline,
    fontWeight: '700',
    color: Colors.ink,
  },
  selectedDocSpecialty: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted80,
    marginTop: 1,
  },
  selectedDocStatusCol: {
    alignItems: 'flex-end',
  },
  cabinStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  cabinIn: {
    backgroundColor: '#eafaf1',
  },
  cabinOut: {
    backgroundColor: '#fff8eb',
  },
  cabinAbsent: {
    backgroundColor: '#feeceb',
  },
  cabinStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cabinStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  returnTimeText: {
    fontSize: 10,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  queueSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  queueSectionTitle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Colors.inkMuted80,
    letterSpacing: 0.8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  loadingBox: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted80,
  },
  emptyCard: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.xl,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted48,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  emptyWalkinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  emptyWalkinBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
});
