import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDisplayPhone, toTelUri } from '@/utils/phoneUtils';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';

interface ReceptionistCallCardProps {
  receptionistName: string;
  receptionistPhone?: string | null;
  status: string;
  estToken?: number;
  officialToken?: number;
  isShiftPassed?: boolean;
}

export const ReceptionistCallCard: React.FC<ReceptionistCallCardProps> = ({
  receptionistName,
  receptionistPhone,
  status,
  estToken = 1,
  officialToken = 1,
  isShiftPassed = false,
}) => {
  const handleDial = () => {
    if (!receptionistPhone) return;
    const uri = toTelUri(receptionistPhone);
    Linking.openURL(uri).catch((err) => {
      console.warn('Could not launch phone dialer:', err);
    });
  };

  // 1. Pending Approval Card (Zero Upfront Pay-to-Receptionist Flow)
  if (status === 'PENDING_APPROVAL') {
    return (
      <View style={[styles.container, styles.pendingContainer]}>
        <View style={styles.headerRow}>
          <Ionicons name="time-outline" size={18} color={Colors.inkMuted80} style={styles.iconMargin} />
          <Text style={styles.titleText}>
            Desk Confirmation Pending • Estimated #{estToken}
          </Text>
        </View>

        <Text style={styles.receptionistNameText}>
          Reception Desk: <Text style={styles.boldText}>{receptionistName}</Text>
        </Text>

        <Text style={styles.descriptionText}>
          Call receptionist directly to coordinate desk fee payment (UPI over call) or pay in-person upon arrival to lock your confirmed token.
        </Text>

        {receptionistPhone ? (
          <TouchableOpacity
            style={styles.callButtonPrimary}
            onPress={handleDial}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={16} color={Colors.inkWhite} style={styles.btnIcon} />
            <Text style={styles.callButtonPrimaryText} numberOfLines={1}>
              Call Receptionist ({formatDisplayPhone(receptionistPhone)})
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noPhoneNotice}>
            <Text style={styles.noPhoneNoticeText}>
              Pay in-person at clinic reception desk
            </Text>
          </View>
        )}
      </View>
    );
  }

  // 2. Doctor Shift Concluded Notice for Confirmed WAITING patients
  if (status === 'WAITING' && isShiftPassed) {
    return (
      <View style={[styles.container, styles.warningContainer]}>
        <View style={styles.headerRow}>
          <Ionicons name="time" size={18} color={Colors.warningDark} style={styles.iconMargin} />
          <Text style={styles.warningTitleText}>
            Shift Concluded • Token #{officialToken} Valid
          </Text>
        </View>

        <Text style={styles.descriptionText}>
          If your doctor is consulting overtime, please stay nearby in the waiting area. Otherwise, call reception to reschedule or shift your token.
        </Text>

        {receptionistPhone && (
          <TouchableOpacity
            style={styles.callButtonWarning}
            onPress={handleDial}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={16} color={Colors.inkWhite} style={styles.btnIcon} />
            <Text style={styles.callButtonPrimaryText} numberOfLines={1}>
              Contact Reception ({formatDisplayPhone(receptionistPhone)})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 3. Confirmed WAITING or Standard Receptionist coordination
  if (receptionistPhone) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactInfoCol}>
          <View style={styles.compactHeaderRow}>
            <Ionicons name="business-outline" size={16} color={Colors.primary} style={styles.iconMargin} />
            <Text style={styles.compactTitleText} numberOfLines={1}>
              {receptionistName}
            </Text>
          </View>
          <Text style={styles.compactPhoneText}>
            {formatDisplayPhone(receptionistPhone)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.compactCallButton}
          onPress={handleDial}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={14} color={Colors.primary} style={styles.btnIcon} />
          <Text style={styles.compactCallButtonText}>Call Desk</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.card,
    padding: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    marginTop: Spacing.three,
  },
  pendingContainer: {
    backgroundColor: Colors.canvasParchment,
  },
  warningContainer: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  iconMargin: {
    marginRight: 6,
  },
  titleText: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 13,
  },
  warningTitleText: {
    ...Typography.bodyBold,
    color: Colors.warningDark,
    fontSize: 13,
  },
  receptionistNameText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.ink,
  },
  descriptionText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  callButtonPrimary: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    ...Shadows.card,
  },
  callButtonWarning: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.warningDark,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    ...Shadows.card,
  },
  btnIcon: {
    marginRight: 6,
  },
  callButtonPrimaryText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
    fontSize: 13,
  },
  noPhoneNotice: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  noPhoneNoticeText: {
    ...Typography.caption,
    color: Colors.inkMuted48,
    fontStyle: 'italic',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    marginTop: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  compactInfoCol: {
    flex: 1,
    marginRight: Spacing.two,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactTitleText: {
    ...Typography.captionBold,
    color: Colors.ink,
    fontSize: 12,
  },
  compactPhoneText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    fontSize: 11,
    marginTop: 2,
  },
  compactCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  compactCallButtonText: {
    ...Typography.captionBold,
    color: Colors.primary,
    fontSize: 12,
  },
});
