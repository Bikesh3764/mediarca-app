import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { Appointment } from '@/services/api';
import { formatIndianPhone } from '@/utils/phoneUtils';
import { formatDisplayToken } from '@/services/receptionistUtils';

export interface WalkinConfirmationModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}

export const WalkinConfirmationModal: React.FC<WalkinConfirmationModalProps> = ({
  visible,
  appointment,
  onClose,
}) => {
  if (!appointment) return null;

  const rawDoc =
    appointment.doctor?.user?.fullName ||
    (appointment.doctor as any)?.fullName ||
    'Practitioner';
  const doctorName = rawDoc.startsWith('Dr.') ? rawDoc : `Dr. ${rawDoc}`;
  const patientName = appointment.patientName || appointment.patient?.user?.fullName || 'Walk-in Patient';
  const phone = (appointment as any).patientPhone || appointment.patient?.user?.phone || 'N/A';
  const clinicName = appointment.clinic?.clinicName || (appointment.clinic as any)?.name || 'Clinic Front Desk';
  const tokenStr = formatDisplayToken(appointment.queueNumber);
  const appointmentDate = appointment.appointmentDate || 'Today';
  const shiftName = appointment.checkingWindow || (appointment as any).slot?.name || 'OPD Shift';
  const estTime = appointment.estimatedTime || 'Per live queue';

  const handleShare = async () => {
    try {
      const message = `MediArca OPD Pass\nToken: ${tokenStr}\nPatient: ${patientName}\nDoctor: ${doctorName}\nClinic: ${clinicName}\nDate: ${appointmentDate}\nShift: ${shiftName}\nEst. Time: ${estTime}\n\nPlease arrive 10 minutes before your estimated time.`;
      await Share.share({
        message,
        title: `MediArca Token ${tokenStr}`,
      });
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-circle" size={36} color={Colors.success} />
            </View>
            <Text style={styles.title}>Token Dispensed</Text>
            <Text style={styles.subtitle}>
              Walk-in patient added to live queue successfully.
            </Text>
          </View>

          {/* Token Display Tile */}
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>QUEUE TOKEN NUMBER</Text>
            <Text style={styles.tokenNumber}>{tokenStr}</Text>
            <View style={styles.waitingChip}>
              <View style={styles.waitingDot} />
              <Text style={styles.waitingChipText}>Active in Queue</Text>
            </View>
          </View>

          {/* Details Table */}
          <View style={styles.detailsTable}>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Patient</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {patientName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Mobile</Text>
              <Text style={styles.detailValue}>
                {formatIndianPhone(phone)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Doctor</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {doctorName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Shift</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {appointment.checkingWindow || 'OPD Shift'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Est. Time</Text>
              <Text style={[styles.detailValue, { color: Colors.primary, fontWeight: '700' }]}>
                {appointment.estimatedTime || 'Per live queue'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Facility</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {clinicName}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonStack}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
              <Text style={styles.shareBtnText}>Share / Send SMS Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Done / Next Patient</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    ...Shadows.modal,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkIcon: {
    marginBottom: 4,
  },
  title: {
    fontSize: Typography.fontSize.title2,
    fontWeight: '700',
    color: Colors.ink,
  },
  subtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted80,
    marginTop: 2,
    textAlign: 'center',
  },
  tokenBox: {
    backgroundColor: Colors.ink,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tokenNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.inkWhite,
    letterSpacing: -1,
    marginVertical: 4,
  },
  waitingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    gap: 5,
  },
  waitingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  waitingChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  detailsTable: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  detailKey: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.inkMuted48,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
    maxWidth: 200,
    textAlign: 'right',
  },
  buttonStack: {
    gap: Spacing.xs,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  shareBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.primary,
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
  },
  doneBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
});
