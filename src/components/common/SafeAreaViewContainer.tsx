import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ViewStyle,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

export interface SafeAreaViewContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  backgroundColor?: string;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

/**
 * Standard SafeArea Layout Wrapper adhering to Apple HIG & Android Play Store specifications.
 * Ensures consistent parchment canvas (#f5f5f7), safe notch and bottom home indicator margins.
 */
export const SafeAreaViewContainer: React.FC<SafeAreaViewContainerProps> = ({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  backgroundColor = Colors.canvasParchment,
  edges = ['top', 'left', 'right', 'bottom'],
}) => {
  const insets: EdgeInsets = useSafeAreaInsets();

  const containerContent = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }, style]}
      edges={edges}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {containerContent}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
