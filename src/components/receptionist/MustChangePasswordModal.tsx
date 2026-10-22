import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { validatePasswordChange } from '@/services/receptionistUtils';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export interface MustChangePasswordModalProps {
  visible: boolean;
  onSuccess?: () => void;
}

export const MustChangePasswordModal: React.FC<MustChangePasswordModalProps> = ({
  visible,
  onSuccess,
}) => {
  const { user, updateUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    const validation = validatePasswordChange(currentPassword, newPassword, confirmPassword);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.changeReceptionistPassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      const userToUpdate = res?.user || res?.data?.user || (user ? { ...user, mustChangePassword: false } : null);
      if (userToUpdate) {
        await updateUser({ ...userToUpdate, mustChangePassword: false });
      }

      Alert.alert(
        'Password Updated',
        'Your receptionist account password has been updated successfully. Desk operations are now unlocked.',
        [
          {
            text: 'Access Desk',
            onPress: () => {
              onSuccess?.();
            },
          },
        ]
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update password. Verify your temporary password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to change your temporary password upon next sign-in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => {
        // Prevent dismissal on Android back button: must change password or sign out
      }}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={styles.card}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Security Shield Icon */}
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
              </View>

              <Text style={styles.title}>Update Temporary Password</Text>
              <Text style={styles.subtitle}>
                Your clinic administrator provided a temporary password. To secure clinical records and patient data, please set a new personal password before accessing the front desk terminal.
              </Text>

              {/* Current Temporary Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Temporary Password</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showCurrent}
                    placeholder="Enter temporary password"
                    placeholderTextColor={Colors.inkMuted48}
                    value={currentPassword}
                    onChangeText={(t) => {
                      setCurrentPassword(t);
                      setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowCurrent((prev) => !prev)}
                  >
                    <Ionicons
                      name={showCurrent ? 'eye-off' : 'eye'}
                      size={20}
                      color={Colors.inkMuted48}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password (min 8 characters)</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showNew}
                    placeholder="Enter at least 8 characters"
                    placeholderTextColor={Colors.inkMuted48}
                    value={newPassword}
                    onChangeText={(t) => {
                      setNewPassword(t);
                      setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowNew((prev) => !prev)}
                  >
                    <Ionicons
                      name={showNew ? 'eye-off' : 'eye'}
                      size={20}
                      color={Colors.inkMuted48}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showNew}
                    placeholder="Re-enter new password"
                    placeholderTextColor={Colors.inkMuted48}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Error Message */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Submit CTA */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.inkWhite} />
                ) : (
                  <>
                    <Ionicons name="lock-open-outline" size={18} color={Colors.inkWhite} />
                    <Text style={styles.submitBtnText}>Update & Unlock Desk</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Cancel / Sign Out Option */}
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOut}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.signOutBtnText}>Sign Out Instead</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    maxHeight: '90%',
    ...Shadows.modal,
  },
  scrollContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.title2,
    fontWeight: '700',
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted80,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkMuted80,
    marginBottom: 4,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.input,
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.sm,
    minHeight: TouchTarget.minHeight,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    color: Colors.ink,
    minHeight: TouchTarget.minHeight,
  },
  eyeBtn: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#feeceb',
    borderWidth: 1,
    borderColor: '#f5c6cb',
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.danger,
    fontWeight: '500',
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    gap: 8,
    marginTop: Spacing.xs,
  },
  submitBtnText: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
  signOutBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 8,
  },
  signOutBtnText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.danger,
    fontWeight: '600',
  },
});
