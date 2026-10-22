import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appointment, getFileUrl } from '@/services/api';
import { getPassDisplayData } from '@/services/queueUtils';
import { toTelUri } from '@/utils/phoneUtils';
import { CabinBadge } from '@/components/common/CabinBadge';
import { QueueTelemetryCard } from '@/components/queue/QueueTelemetryCard';
import { ReceptionistCallCard } from '@/components/queue/ReceptionistCallCard';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';

export interface LiveQueueTicketProps {
  appointment: Appointment;
  onCancel?: (id: string) => void | Promise<void>;
  onScanQr?: (appointment: Appointment) => void;
  onTogglePresence?: (appointmentId: string, isCheckedIn: boolean) => Promise<void>;
}

export const LiveQueueTicket: React.FC<LiveQueueTicketProps> = ({
  appointment,
  onCancel,
  onScanQr,
  onTogglePresence,
}) => {
  const [imgError, setImgError] = useState(false);
  const [togglingPresence, setTogglingPresence] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const display = getPassDisplayData(appointment);
  const { doctor, status } = appointment;

  const handlePresenceToggle = async () => {
    if (togglingPresence) return;
    const nextState = !display.isCheckedIn;
    setTogglingPresence(true);
    try {
      if (onTogglePresence) {
        await onTogglePresence(appointment.id, nextState);
      }
    } catch (err: any) {
      Alert.alert('Presence Error', err?.message || 'Failed to update clinic presence.');
    } finally {
      setTogglingPresence(false);
    }
  };

  const handleCancelPress = () => {
    if (!onCancel) return;
    const isPending = status === 'PENDING_APPROVAL';
    Alert.alert(
      isPending ? 'Withdraw Request' : 'Cancel Queue Token',
      isPending
        ? 'Are you sure you want to withdraw your appointment request?'
        : 'Are you sure you want to cancel your confirmed token? Your queue position will be released.',
      [
        { text: 'Keep Token', style: 'cancel' },
        {
          text: isPending ? 'Withdraw' : 'Cancel Token',
          style: 'destructive',
          onPress: () => onCancel(appointment.id),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* 0. Active Live Status Pulse Indicator Banner */}
      {display.isToday && (display.isWaiting || display.isServing || display.isInConsultation) && (
        <View style={styles.livePulseBanner}>
          <View style={styles.livePulseIndicatorWrap}>
            <View
              style={[
                styles.livePulseDot,
                display.isServing
                  ? styles.livePulseDotServing
                  : styles.livePulseDotActive,
              ]}
            />
          </View>
          <Text style={styles.livePulseBannerText}>
            {display.isServing
              ? 'LIVE NOW • Token Called in Consultation Room'
              : display.isInConsultation
              ? 'LIVE NOW • Consultation In Progress'
              : 'LIVE QUEUE PASS • Real-Time OPD Sync'}
          </Text>
        </View>
      )}

      {/* 1. Header Row: Doctor Info & Token Badge */}
      <View style={styles.headerRow}>
        {/* Doctor Info */}
        <View style={styles.doctorBlock}>
          <View style={styles.avatarWrap}>
            {doctor.user?.avatarUrl && !imgError ? (
              <Image
                source={{ uri: getFileUrl(doctor.user.avatarUrl) }}
                style={styles.avatarImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {(doctor.user?.fullName || 'D')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.doctorDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.doctorNameText} numberOfLines={1}>
                {display.doctorDisplayName}
              </Text>
            </View>

            <View style={styles.cabinBadgeRow}>
              <CabinBadge
                status={doctor.cabinStatus}
                expectedReturnTime={doctor.expectedReturnTime}
                onPress={
                  doctor.cabinStatus === 'STEPPED_OUT'
                    ? () => setShowReturnModal(true)
                    : undefined
                }
              />
            </View>

            <Text style={styles.specialtyText} numberOfLines={1}>
              {doctor.specialty}
            </Text>

            <View style={styles.clinicRow}>
              <Ionicons name="business-outline" size={12} color={Colors.inkMuted80} />
              <Text style={styles.clinicNameText} numberOfLines={1}>
                {display.clinicName}
              </Text>
            </View>

            {display.clinicAddress ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={12} color={Colors.inkMuted80} />
                <Text style={styles.clinicAddressText} numberOfLines={1}>
                  {display.clinicAddress}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Token Capsule */}
        <View style={styles.tokenCapsuleWrap}>
          {display.isPendingApproval ? (
            <View style={styles.pendingTokenCapsule}>
              <Text style={styles.capsuleSmallLabel}>Est. Token</Text>
              <Text style={styles.capsuleLargeNumber}>#{display.estToken} (Estimated)</Text>
              <View style={styles.pendingBadgePill}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            </View>
          ) : display.isExpired ? (
            <View style={styles.neutralCapsule}>
              <Text style={styles.capsuleSmallLabel}>Status</Text>
              <Text style={styles.expiredBadgeText}>Expired</Text>
            </View>
          ) : display.isCompleted ? (
            <View style={styles.completedCapsule}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.completedCapsuleText}>#{display.officialToken || display.estToken}</Text>
            </View>
          ) : display.isServing ? (
            <View style={styles.servingTokenCapsule}>
              <Text style={styles.servingCapsuleLabel}>Serving</Text>
              <Text style={styles.servingCapsuleNumber}>#{display.officialToken || display.estToken}</Text>
            </View>
          ) : display.isCancelled ? (
            <View style={styles.cancelledCapsule}>
              <Text style={styles.cancelledBadgeText}>Cancelled</Text>
            </View>
          ) : (
            <View style={styles.confirmedTokenCapsule}>
              <Text style={styles.capsuleSmallLabel}>
                {display.officialToken > 0 ? 'Queue' : 'Est. Queue'}
              </Text>
              <Text style={styles.capsuleLargeNumberPrimary}>
                {display.officialToken > 0
                  ? `#${display.officialToken}`
                  : `#${display.estToken} (Estimated)`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. 3-Tile Metadata Grid: Date, Shift, Est. Time */}
      <View style={styles.metaGrid}>
        {/* Tile 1: Date */}
        <View style={styles.metaTile}>
          <Text style={styles.metaLabel}>Date</Text>
          <View style={styles.metaValueRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
            <Text style={styles.metaValueText} numberOfLines={1}>
              {appointment.appointmentDate}
              {display.isToday ? ' (Today)' : ''}
            </Text>
          </View>
        </View>

        {/* Tile 2: Shift */}
        <View style={styles.metaTile}>
          <Text style={styles.metaLabel}>Shift</Text>
          <View style={styles.metaValueRow}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.metaValueText} numberOfLines={1}>
              {display.cleanShiftWindow}
            </Text>
          </View>
        </View>

        {/* Tile 3: Est. Time / Status */}
        <View style={styles.metaTile}>
          <Text style={styles.metaLabel}>
            {display.isCompleted || display.isExpired || display.isCancelled
              ? 'Status'
              : 'Est. Time'}
          </Text>
          <View style={styles.metaValueRow}>
            <Ionicons
              name={
                display.isCompleted
                  ? 'checkmark-done'
                  : display.isServing
                  ? 'pulse'
                  : 'hourglass-outline'
              }
              size={14}
              color={display.isServing ? Colors.primary : Colors.inkMuted80}
            />
            <Text
              style={[
                styles.metaValueText,
                display.isServing && { color: Colors.primary, fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {display.waitTimeDisplay}
            </Text>
          </View>
        </View>
      </View>

      {/* Reason for Visit (if non-standard) */}
      {appointment.reasonForVisit &&
        appointment.reasonForVisit !== 'General Medical Consultation' && (
          <View style={styles.reasonBlock}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText} numberOfLines={1}>
              {appointment.reasonForVisit}
            </Text>
          </View>
        )}

      {/* Dependent Booking Info */}
      {appointment.isForOther && (
        <View style={styles.dependentBanner}>
          <View style={styles.dependentPill}>
            <Text style={styles.dependentPillText}>Family / Dependent</Text>
          </View>
          <Text style={styles.dependentNameText}>
            Patient: {appointment.patientName || 'Family Member'}
            {appointment.patientAge ? ` • Age ${appointment.patientAge}` : ''}
            {appointment.patientGender ? ` (${appointment.patientGender})` : ''}
          </Text>
        </View>
      )}

      {/* 3. Physical Arrival & QR Check-In Status Card */}
      {display.isToday && (display.isWaiting || display.isInConsultation) && (
        <View style={styles.arrivalCard}>
          <View style={styles.arrivalHeader}>
            <View
              style={[
                styles.presenceDot,
                {
                  backgroundColor: display.isCheckedIn
                    ? Colors.success
                    : Colors.inkMuted48,
                },
              ]}
            />
            <View style={styles.arrivalTextCol}>
              <View style={styles.arrivalBadgeTitleRow}>
                <Text style={styles.arrivalTitle}>
                  {display.isCheckedIn
                    ? 'Arrival Confirmed'
                    : 'Not Checked In (Arrival Pending)'}
                </Text>
                {display.isCheckedIn && (
                  <View style={styles.arrivedVerifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                    <Text style={styles.arrivedVerifiedText}>Arrived & Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.arrivalSubtitle}>
                {display.isCheckedIn
                  ? 'Marked present in clinic waiting area'
                  : 'Scan clinic standee QR upon arrival to confirm presence'}
              </Text>
            </View>
          </View>

          {display.isCheckedIn ? (
            <TouchableOpacity
              style={styles.stepOutButton}
              onPress={handlePresenceToggle}
              disabled={togglingPresence}
              activeOpacity={0.8}
            >
              <Text style={styles.stepOutButtonText}>
                {togglingPresence ? 'Updating...' : 'Step Out (Away)'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.scanQrButton}
              onPress={() => onScanQr?.(appointment)}
              activeOpacity={0.85}
            >
              <Ionicons name="qr-code-outline" size={16} color={Colors.inkWhite} />
              <Text style={styles.scanQrButtonText}>Scan Clinic QR</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 4. Live Queue Telemetry Flow */}
      <QueueTelemetryCard
        appointment={appointment}
        isToday={display.isToday}
        doctorDisplayName={display.doctorDisplayName}
        onPressSteppedOut={
          doctor.cabinStatus === 'STEPPED_OUT'
            ? () => setShowReturnModal(true)
            : undefined
        }
      />

      {/* 5. Receptionist Coordination & Direct Call Card */}
      <ReceptionistCallCard
        receptionistName={display.receptionistName}
        receptionistPhone={display.receptionistPhone}
        status={status}
        estToken={display.estToken}
        officialToken={display.officialToken}
        isShiftPassed={appointment.liveQueue?.isShiftPassed}
      />

      {/* 6. Action Footer (Cancel Token / Withdraw Request) */}
      {(display.isWaiting || display.isPendingApproval) && onCancel && (
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelPress}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>
              {display.isPendingApproval ? 'Withdraw Request' : 'Cancel Token'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 7. Doctor Stepped Out Return Time Modal */}
      <Modal
        visible={showReturnModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReturnModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.returnModalContent}>
            <View style={styles.returnModalIconWrap}>
              <Ionicons name="time" size={32} color={Colors.warningDark} />
            </View>

            <Text style={styles.returnModalTitle}>Doctor Stepped Out</Text>
            <Text style={styles.returnModalDoctorName}>
              {display.doctorDisplayName} • {doctor.specialty}
            </Text>

            <View style={styles.returnTimeBox}>
              <Text style={styles.returnTimeLabel}>EXPECTED RETURN</Text>
              <Text style={styles.returnTimeValue}>
                {doctor.expectedReturnTime ? `Around ${doctor.expectedReturnTime}` : 'Returning Shortly'}
              </Text>
            </View>

            <Text style={styles.returnModalNotice}>
              The doctor has temporarily stepped out of the consultation cabin. Your token #{display.officialToken || display.estToken} is securely preserved in the OPD queue. Calling will automatically resume upon the doctor's return.
            </Text>

            {display.receptionistPhone ? (
              <TouchableOpacity
                style={styles.callReceptionModalBtn}
                onPress={() => {
                  setShowReturnModal(false);
                  const uri = toTelUri(display.receptionistPhone);
                  Linking.openURL(uri).catch(() => {
                    Alert.alert('Unable to Call', `Please dial ${display.receptionistPhone} directly.`);
                  });
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={16} color={Colors.inkWhite} style={{ marginRight: 6 }} />
                <Text style={styles.callReceptionModalText}>
                  Call Reception ({display.receptionistName})
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowReturnModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.closeModalBtnText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.four,
  },
  doctorBlock: {
    flexDirection: 'row',
    flex: 1,
    marginRight: Spacing.two,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.canvasParchment,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    ...Typography.title2,
    color: Colors.inkWhite,
    fontWeight: '700',
  },
  doctorDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorNameText: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 16,
  },
  cabinBadgeRow: {
    marginTop: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  specialtyText: {
    ...Typography.captionBold,
    color: Colors.primary,
    fontSize: 12,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clinicNameText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    fontSize: 11,
    flex: 1,
  },
  tokenCapsuleWrap: {
    alignItems: 'flex-end',
  },
  pendingTokenCapsule: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  capsuleSmallLabel: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    fontSize: 10,
  },
  capsuleLargeNumber: {
    ...Typography.title2,
    color: Colors.ink,
    fontWeight: '700',
    lineHeight: 26,
  },
  capsuleLargeNumberPrimary: {
    ...Typography.title2,
    color: Colors.primary,
    fontWeight: '700',
    lineHeight: 26,
  },
  pendingBadgePill: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.pill,
    marginTop: 2,
  },
  pendingBadgeText: {
    ...Typography.captionBold,
    color: Colors.warningDark,
    fontSize: 9,
  },
  confirmedTokenCapsule: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  servingTokenCapsule: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.card,
  },
  servingCapsuleLabel: {
    ...Typography.captionBold,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
  },
  servingCapsuleNumber: {
    ...Typography.title2,
    color: Colors.inkWhite,
    fontWeight: '700',
    lineHeight: 26,
  },
  completedCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  completedCapsuleText: {
    ...Typography.captionBold,
    color: Colors.success,
  },
  neutralCapsule: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  expiredBadgeText: {
    ...Typography.captionBold,
    color: Colors.inkMuted48,
  },
  cancelledCapsule: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  cancelledBadgeText: {
    ...Typography.captionBold,
    color: Colors.danger,
    fontSize: 11,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  metaTile: {
    flex: 1,
    padding: Spacing.two,
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    fontSize: 10,
    marginBottom: 2,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValueText: {
    ...Typography.captionBold,
    color: Colors.ink,
    fontSize: 11,
    flex: 1,
  },
  reasonBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    marginTop: Spacing.two,
  },
  reasonLabel: {
    ...Typography.captionBold,
    color: Colors.inkMuted80,
    marginRight: 6,
    fontSize: 11,
  },
  reasonText: {
    ...Typography.caption,
    color: Colors.ink,
    flex: 1,
    fontSize: 11,
  },
  dependentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    marginTop: Spacing.two,
    gap: 8,
  },
  dependentPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  dependentPillText: {
    ...Typography.captionBold,
    color: Colors.inkWhite,
    fontSize: 9,
  },
  dependentNameText: {
    ...Typography.captionBold,
    color: Colors.primaryDark,
    fontSize: 11,
    flex: 1,
  },
  arrivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.card,
    padding: Spacing.three,
    marginTop: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  arrivalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.two,
  },
  presenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  arrivalTextCol: {
    flex: 1,
  },
  arrivalTitle: {
    ...Typography.captionBold,
    color: Colors.ink,
    fontSize: 12,
  },
  arrivalSubtitle: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    fontSize: 10,
    marginTop: 2,
  },
  scanQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    minHeight: 36,
  },
  scanQrButtonText: {
    ...Typography.captionBold,
    color: Colors.inkWhite,
    fontSize: 12,
  },
  stepOutButton: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    minHeight: 36,
  },
  stepOutButtonText: {
    ...Typography.captionBold,
    color: Colors.inkMuted80,
    fontSize: 11,
  },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    alignItems: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cancelButtonText: {
    ...Typography.captionBold,
    color: Colors.danger,
    fontSize: 12,
  },
  livePulseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.three,
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  livePulseIndicatorWrap: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 102, 204, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  livePulseDotActive: {
    backgroundColor: Colors.primary,
  },
  livePulseDotServing: {
    backgroundColor: Colors.success,
  },
  livePulseBannerText: {
    ...Typography.captionBold,
    color: Colors.ink,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clinicAddressText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    fontSize: 11,
    flex: 1,
  },
  arrivalBadgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  arrivedVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  arrivedVerifiedText: {
    ...Typography.captionBold,
    color: Colors.successDark,
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  returnModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    padding: Spacing.five,
    alignItems: 'center',
    ...Shadows.card,
  },
  returnModalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  returnModalTitle: {
    ...Typography.title2,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  returnModalDoctorName: {
    ...Typography.captionBold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  returnTimeBox: {
    width: '100%',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  returnTimeLabel: {
    ...Typography.captionBold,
    color: Colors.inkMuted80,
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  returnTimeValue: {
    ...Typography.bodyBold,
    color: Colors.warningDark,
    fontSize: 15,
  },
  returnModalNotice: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  callReceptionModalBtn: {
    width: '100%',
    height: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    ...Shadows.card,
  },
  callReceptionModalText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
    fontSize: 13,
  },
  closeModalBtn: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.pill,
  },
  closeModalBtnText: {
    ...Typography.captionBold,
    color: Colors.inkMuted80,
  },
});
