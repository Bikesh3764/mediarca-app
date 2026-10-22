import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { api, Appointment } from '@/services/api';
import { formatIndianPhone, toTelUri } from '@/utils/phoneUtils';
import { formatDisplayToken, formatDisplayCurrency } from '@/services/receptionistUtils';
import { useAuth } from '@/context/AuthContext';
import { MustChangePasswordModal } from '@/components/receptionist/MustChangePasswordModal';

export default function ApprovalsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Action States
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingAppointment, setRejectingAppointment] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const mustChangePassword = Boolean(user?.mustChangePassword);

  const fetchPending = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await api.getPendingAppointments();
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setAppointments(list);
    } catch (err: any) {
      console.warn('Failed to fetch pending approvals:', err);
      setAppointments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Search filter
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredAppointments(appointments);
      return;
    }

    const filtered = appointments.filter((appt) => {
      const name = (appt.patientName || appt.patient?.user?.fullName || '').toLowerCase();
      const phone = (appt.patient?.user?.phone || '').toLowerCase();
      const docName = (appt.doctor?.user?.fullName || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || docName.includes(q);
    });
    setFilteredAppointments(filtered);
  }, [searchQuery, appointments]);

  // Approve Payment & Assign Token
  const handleApprove = async (appointment: Appointment) => {
    const patientName = appointment.patientName || appointment.patient?.user?.fullName || 'Patient';
    const fee = appointment.doctor?.consultationFee || 0;

    Alert.alert(
      'Confirm Payment & Issue Token',
      `Verify counter payment of ₹${fee} for ${patientName}?\n\nThis will transition the ticket from PENDING_APPROVAL to WAITING and lock in an official sequential queue number.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Issue Token',
          style: 'default',
          onPress: async () => {
            setApprovingId(appointment.id);
            try {
              const res = await api.approveAppointment(appointment.id);
              const queueNum = res?.data?.queueNumber || res?.queueNumber || 'Official';
              Alert.alert(
                'Payment Verified',
                `Official Queue Token #${queueNum} issued for ${patientName}.`
              );
              await fetchPending();
            } catch (err: any) {
              Alert.alert('Approval Error', err?.message || 'Failed to approve booking request.');
            } finally {
              setApprovingId(null);
            }
          },
        },
      ]
    );
  };

  // Submit Rejection
  const handleSubmitReject = async () => {
    if (!rejectingAppointment) return;
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert('Reason Required', 'Please provide a brief reason for declining this booking request.');
      return;
    }

    setIsRejecting(true);
    try {
      await api.rejectAppointment(rejectingAppointment.id, reason);
      Alert.alert('Request Declined', 'The booking request has been declined.');
      setRejectingAppointment(null);
      setRejectReason('');
      await fetchPending();
    } catch (err: any) {
      Alert.alert('Rejection Error', err?.message || 'Failed to decline booking request.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <SafeAreaViewContainer
      scrollable
      refreshing={isRefreshing}
      onRefresh={() => fetchPending(true)}
    >
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Back to Desk"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Online Payment Approvals</Text>
          <Text style={styles.headerSubtitle}>
            Verify counter UPI/Cash & lock in official queue tokens
          </Text>
        </View>
      </View>

      {/* 2. Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.inkMuted48} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name, phone, or doctor..."
          placeholderTextColor={Colors.inkMuted48}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={Colors.inkMuted48} />
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Approvals List */}
      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listSectionTitle}>
            PENDING REQUESTS ({filteredAppointments.length})
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchPending()}>
            <Ionicons name="reload" size={14} color={Colors.primary} />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading pending approvals...</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'No pending requests match your search.'
                : 'No online booking requests are pending counter payment verification.'}
            </Text>
          </View>
        ) : (
          filteredAppointments.map((appt) => {
            const rawDoc = appt.doctor?.user?.fullName || 'Practitioner';
            const docName = rawDoc.startsWith('Dr.') ? rawDoc : `Dr. ${rawDoc}`;
            const patientName = appt.patientName || appt.patient?.user?.fullName || 'Patient';
            const phone = (appt as any).patientPhone || appt.patient?.user?.phone || 'N/A';
            const estToken = appt.estimatedQueueNumber || 1;
            const fee = appt.doctor?.consultationFee || 0;
            const isApproving = approvingId === appt.id;

            return (
              <View key={appt.id} style={styles.approvalCard}>
                {/* Header Row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.estTokenBadge}>
                    <Text style={styles.estTokenText}>
                      {formatDisplayToken(estToken, true)}
                    </Text>
                  </View>

                  <View style={styles.feeBadge}>
                    <Text style={styles.feeBadgeText}>Fee: {formatDisplayCurrency(fee)}</Text>
                  </View>
                </View>

                {/* Patient Information */}
                <View style={styles.patientRow}>
                  <View style={styles.patientInfoCol}>
                    <Text style={styles.patientNameText} numberOfLines={1}>
                      {patientName}
                    </Text>
                    <View style={styles.phoneRow}>
                      <Ionicons name="call-outline" size={12} color={Colors.inkMuted80} />
                      <Text style={styles.phoneText}>
                        {formatIndianPhone(phone)}
                      </Text>
                      {appt.patientAge ? (
                        <Text style={styles.metaSubText}>• Age {appt.patientAge}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Call Quick Action */}
                  {phone && phone !== 'N/A' && (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => Linking.openURL(toTelUri(phone)).catch(() => {})}
                      activeOpacity={0.8}
                      accessibilityLabel="Call Patient"
                    >
                      <Ionicons name="call" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Booking Metadata */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaTile}>
                    <Text style={styles.metaLabel}>Doctor</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {docName}
                    </Text>
                  </View>
                  <View style={styles.metaTile}>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{appt.appointmentDate}</Text>
                  </View>
                  <View style={styles.metaTile}>
                    <Text style={styles.metaLabel}>Shift</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {appt.checkingWindow || 'OPD Shift'}
                    </Text>
                  </View>
                </View>

                {/* Reason for Visit */}
                {appt.reasonForVisit &&
                  appt.reasonForVisit !== 'General Medical Consultation' && (
                    <Text style={styles.reasonText} numberOfLines={2}>
                      Reason: {appt.reasonForVisit}
                    </Text>
                  )}

                {/* Action Buttons */}
                <View style={styles.actionBtnRow}>
                  {/* Reject / Cancel */}
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => {
                      setRejectingAppointment(appt);
                      setRejectReason('');
                    }}
                    disabled={isApproving || isRejecting}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
                    <Text style={styles.rejectBtnText}>Decline</Text>
                  </TouchableOpacity>

                  {/* Approve Payment & Issue Official Token */}
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(appt)}
                    disabled={isApproving || isRejecting}
                    activeOpacity={0.85}
                  >
                    {isApproving ? (
                      <ActivityIndicator size="small" color={Colors.inkWhite} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color={Colors.inkWhite} />
                        <Text style={styles.approveBtnText}>
                          Approve Payment & Assign Token
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Reject Reason Dialog Modal */}
      <Modal
        visible={Boolean(rejectingAppointment)}
        animationType="fade"
        transparent
        onRequestClose={() => setRejectingAppointment(null)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardAvoid}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Decline Booking Request</Text>
              <Text style={styles.modalSubtitle}>
                State the reason for declining this appointment request. The patient will receive an instant notification.
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Doctor unavailable, slot capacity full, invalid contact details..."
                placeholderTextColor={Colors.inkMuted48}
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setRejectingAppointment(null)}
                  disabled={isRejecting}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleSubmitReject}
                  disabled={isRejecting}
                >
                  {isRejecting ? (
                    <ActivityIndicator size="small" color={Colors.inkWhite} />
                  ) : (
                    <Text style={styles.modalConfirmText}>Confirm Decline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Password Change Guard */}
      <MustChangePasswordModal
        visible={mustChangePassword}
        onSuccess={() => fetchPending()}
      />
    </SafeAreaViewContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  headerTitleCol: {
    flex: 1,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    minHeight: TouchTarget.minHeight,
    ...Shadows.subtle,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    color: Colors.ink,
    minHeight: TouchTarget.minHeight,
  },
  clearBtn: {
    padding: 4,
  },
  listSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  listSectionTitle: {
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
  },
  approvalCard: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    ...Shadows.subtle,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  estTokenBadge: {
    backgroundColor: Colors.canvasParchment,
    borderWidth: 1,
    borderColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  estTokenText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.warning,
  },
  feeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  feeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  patientInfoCol: {
    flex: 1,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  patientNameText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: '700',
    color: Colors.ink,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  phoneText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted80,
    fontWeight: '500',
  },
  metaSubText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted48,
  },
  metaGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  metaTile: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.inkMuted48,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink,
    marginTop: 1,
  },
  reasonText: {
    fontSize: 12,
    color: Colors.inkMuted48,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#feeceb',
    gap: 4,
  },
  rejectBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.danger,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    gap: 6,
  },
  approveBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalKeyboardAvoid: {
    width: '100%',
    maxWidth: 420,
  },
  modalCard: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    ...Shadows.modal,
  },
  modalTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted80,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.input,
    backgroundColor: Colors.canvasParchment,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.body,
    color: Colors.ink,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: Spacing.md,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
  },
  modalCancelText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  modalConfirmBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.danger,
  },
  modalConfirmText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
});
