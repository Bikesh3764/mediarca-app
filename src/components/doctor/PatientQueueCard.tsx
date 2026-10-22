import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { Appointment } from '@/services/api';
import { isPatientArrivalVerified } from '@/services/doctorUtils';

export interface PatientQueueCardProps {
  appointment: Appointment;
  isActiveConsultation?: boolean;
  isCompleted?: boolean;
  onCallToCabin?: (appointment: Appointment) => void;
  onHold?: (appointment: Appointment) => void;
  onOpenConsultation?: (appointment: Appointment) => void;
  isProcessingAction?: boolean;
  processingActionType?: 'CALL' | 'HOLD' | null;
}

export const PatientQueueCard: React.FC<PatientQueueCardProps> = ({
  appointment,
  isActiveConsultation = false,
  isCompleted = false,
  onCallToCabin,
  onHold,
  onOpenConsultation,
  isProcessingAction = false,
  processingActionType = null,
}) => {
  const isCheckedIn = isPatientArrivalVerified(appointment);
  const patientName =
    appointment.patientName ||
    appointment.patient?.user?.fullName ||
    (appointment as any).patientUser?.fullName ||
    'Patient';

  const isForOther = appointment.isForOther && appointment.patientName;
  const bookedByName = appointment.patient?.user?.fullName;

  const phone = appointment.patientPhone || appointment.patient?.user?.phone;
  const reason = appointment.reasonForVisit || appointment.symptoms || (appointment as any).chiefComplaint;

  const tokenNum = appointment.queueNumber || (appointment as any).tokenNumber || (appointment as any).token;
  const tokenDisplay = tokenNum ? `#${tokenNum}` : '#--';

  const ageGenderParts: string[] = [];
  if (appointment.patientAge) ageGenderParts.push(`${appointment.patientAge} yrs`);
  if (appointment.patientGender) ageGenderParts.push(appointment.patientGender);
  const ageGenderStr = ageGenderParts.join(' • ');

  return (
    <View
      style={[
        styles.card,
        isActiveConsultation && styles.activeConsultationCard,
        isCompleted && styles.completedCard,
      ]}
    >
      {/* Top Banner: Token & Arrival Badge */}
      <View style={styles.topRow}>
        <View style={styles.tokenPill}>
          <Text style={[styles.tokenText, isActiveConsultation && styles.activeTokenText]}>
            {tokenDisplay}
          </Text>
        </View>

        <View style={styles.badgesGroup}>
          {isActiveConsultation ? (
            <View style={styles.inConsultationBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.inConsultationBadgeText}>IN CABIN NOW</Text>
            </View>
          ) : isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.successDark} />
              <Text style={styles.completedBadgeText}>COMPLETED</Text>
            </View>
          ) : isCheckedIn ? (
            <View style={styles.checkedInBadge}>
              <View style={styles.checkedInDot} />
              <Text style={styles.checkedInBadgeText}>Checked In at Clinic</Text>
            </View>
          ) : (
            <View style={styles.notCheckedInBadge}>
              <Ionicons name="time-outline" size={11} color={Colors.inkMuted48} />
              <Text style={styles.notCheckedInBadgeText}>Pending Arrival</Text>
            </View>
          )}
        </View>
      </View>

      {/* Patient Name & Details */}
      <View style={styles.patientInfoBlock}>
        <View style={styles.nameRow}>
          <Text style={styles.patientNameText} numberOfLines={1}>
            {patientName}
          </Text>
          {ageGenderStr ? (
            <Text style={styles.ageGenderText}>({ageGenderStr})</Text>
          ) : null}
        </View>

        {isForOther && bookedByName ? (
          <View style={styles.dependentBanner}>
            <Ionicons name="people-outline" size={12} color={Colors.primary} />
            <Text style={styles.dependentText}>
              Booked by {bookedByName} (Dependent)
            </Text>
          </View>
        ) : null}

        {phone ? (
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={13} color={Colors.inkMuted48} />
            <Text style={styles.metaText}>{phone}</Text>
          </View>
        ) : null}

        {reason ? (
          <View style={styles.reasonBlock}>
            <Text style={styles.reasonLabel}>Chief Complaint / Symptoms:</Text>
            <Text style={styles.reasonText} numberOfLines={2}>
              {reason}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {isActiveConsultation ? (
          <>
            {/* Open Consultation Room */}
            <TouchableOpacity
              style={styles.openConsultationBtn}
              onPress={() => onOpenConsultation && onOpenConsultation(appointment)}
              activeOpacity={0.8}
            >
              <Ionicons name="clipboard-outline" size={16} color={Colors.inkWhite} />
              <Text style={styles.openConsultationBtnText}>Open Consultation Room</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.inkWhite} />
            </TouchableOpacity>

            {/* Hold Button */}
            {onHold ? (
              <TouchableOpacity
                style={styles.holdBtn}
                onPress={() => onHold(appointment)}
                disabled={isProcessingAction}
                activeOpacity={0.75}
              >
                {isProcessingAction && processingActionType === 'HOLD' ? (
                  <ActivityIndicator size="small" color={Colors.warningDark} />
                ) : (
                  <>
                    <Ionicons name="pause-circle-outline" size={16} color={Colors.warningDark} />
                    <Text style={styles.holdBtnText}>Hold</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </>
        ) : isCompleted ? (
          <TouchableOpacity
            style={styles.reviewConsultationBtn}
            onPress={() => onOpenConsultation && onOpenConsultation(appointment)}
            activeOpacity={0.75}
          >
            <Ionicons name="eye-outline" size={15} color={Colors.primary} />
            <Text style={styles.reviewConsultationBtnText}>View Encounter Record</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Call to Cabin */}
            {onCallToCabin ? (
              <TouchableOpacity
                style={styles.callToCabinBtn}
                onPress={() => onCallToCabin(appointment)}
                disabled={isProcessingAction}
                activeOpacity={0.85}
              >
                {isProcessingAction && processingActionType === 'CALL' ? (
                  <ActivityIndicator size="small" color={Colors.inkWhite} />
                ) : (
                  <>
                    <Ionicons name="megaphone-outline" size={16} color={Colors.inkWhite} />
                    <Text style={styles.callToCabinBtnText}>Call to Cabin</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            {/* Direct Open Consultation Option */}
            {onOpenConsultation ? (
              <TouchableOpacity
                style={styles.quickOpenBtn}
                onPress={() => onOpenConsultation(appointment)}
                activeOpacity={0.75}
              >
                <Ionicons name="open-outline" size={16} color={Colors.primary} />
                <Text style={styles.quickOpenBtnText}>Consult</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.hairline,
    marginBottom: Spacing.three,
    ...Shadows.card,
  },
  activeConsultationCard: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#fbfdff',
  },
  completedCard: {
    opacity: 0.9,
    backgroundColor: '#fafafc',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  tokenPill: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  tokenText: {
    ...Typography.headline,
    fontWeight: '800',
    color: Colors.ink,
  },
  activeTokenText: {
    color: Colors.primary,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inConsultationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0fa',
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    gap: 6,
    borderWidth: 1,
    borderColor: '#cce0f5',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  inConsultationBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eafaf1',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 5,
    borderWidth: 1,
    borderColor: '#c2f0d4',
  },
  checkedInDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  checkedInBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.successDark,
  },
  notCheckedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  notCheckedInBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.inkMuted48,
  },
  patientInfoBlock: {
    marginBottom: Spacing.three,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  patientNameText: {
    ...Typography.headline,
    color: Colors.ink,
    fontWeight: '700',
  },
  ageGenderText: {
    ...Typography.subheadline,
    color: Colors.inkMuted48,
  },
  dependentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  dependentText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    ...Typography.footnote,
    color: Colors.inkMuted48,
  },
  reasonBlock: {
    marginTop: 4,
    padding: Spacing.two,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
  },
  reasonLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.inkMuted48,
    marginBottom: 2,
  },
  reasonText: {
    ...Typography.footnote,
    color: Colors.ink,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  callToCabinBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
  },
  callToCabinBtnText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
  quickOpenBtn: {
    minHeight: TouchTarget.minHeight,
    minWidth: 80,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
  },
  quickOpenBtnText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.primary,
  },
  openConsultationBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
  },
  openConsultationBtnText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
  holdBtn: {
    minHeight: TouchTarget.minHeight,
    minWidth: 80,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
  },
  holdBtnText: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.warningDark,
  },
  reviewConsultationBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reviewConsultationBtnText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.primary,
  },
});
