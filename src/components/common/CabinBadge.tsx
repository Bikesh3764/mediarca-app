import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

export type CabinStatus = 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN';

export interface CabinBadgeProps {
  status?: string | null;
  expectedReturnTime?: string | null;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Apple HIG Real-Time Doctor Cabin Presence Pill
 * Renders In Cabin (Blue), Stepped Out (Amber with return time), Not In Cabin (Gray)
 */
export const CabinBadge: React.FC<CabinBadgeProps> = ({
  status = 'IN_CABIN',
  expectedReturnTime,
  size = 'md',
  style,
  textStyle,
}) => {
  const normalized = ((status || 'IN_CABIN').toUpperCase() as CabinStatus);
  const cleanReturn = expectedReturnTime ? expectedReturnTime.replace(/^~\s*/, '').trim() : '';

  let dotColor: string = Colors.primary;
  let bg: string = '#f5f5f7';
  let border: string = '#e5e5ea';
  let textColor: string = Colors.ink;
  let label: string = 'In Cabin';

  if (normalized === 'STEPPED_OUT') {
    dotColor = '#f59e0b';
    bg = '#fffbeb';
    border = '#fde68a';
    textColor = '#92400e';
    label = cleanReturn ? `Stepped Out • Back ${cleanReturn}` : 'Stepped Out';
  } else if (normalized === 'NOT_IN_CABIN') {
    dotColor = '#8e8e93';
    bg = '#f5f5f7';
    border = '#e5e5ea';
    textColor = '#8e8e93';
    label = 'Not in Cabin';
  } else {
    // IN_CABIN
    dotColor = Colors.primary;
    bg = '#e8f2fc';
    border = '#c7e0f9';
    textColor = Colors.primary;
    label = 'In Cabin';
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        isSmall ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: bg, borderColor: border },
        style,
      ]}
    >
      <View
        style={[
          styles.dot,
          isSmall ? styles.dotSm : styles.dotMd,
          { backgroundColor: dotColor },
        ]}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          isSmall ? styles.textSm : styles.textMd,
          { color: textColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 5,
  },
  badgeMd: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 6,
  },
  dot: {
    borderRadius: BorderRadius.pill,
  },
  dotSm: {
    width: 6,
    height: 6,
  },
  dotMd: {
    width: 7,
    height: 7,
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  textSm: {
    fontSize: 11,
    lineHeight: 14,
  },
  textMd: {
    fontSize: 12,
    lineHeight: 16,
  },
});
