import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography, TouchTarget } from '@/constants/theme';

export interface AppInputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string | null;
  prefixBadge?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  isPassword?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  helperText,
  error,
  prefixBadge,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  isPassword = false,
  secureTextEntry,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const effectiveSecure = isPassword ? !showPassword : secureTextEntry;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {prefixBadge ? (
          <View style={styles.prefixBadge}>
            <Text style={styles.prefixBadgeText}>{prefixBadge}</Text>
          </View>
        ) : null}

        {leftIcon ? <View style={styles.iconContainer}>{leftIcon}</View> : null}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={Colors.inkMuted48}
          secureTextEntry={effectiveSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...restProps}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.actionIconContainer}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.inkMuted48}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconContainer}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: Spacing.four,
  },
  label: {
    ...Typography.subheadline,
    fontWeight: '600',
    color: Colors.ink,
    marginBottom: Spacing.two,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.md,
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.three,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#fffcfc',
  },
  prefixBadge: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  prefixBadgeText: {
    ...Typography.bodyBold,
    color: Colors.ink,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  actionIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.one,
    minWidth: 32,
    minHeight: 32,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.ink,
    minHeight: TouchTarget.minHeight,
    paddingVertical: Spacing.two,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
    gap: 4,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    fontWeight: '500',
  },
  helperText: {
    ...Typography.caption,
    color: Colors.inkMuted48,
    marginTop: Spacing.one,
  },
});
