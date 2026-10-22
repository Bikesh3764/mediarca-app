import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  dismissKeyboardOnTap?: boolean;
  keyboardVerticalOffset?: number;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  dismissKeyboardOnTap = true,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 20,
}) => {
  const insets = useSafeAreaInsets();

  const containerPadding = {
    paddingTop: Math.max(insets.top, Spacing.four),
    paddingBottom: Math.max(insets.bottom, Spacing.four),
    paddingLeft: Math.max(insets.left, Spacing.four),
    paddingRight: Math.max(insets.right, Spacing.four),
  };

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        containerPadding,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
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
      {dismissKeyboardOnTap ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.innerWrapper}>{children}</View>
        </TouchableWithoutFeedback>
      ) : (
        children
      )}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, containerPadding, contentContainerStyle]}>
      {dismissKeyboardOnTap ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.innerWrapper}>{children}</View>
        </TouchableWithoutFeedback>
      ) : (
        children
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {content}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasParchment,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
  innerWrapper: {
    flex: 1,
  },
});
