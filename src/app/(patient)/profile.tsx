import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { api, User } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  validateAccountDeletionConfirmation,
  getRegulatoryRetentionDisclosure,
} from '@/services/adminClinicUtils';
import { isValidIndianPhone, formatIndianPhone } from '@/utils/phoneUtils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function PatientProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(
    user?.phone ? user.phone.replace(/^\+91\s*/, '') : ''
  );
  const [bloodGroup, setBloodGroup] = useState(user?.patientProfile?.bloodGroup || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.patientProfile?.dateOfBirth ? String(user.patientProfile.dateOfBirth).split('T')[0] : ''
  );
  const [gender, setGender] = useState(user?.patientProfile?.gender || 'Male');
  const [emergencyContact, setEmergencyContact] = useState(
    user?.patientProfile?.emergencyContact || ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone ? user.phone.replace(/^\+91\s*/, '') : '');
      setBloodGroup(user.patientProfile?.bloodGroup || '');
      setDateOfBirth(
        user.patientProfile?.dateOfBirth ? String(user.patientProfile.dateOfBirth).split('T')[0] : ''
      );
      setGender(user.patientProfile?.gender || 'Male');
      setEmergencyContact(user.patientProfile?.emergencyContact || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (phone.trim()) {
      if (!isValidIndianPhone(phone.trim())) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const formattedPhone = phone.trim() ? formatIndianPhone(phone.trim()) : undefined;
      const updatedUser = await api.updateUserProfile({
        fullName: fullName.trim(),
        phone: formattedPhone,
        bloodGroup,
        dateOfBirth: dateOfBirth || undefined,
        gender,
        emergencyContact: emergencyContact.trim(),
      });

      if (updatedUser) {
        updateUser(updatedUser);
      }
      setSuccessMessage('Profile details saved successfully.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleConfirmAccountDeletion = async () => {
    setDeleteError(null);
    const validation = validateAccountDeletionConfirmation(deleteConfirmationText);
    if (!validation.isValid) {
      setDeleteError(validation.error || 'Please type DELETE to confirm.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await api.requestAccountDeletion({
        confirmation: 'DELETE',
        reason: 'Patient self-service request from mobile app',
      });

      setShowDeleteModal(false);
      Alert.alert(
        'Account Deletion Requested',
        `${res.message}\n\n${res.retentionNotice}`,
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to process account deletion. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  const retentionDisclosure = getRegulatoryRetentionDisclosure();

  return (
    <SafeAreaViewContainer scrollable>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.inkDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.contentContainer}>
        {/* User Identity Avatar Banner */}
        <View style={styles.identityCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {fullName ? fullName[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.identityTextCol}>
            <Text style={styles.identityName}>{fullName || 'Patient User'}</Text>
            <Text style={styles.identityEmail}>{user?.email || 'patient@mediarca.in'}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>Verified Patient Account</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        {successMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.successBannerText}>{successMessage}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Personal Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="person-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor={Colors.inkSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Phone Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                placeholderTextColor={Colors.inkSecondary}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address (Read-only)</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email || ''}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact (Name & Phone)</Text>
            <TextInput
              style={styles.input}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="e.g. Suman (Spouse) - 98765 43210"
              placeholderTextColor={Colors.inkSecondary}
            />
          </View>
        </View>

        {/* Health Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="fitness-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Health Details</Text>
          </View>

          {/* Gender Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, gender === g && styles.chipActive]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Blood Group Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blood Group</Text>
            <View style={styles.chipRow}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.bloodChip, bloodGroup === bg && styles.chipActive]}
                  onPress={() => setBloodGroup(bg)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, bloodGroup === bg && styles.chipTextActive]}>
                    {bg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="e.g. 1992-05-18"
              placeholderTextColor={Colors.inkSecondary}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.inkWhite} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Legal & Compliance Links */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal & Compliance</Text>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/legal/terms')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.inkSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/legal/privacy')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>Privacy Policy & Data Disclosures</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.inkSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/legal/refund')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>Cancellation & Refund Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.inkSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/legal/about')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>About MediArca</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.inkSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/legal/contact')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>Contact & Help Center</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.inkSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.signOutButtonText}>Sign Out from Device</Text>
        </TouchableOpacity>

        {/* Danger Zone: Account Deletion (Google Play Compliance) */}
        <View style={styles.dangerZoneCard}>
          <View style={styles.dangerHeaderRow}>
            <Ionicons name="warning-outline" size={20} color={Colors.danger} />
            <Text style={styles.dangerTitle}>Danger Zone • Account Removal</Text>
          </View>
          <Text style={styles.dangerDescription}>
            Under Google Play Developer Policies and Indian data protection standards, you have the right to request deletion of your account and personal identifiers.
          </Text>

          <TouchableOpacity
            style={styles.deleteAccountTrigger}
            onPress={() => {
              setDeleteConfirmationText('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            <Text style={styles.deleteAccountTriggerText}>
              Request Account Deletion & Data Removal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Deletion Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.warningCircle}>
                <Ionicons name="alert" size={24} color={Colors.danger} />
              </View>
              <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Ionicons name="close" size={20} color={Colors.inkDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalWarningNotice}>
                This action is irreversible. Please read the data removal disclosures below carefully before proceeding:
              </Text>

              {/* Data Deleted List */}
              <View style={styles.dataRemovalBox}>
                <Text style={styles.dataRemovalHeader}>What will be permanently deleted:</Text>
                {retentionDisclosure.dataDeleted.map((item, idx) => (
                  <Text key={idx} style={styles.dataRemovalItem}>• {item}</Text>
                ))}
              </View>

              {/* Statutory Retention Notice */}
              <View style={styles.retentionNoticeBox}>
                <Text style={styles.retentionNoticeHeader}>
                  Statutory Medical Record Retention Disclosure:
                </Text>
                <Text style={styles.retentionNoticeText}>
                  {retentionDisclosure.statutoryBasis}
                </Text>
                <Text style={[styles.retentionNoticeText, { marginTop: 6 }]}>
                  Clinical consultation records and vitals created with doctors are archived for {retentionDisclosure.retentionPeriodYears} years and cannot be retroactively destroyed under law.
                </Text>
              </View>

              {/* Confirmation Input */}
              <View style={styles.confirmationInputBlock}>
                <Text style={styles.confirmationPrompt}>
                  To confirm, type <Text style={{ fontWeight: '700', color: Colors.danger }}>DELETE</Text> in uppercase letters:
                </Text>
                <TextInput
                  style={[styles.input, deleteError ? styles.inputError : null]}
                  value={deleteConfirmationText}
                  onChangeText={(t) => {
                    setDeleteConfirmationText(t);
                    if (deleteError) setDeleteError(null);
                  }}
                  placeholder="Type DELETE to confirm"
                  placeholderTextColor={Colors.inkSecondary}
                  autoCapitalize="characters"
                />
                {deleteError ? (
                  <Text style={styles.fieldError}>{deleteError}</Text>
                ) : null}
              </View>

              {/* Modal Action Buttons */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.cancelModalButton}
                  onPress={() => setShowDeleteModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelModalButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmDeleteButton, isDeleting && { opacity: 0.6 }]}
                  onPress={handleConfirmAccountDeletion}
                  disabled={isDeleting}
                  activeOpacity={0.85}
                >
                  {isDeleting ? (
                    <ActivityIndicator color={Colors.inkWhite} size="small" />
                  ) : (
                    <Text style={styles.confirmDeleteButtonText}>Permanently Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaViewContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.canvasPure,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
  },
  backButton: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.canvasParchment,
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.inkDark,
    fontWeight: '600',
  },
  headerSpacer: {
    width: TouchTarget.minSize,
  },
  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    ...Typography.title2,
    color: Colors.inkWhite,
    fontWeight: '700',
  },
  identityTextCol: {
    flex: 1,
  },
  identityName: {
    ...Typography.title3,
    fontWeight: '700',
    color: Colors.inkDark,
  },
  identityEmail: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  rolePill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  rolePillText: {
    ...Typography.caption2,
    color: Colors.success,
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  successBannerText: {
    ...Typography.footnote,
    color: Colors.success,
    fontWeight: '500',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  errorBannerText: {
    ...Typography.footnote,
    color: Colors.danger,
    fontWeight: '500',
    flex: 1,
  },
  card: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.headline,
    fontWeight: '600',
    color: Colors.inkDark,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.inkDark,
    marginBottom: Spacing.xs,
  },
  input: {
    minHeight: TouchTarget.minSize,
    borderWidth: 1,
    borderColor: Colors.borderField,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    color: Colors.inkDark,
    backgroundColor: Colors.canvasPure,
  },
  inputDisabled: {
    backgroundColor: Colors.canvasParchment,
    color: Colors.inkSecondary,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeBox: {
    minHeight: TouchTarget.minSize,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderField,
    borderRightWidth: 0,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
    backgroundColor: Colors.canvasParchment,
  },
  countryCodeText: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.inkDark,
  },
  phoneInput: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    borderWidth: 1,
    borderColor: Colors.borderField,
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    color: Colors.inkDark,
    backgroundColor: Colors.canvasPure,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.canvasParchment,
  },
  bloodChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    minWidth: 44,
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.canvasParchment,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipText: {
    ...Typography.footnote,
    color: Colors.inkDark,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.inkWhite,
    fontWeight: '600',
  },
  saveButton: {
    minHeight: TouchTarget.minSize,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.inkWhite,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
    minHeight: TouchTarget.minSize,
  },
  menuText: {
    ...Typography.subhead,
    color: Colors.inkDark,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: TouchTarget.minSize,
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    ...Shadows.sm,
  },
  signOutButtonText: {
    ...Typography.subhead,
    color: Colors.danger,
    fontWeight: '600',
  },
  dangerZoneCard: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    ...Shadows.sm,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  dangerTitle: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.danger,
  },
  dangerDescription: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  deleteAccountTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: BorderRadius.pill,
    minHeight: TouchTarget.minSize,
    paddingHorizontal: Spacing.md,
  },
  deleteAccountTriggerText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  warningCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  modalTitle: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.inkDark,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginVertical: Spacing.xs,
  },
  modalWarningNotice: {
    ...Typography.footnote,
    color: Colors.inkDark,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  dataRemovalBox: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dataRemovalHeader: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.inkDark,
    marginBottom: 4,
  },
  dataRemovalItem: {
    ...Typography.caption2,
    color: Colors.inkSecondary,
    lineHeight: 16,
  },
  retentionNoticeBox: {
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.25)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  retentionNoticeHeader: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.warning,
    marginBottom: 2,
  },
  retentionNoticeText: {
    ...Typography.caption2,
    color: Colors.inkDark,
    lineHeight: 16,
  },
  confirmationInputBlock: {
    marginBottom: Spacing.md,
  },
  confirmationPrompt: {
    ...Typography.footnote,
    color: Colors.inkDark,
    marginBottom: Spacing.xs,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  fieldError: {
    ...Typography.caption1,
    color: Colors.danger,
    marginTop: 4,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelModalButton: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButtonText: {
    ...Typography.subhead,
    color: Colors.inkDark,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteButtonText: {
    ...Typography.subhead,
    color: Colors.inkWhite,
    fontWeight: '600',
  },
});
