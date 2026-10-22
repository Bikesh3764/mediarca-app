import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants/theme';

export interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'parchment' | 'dark' | 'outline';
  elevated?: boolean;
  padding?: number;
  onPress?: () => void;
  activeOpacity?: number;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  variant = 'default',
  elevated = false,
  padding = Spacing.four,
  onPress,
  activeOpacity = 0.85,
}) => {
  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    variant === 'default' && styles.variantDefault,
    variant === 'parchment' && styles.variantParchment,
    variant === 'dark' && styles.variantDark,
    variant === 'outline' && styles.variantOutline,
    elevated ? Shadows.cardElevated : Shadows.card,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  variantDefault: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  variantParchment: {
    backgroundColor: Colors.canvasParchment,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  variantDark: {
    backgroundColor: Colors.surfaceDark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2c2c2e',
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
});
