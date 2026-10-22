import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, TouchTarget } from '@/constants/theme';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'google';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles: StyleProp<ViewStyle> = [
    styles.base,
    styles[variant],
    size === 'sm' && styles.sizeSm,
    size === 'md' && styles.sizeMd,
    size === 'lg' && styles.sizeLg,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles: StyleProp<TextStyle> = [
    styles.textBase,
    styles[`${variant}Text` as keyof typeof styles],
    size === 'sm' && styles.textSm,
    size === 'md' && styles.textMd,
    size === 'lg' && styles.textLg,
    isDisabled && styles.disabledText,
    textStyle,
  ];

  const spinnerColor =
    variant === 'primary' || variant === 'danger'
      ? Colors.inkWhite
      : Colors.primary;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? (
            <View style={styles.iconLeft}>{icon}</View>
          ) : null}
          <Text style={textStyles} numberOfLines={1}>
            {title}
          </Text>
          {icon && iconPosition === 'right' ? (
            <View style={styles.iconRight}>{icon}</View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: TouchTarget.minHeight,
    minWidth: TouchTarget.minWidth,
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.two,
  },
  iconRight: {
    marginLeft: Spacing.two,
  },

  // Sizes
  sizeSm: {
    minHeight: TouchTarget.minHeight,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  sizeMd: {
    minHeight: 48,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
  },
  sizeLg: {
    minHeight: 54,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.seven,
  },

  // Text Sizes
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSm: {
    fontSize: 14,
    lineHeight: 18,
  },
  textMd: {
    ...Typography.bodyBold,
  },
  textLg: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  primaryText: {
    color: Colors.inkWhite,
  },

  secondary: {
    backgroundColor: Colors.primaryLight,
  },
  secondaryText: {
    color: Colors.primary,
  },

  outline: {
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  outlineText: {
    color: Colors.ink,
  },

  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: Colors.primary,
  },

  danger: {
    backgroundColor: Colors.danger,
  },
  dangerText: {
    color: Colors.inkWhite,
  },

  google: {
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  googleText: {
    color: Colors.ink,
    fontWeight: '600',
  },

  // Disabled State
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
});
