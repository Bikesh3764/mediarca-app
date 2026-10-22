import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';

export type AppBadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'role';

export interface AppBadgeProps {
  label: string;
  variant?: AppBadgeVariant;
  role?: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'CLINIC' | 'ADMIN';
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md';
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant = 'primary',
  role,
  showDot = false,
  style,
  textStyle,
  size = 'md',
}) => {
  // Resolve color palette
  let bg: string = Colors.primaryLight;
  let text: string = Colors.primary;
  let dotColor: string = Colors.primary;

  if (role) {
    switch (role) {
      case 'PATIENT':
        bg = '#e6f0fa';
        text = '#0066cc';
        dotColor = '#0066cc';
        break;
      case 'DOCTOR':
        bg = '#eafaf1';
        text = '#248a3d';
        dotColor = '#34c759';
        break;
      case 'RECEPTIONIST':
        bg = '#fff8eb';
        text = '#b26a00';
        dotColor = '#ff9500';
        break;
      case 'CLINIC':
        bg = '#f3e8ff';
        text = '#6b21a8';
        dotColor = '#9333ea';
        break;
      case 'ADMIN':
        bg = '#f1f5f9';
        text = '#0f172a';
        dotColor = '#334155';
        break;
    }
  } else {
    switch (variant) {
      case 'success':
        bg = Colors.successLight;
        text = Colors.successDark;
        dotColor = Colors.success;
        break;
      case 'warning':
        bg = Colors.warningLight;
        text = Colors.warningDark;
        dotColor = Colors.warning;
        break;
      case 'danger':
        bg = Colors.dangerLight;
        text = Colors.dangerDark;
        dotColor = Colors.danger;
        break;
      case 'neutral':
        bg = '#f0f0f3';
        text = Colors.inkMuted80;
        dotColor = Colors.inkMuted48;
        break;
      case 'primary':
      default:
        bg = Colors.primaryLight;
        text = Colors.primary;
        dotColor = Colors.primary;
        break;
    }
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'sm' && styles.sizeSm,
        style,
      ]}
    >
      {showDot ? (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      ) : null}
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'sm' && styles.textSm,
          textStyle,
        ]}
        numberOfLines={1}
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
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  sizeSm: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    ...Typography.captionBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  textSm: {
    fontSize: 10,
    lineHeight: 12,
  },
});
