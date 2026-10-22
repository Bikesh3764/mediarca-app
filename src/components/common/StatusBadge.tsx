import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../constants/theme';

export type CabinStatus = 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN' | string;
export type AppointmentStatus =
  | 'PENDING_APPROVAL'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | string;

export interface StatusBadgeProps {
  status: CabinStatus | AppointmentStatus;
  type?: 'cabin' | 'appointment' | 'token';
  customLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * High-contrast semantic status pill
 * Communicates cabin presence and appointment states with instant clarity.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'cabin',
  customLabel,
  style,
  textStyle,
}) => {
  let backgroundColor: string = Colors.canvasParchment;
  let textColor: string = Colors.inkMuted80;
  let dotColor: string = Colors.inkMuted48;
  let label = customLabel || status;

  if (type === 'cabin') {
    switch (status) {
      case 'IN_CABIN':
        backgroundColor = Colors.successLight;
        textColor = Colors.successDark;
        dotColor = Colors.success;
        label = customLabel || 'In Cabin';
        break;
      case 'STEPPED_OUT':
        backgroundColor = Colors.warningLight;
        textColor = Colors.warningDark;
        dotColor = Colors.warning;
        label = customLabel || 'Stepped Out';
        break;
      case 'NOT_IN_CABIN':
      default:
        backgroundColor = '#f2f2f7';
        textColor = Colors.inkMuted48;
        dotColor = Colors.inkMuted48;
        label = customLabel || 'Not in Cabin';
        break;
    }
  } else if (type === 'appointment') {
    switch (status) {
      case 'WAITING':
        backgroundColor = Colors.primaryLight;
        textColor = Colors.primaryDark;
        dotColor = Colors.primary;
        label = customLabel || 'In Waiting Queue';
        break;
      case 'IN_CONSULTATION':
        backgroundColor = Colors.successLight;
        textColor = Colors.successDark;
        dotColor = Colors.success;
        label = customLabel || 'In Consultation';
        break;
      case 'PENDING_APPROVAL':
        backgroundColor = Colors.warningLight;
        textColor = Colors.warningDark;
        dotColor = Colors.warning;
        label = customLabel || 'Pending Desk Approval';
        break;
      case 'COMPLETED':
        backgroundColor = '#eef7ed';
        textColor = '#2e7d32';
        dotColor = '#2e7d32';
        label = customLabel || 'Completed';
        break;
      case 'CANCELLED':
        backgroundColor = Colors.dangerLight;
        textColor = Colors.dangerDark;
        dotColor = Colors.danger;
        label = customLabel || 'Cancelled';
        break;
    }
  } else if (type === 'token') {
    backgroundColor = Colors.surfaceDark;
    textColor = Colors.inkWhite;
    dotColor = Colors.primary;
  }

  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      {type !== 'token' && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text style={[styles.text, { color: textColor }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    ...Typography.captionBold,
  },
});
