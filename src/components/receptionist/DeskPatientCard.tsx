import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { ReceptionistQueueItem } from '@/services/api';
import { formatIndianPhone, toTelUri } from '@/utils/phoneUtils';
import { formatDisplayToken } from '@/services/receptionistUtils';

export interface DeskPatientCardProps {
  appointment: ReceptionistQueueItem;
  doctorName?: string;
  onToggleCheckIn: (appointmentId: string, currentStatus: boolean) => Promise<void>;
  isUpdatingCheckIn?: boolean;
}

export const DeskPatientCard: React.FC<DeskPatientCardProps> = ({
  appointment,
  doctorName,
  onToggleCheckIn,
  isUpdatingCheckIn = false,
}) => {
  const isCheckedIn = Boolean(appointment.isCheckedIn);
  const isServing = appointment.status === 'IN_CONSULTATION';
  const isCompleted = appointment.status === 'COMPLETED';

  const handleCallPatient = () => {
    if (appointment.patientPhone && appointment.patientPhone !== 'N/A') {
      const uri = toTelUri(appointment.patientPhone);
      Linking.openURL(uri).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.card,
        isServing && styles.cardServing,
        isCompleted && styles.cardCompleted,
      ]}
    >
      {/* Top Row: Token Badge, Status, Arrival Chip */}
      <View style={styles.topRow}>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenText}>
            {formatDisplayToken(appointment.queueNumber)}
          </Text>
        </View>

        <View style={styles.statusChipsRow}>
          {/* Live Status Badge */}
          {isServing ? (
            <View style={styles.servingBadge}>
              <View style={styles.servingDot} />
              <Text style={styles.servingBadgeText}>In Cabin</Text>
            </View>
          ) : isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-done" size={12} color={Colors.success} />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          ) : null}

          {/* Physical Arrival Badge */}
          <View
            style={[
              styles.arrivalBadge,
              isCheckedIn ? styles.arrivalBadgeCheckedIn : styles.arrivalBadgePending,
            ]}
          >
            <Ionicons
              name={isCheckedIn ? 'checkmark-circle' : 'time-outline'}
              size={12}
              color={isCheckedIn ? Colors.success : Colors.warning}
            />
            <Text
              style={[
                styles.arrivalBadgeText,
                isCheckedIn ? styles.arrivalTextCheckedIn : styles.arrivalTextPending,
              ]}
            >
              {isCheckedIn ? 'Checked In' : 'Not Arrived'}
            </Text>
          </View>
        </View>
      </View>

      {/* Middle Row: Patient Details */}
      <View style={styles.patientInfoRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.patientNameText} numberOfLines={1}>
            {appointment.patientName || 'Patient'}
          </Text>

          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={12} color={Colors.inkMuted80} />
            <Text style={styles.phoneText}>
              {formatIndianPhone(appointment.patientPhone)}
            </Text>
            {appointment.patientAge ? (
              <Text style={styles.metaSubText}>• Age {appointment.patientAge}</Text>
            ) : null}
            {appointment.gender ? (
              <Text style={styles.metaSubText}>({appointment.gender})</Text>
            ) : null}
          </View>
        </View>

        {/* Call Quick Action */}
        {appointment.patientPhone && appointment.patientPhone !== 'N/A' && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCallPatient}
            activeOpacity={0.8}
            accessibilityLabel="Call Patient"
          >
            <Ionicons name="call" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dependent Booking Chip */}
      {appointment.isForOther && (
        <View style={styles.dependentBanner}>
          <Ionicons name="people-outline" size={12} color={Colors.primary} />
          <Text style={styles.dependentText}>Booking for family member</Text>
        </View>
      )}

      {/* Shift Window & Estimated Time */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={12} color={Colors.inkMuted80} />
          <Text style={styles.metaLabel} numberOfLines={1}>
            {appointment.checkingWindow || 'OPD Shift'}
          </Text>
        </View>
        {appointment.estimatedTime ? (
          <View style={styles.metaItem}>
            <Ionicons name="hourglass-outline" size={12} color={Colors.inkMuted80} />
            <Text style={styles.metaLabel}>Est. {appointment.estimatedTime}</Text>
          </View>
        ) : null}
      </View>

      {/* Reason for Visit */}
      {appointment.reasonForVisit &&
        appointment.reasonForVisit !== 'General Medical Consultation' && (
          <Text style={styles.reasonText} numberOfLines={2}>
            Reason: {appointment.reasonForVisit}
          </Text>
        )}

      {/* Action Footer: One-Tap Arrival Check-In Toggle */}
      {!isCompleted && (
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[
              styles.checkInToggleBtn,
              isCheckedIn
                ? styles.checkInToggleBtnChecked
                : styles.checkInToggleBtnNotChecked,
            ]}
            onPress={() => onToggleCheckIn(appointment.id, isCheckedIn)}
            disabled={isUpdatingCheckIn}
            activeOpacity={0.85}
          >
            {isUpdatingCheckIn ? (
              <ActivityIndicator
                size="small"
                color={isCheckedIn ? Colors.inkMuted80 : Colors.inkWhite}
              />
            ) : (
              <>
                <Ionicons
                  name={isCheckedIn ? 'close-circle-outline' : 'checkmark-done'}
                  size={16}
                  color={isCheckedIn ? Colors.inkMuted80 : Colors.inkWhite}
                />
                <Text
                  style={[
                    styles.checkInToggleBtnText,
                    isCheckedIn
                      ? styles.checkInToggleBtnTextChecked
                      : styles.checkInToggleBtnTextNotChecked,
                  ]}
                >
                  {isCheckedIn ? 'Undo Check-In' : 'Mark Arrived (Desk Check-In)'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    ...Shadows.subtle,
  },
  cardServing: {
    borderColor: Colors.primary,
    backgroundColor: '#fbfdff',
  },
  cardCompleted: {
    opacity: 0.75,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  tokenBadge: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tokenText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: '800',
    color: Colors.inkWhite,
    letterSpacing: -0.2,
  },
  statusChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  servingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eafaf1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  servingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  servingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  arrivalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  arrivalBadgeCheckedIn: {
    backgroundColor: '#eafaf1',
  },
  arrivalBadgePending: {
    backgroundColor: '#fff8eb',
  },
  arrivalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  arrivalTextCheckedIn: {
    color: Colors.success,
  },
  arrivalTextPending: {
    color: Colors.warning,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  nameBlock: {
    flex: 1,
    marginRight: Spacing.sm,
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
  callButton: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    borderRadius: TouchTarget.minWidth / 2,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dependentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  dependentText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 4,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.inkMuted80,
  },
  reasonText: {
    fontSize: 12,
    color: Colors.inkMuted48,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  footerRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
  checkInToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    borderRadius: BorderRadius.pill,
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  checkInToggleBtnNotChecked: {
    backgroundColor: Colors.primary,
  },
  checkInToggleBtnChecked: {
    backgroundColor: Colors.canvasParchment,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  checkInToggleBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
  },
  checkInToggleBtnTextNotChecked: {
    color: Colors.inkWhite,
  },
  checkInToggleBtnTextChecked: {
    color: Colors.inkMuted80,
  },
});
