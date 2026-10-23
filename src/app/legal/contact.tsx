import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { api } from '@/services/api';
import { validateContactMessage } from '@/services/adminClinicUtils';
import { useAuth } from '@/context/AuthContext';
import { formatIndianPhone } from '@/utils/phoneUtils';

export default function ContactUsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace(/^\+91\s*/, '') : '');
  const [subject, setSubject] = useState('General Feedback');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setServerError(null);
    const trimmedPhone = phone ? phone.trim() : '';
    const formattedPhone = trimmedPhone ? formatIndianPhone(trimmedPhone) : undefined;

    const validation = validateContactMessage({
      fullName,
      email,
      phone: formattedPhone,
      subject,
      message,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      await api.sendContactMessage({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: formattedPhone,
        subject: subject.trim(),
        message: message.trim(),
      });
      setIsSuccess(true);
      setMessage('');
    } catch (err: any) {
      setServerError(err?.message || 'Failed to send message. Please email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectEmail = () => {
    Linking.openURL('mailto:contact@mediarca.in?subject=MediArca Inquiry');
  };

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
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.contentContainer}>
        {/* Support Direct Banner */}
        <View style={styles.directSupportCard}>
          <View style={styles.directSupportIcon}>
            <Ionicons name="mail" size={20} color={Colors.primary} />
          </View>
          <View style={styles.directSupportTextCol}>
            <Text style={styles.directSupportLabel}>Direct Email Support</Text>
            <TouchableOpacity onPress={handleDirectEmail} activeOpacity={0.7}>
              <Text style={styles.directSupportEmail}>contact@mediarca.in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isSuccess ? (
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Message Received!</Text>
            <Text style={styles.successBody}>
              Thank you for reaching out. Our clinical support and platform governance team will review your inquiry and respond to {email} within 24 hours.
            </Text>
            <TouchableOpacity
              style={styles.anotherMessageButton}
              onPress={() => setIsSuccess(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.anotherMessageText}>Send Another Message</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.formTitle}>Send Us a Message</Text>
            <Text style={styles.formSubtitle}>
              Have an issue with your OPD pass, doctor profile, or clinic setup? Tell us below.
            </Text>

            {serverError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={Colors.inkSecondary}
                autoCapitalize="words"
              />
              {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="e.g. rahul@example.com"
                placeholderTextColor={Colors.inkSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Phone (Optional)</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, errors.phone && styles.inputError]}
                  value={phone}
                  onChangeText={(text) => {
                    const clean = text.replace(/\D/g, '').slice(0, 10);
                    setPhone(clean);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="98765 43210"
                  placeholderTextColor={Colors.inkSecondary}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
              {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}
            </View>

            {/* Subject Choices */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject *</Text>
              <View style={styles.subjectChipsRow}>
                {['General Feedback', 'Queue Issue', 'Doctor Onboarding', 'Clinic License'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.subjectChip, subject === item && styles.subjectChipActive]}
                    onPress={() => setSubject(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.subjectChipText,
                        subject === item && styles.subjectChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Message Body */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.textArea, errors.message && styles.inputError]}
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
                }}
                placeholder="Describe your inquiry or feedback in detail (at least 10 characters)..."
                placeholderTextColor={Colors.inkSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.message ? <Text style={styles.fieldError}>{errors.message}</Text> : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.inkWhite} size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={Colors.inkWhite} />
                  <Text style={styles.submitButtonText}>Submit Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  directSupportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  directSupportIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directSupportTextCol: {
    flex: 1,
  },
  directSupportLabel: {
    ...Typography.caption1,
    color: Colors.inkSecondary,
    fontWeight: '500',
  },
  directSupportEmail: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  formTitle: {
    ...Typography.title3,
    fontWeight: '700',
    color: Colors.inkDark,
    marginBottom: 4,
  },
  formSubtitle: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    ...Typography.footnote,
    color: Colors.danger,
    flex: 1,
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
  subjectChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  subjectChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.canvasParchment,
  },
  subjectChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  subjectChipText: {
    ...Typography.footnote,
    color: Colors.inkDark,
    fontWeight: '500',
  },
  subjectChipTextActive: {
    color: Colors.inkWhite,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: Colors.borderField,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.inkDark,
    backgroundColor: Colors.canvasPure,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  fieldError: {
    ...Typography.caption1,
    color: Colors.danger,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    minHeight: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...Typography.subhead,
    color: Colors.inkWhite,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  successIconCircle: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    ...Typography.title2,
    fontWeight: '700',
    color: Colors.inkDark,
    marginBottom: Spacing.xs,
  },
  successBody: {
    ...Typography.body,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  anotherMessageButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
  },
  anotherMessageText: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '600',
  },
});
