import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '@/context/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppBadge } from '@/components/ui/AppBadge';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  TouchTarget,
} from '@/constants/theme';
import { isValidIndianPhone, sanitizeIndianPhone } from '@/utils/phoneUtils';

const SIGNUP_ROLES: { id: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'PATIENT', label: 'Patient', icon: 'person-outline' },
  { id: 'DOCTOR', label: 'Doctor', icon: 'medkit-outline' },
  { id: 'CLINIC', label: 'Clinic Facility', icon: 'business-outline' },
];

export default function SignupScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ role?: string }>();
  const { signup } = useAuth();

  const initialRole = (searchParams.role?.toUpperCase() as UserRole) || 'PATIENT';
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    initialRole === 'RECEPTIONIST' ? 'PATIENT' : initialRole
  );

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Role-Specific Fields
  const [doctorSpecialty, setDoctorSpecialty] = useState('General Physician');
  const [doctorQualifications, setDoctorQualifications] = useState('MBBS');
  const [doctorConsultationFee, setDoctorConsultationFee] = useState('500');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicCity, setClinicCity] = useState('');
  const [clinicState, setClinicState] = useState('Maharashtra');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    setErrorMessage(null);

    // Common validations
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    const cleanPhone = sanitizeIndianPhone(phone);
    if (!cleanPhone || !isValidIndianPhone(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please agree to the terms and healthcare regulatory policies');
      return;
    }

    // Prepare role-specific payload
    const payload: Record<string, any> = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      password,
      role: selectedRole,
    };

    if (selectedRole === 'DOCTOR') {
      payload.specialty = doctorSpecialty.trim() || 'General Physician';
      payload.qualifications = doctorQualifications.trim() || 'MBBS';
      payload.consultationFee = Number(doctorConsultationFee) || 500;
      payload.experienceYears = 5;
      payload.checkingStartTime = '09:00';
      payload.checkingEndTime = '13:00';
      payload.avgConsultationMinutes = 15;
      payload.maxDailyPatients = 25;
    } else if (selectedRole === 'CLINIC') {
      payload.clinicName = fullName.trim();
      payload.address = clinicAddress.trim() || 'Central Clinic Facility';
      payload.city = clinicCity.trim() || 'Mumbai';
      payload.state = clinicState.trim() || 'Maharashtra';
    } else if (selectedRole === 'PATIENT') {
      payload.gender = patientGender;
    }

    setIsLoading(true);
    try {
      const result = await signup(payload);

      if (result.requiresVerification) {
        Alert.alert(
          'Verification Code Sent',
          `A 6-digit email OTP has been dispatched to ${result.email || email}. Please verify to activate your account.`
        );
        router.push({
          pathname: '/(auth)/verify-otp',
          params: {
            email: result.email || email.trim().toLowerCase(),
            role: selectedRole,
          },
        });
        return;
      }

      Alert.alert('Account Created', 'Welcome to MediArca!');
      router.replace('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header Navigation */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerBarTitle}>Create Account</Text>
          <View style={styles.placeholderButton} />
        </View>

        {/* Role Selector Tabs */}
        <View style={styles.roleTabsWrapper}>
          <Text style={styles.sectionLabel}>CHOOSE YOUR ACCOUNT TYPE</Text>
          <View style={styles.roleTabsContainer}>
            {SIGNUP_ROLES.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.roleTab, isSelected && styles.roleTabSelected]}
                  onPress={() => {
                    setSelectedRole(r.id);
                    setErrorMessage(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={r.icon}
                    size={16}
                    color={isSelected ? Colors.inkWhite : Colors.inkMuted80}
                  />
                  <Text
                    style={[
                      styles.roleTabText,
                      isSelected && styles.roleTabTextSelected,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Main Form Card */}
        <AppCard elevated style={styles.formCard}>
          <View style={styles.cardBadgeRow}>
            <Text style={styles.formCardTitle}>{selectedRole} Registration</Text>
            <AppBadge role={selectedRole} label={selectedRole} size="sm" />
          </View>

          {/* Validation Error Box */}
          {errorMessage ? (
            <View style={styles.errorCallout}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorCalloutText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Common Fields */}
          <AppInput
            label={selectedRole === 'CLINIC' ? 'Clinic Facility Name' : 'Full Name'}
            placeholder={
              selectedRole === 'DOCTOR'
                ? 'Dr. Rajesh Sharma'
                : selectedRole === 'CLINIC'
                ? 'Apex Health Care & Diagnostics'
                : 'Priya Patel'
            }
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            leftIcon={
              <Ionicons
                name={selectedRole === 'CLINIC' ? 'business-outline' : 'person-outline'}
                size={18}
                color={Colors.inkMuted48}
              />
            }
          />

          <AppInput
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            helperText="A 6-digit verification code will be sent to this email."
            leftIcon={
              <Ionicons name="mail-outline" size={18} color={Colors.inkMuted48} />
            }
          />

          <AppInput
            label="Mobile Number"
            placeholder="98200 12345"
            keyboardType="phone-pad"
            maxLength={15}
            value={phone}
            onChangeText={(text) => {
              setPhone(text.replace(/[^\d\s+-]/g, ''));
              setErrorMessage(null);
            }}
            prefixBadge="+91"
            helperText="10-digit Indian phone number"
          />

          {/* Role-Specific Fields: DOCTOR */}
          {selectedRole === 'DOCTOR' ? (
            <View style={styles.roleSpecificBlock}>
              <Text style={styles.roleSubhead}>Medical Credentials</Text>
              <AppInput
                label="Primary Specialty"
                placeholder="General Physician, Cardiologist, etc."
                value={doctorSpecialty}
                onChangeText={setDoctorSpecialty}
              />
              <AppInput
                label="Degrees & Qualifications"
                placeholder="MBBS, MD (Medicine)"
                value={doctorQualifications}
                onChangeText={setDoctorQualifications}
              />
              <AppInput
                label="Standard Consultation Fee (₹)"
                placeholder="500"
                keyboardType="numeric"
                value={doctorConsultationFee}
                onChangeText={setDoctorConsultationFee}
                helperText="Payable by patient at clinic reception counter"
              />
            </View>
          ) : null}

          {/* Role-Specific Fields: CLINIC */}
          {selectedRole === 'CLINIC' ? (
            <View style={styles.roleSpecificBlock}>
              <Text style={styles.roleSubhead}>Facility Location</Text>
              <AppInput
                label="Street Address"
                placeholder="Shop 12, Sunrise Complex, MG Road"
                value={clinicAddress}
                onChangeText={setClinicAddress}
              />
              <AppInput
                label="City"
                placeholder="Mumbai"
                value={clinicCity}
                onChangeText={setClinicCity}
              />
              <AppInput
                label="State / Union Territory"
                placeholder="Maharashtra"
                value={clinicState}
                onChangeText={setClinicState}
              />
            </View>
          ) : null}

          {/* Role-Specific Fields: PATIENT */}
          {selectedRole === 'PATIENT' ? (
            <View style={styles.roleSpecificBlock}>
              <Text style={styles.roleSubhead}>Biological Gender</Text>
              <View style={styles.genderChipRow}>
                {(['Male', 'Female', 'Other'] as const).map((g) => {
                  const isGenderSelected = patientGender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderChip,
                        isGenderSelected && styles.genderChipSelected,
                      ]}
                      onPress={() => setPatientGender(g)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          isGenderSelected && styles.genderChipTextSelected,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Passwords */}
          <AppInput
            label="Password"
            placeholder="At least 8 characters"
            isPassword
            value={password}
            onChangeText={setPassword}
            leftIcon={
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.inkMuted48}
              />
            }
          />

          <AppInput
            label="Confirm Password"
            placeholder="Re-enter password"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            leftIcon={
              <Ionicons
                name="checkmark-done-outline"
                size={18}
                color={Colors.inkMuted48}
              />
            }
          />

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
              {agreeTerms ? (
                <Ionicons name="checkmark" size={14} color={Colors.inkWhite} />
              ) : null}
            </View>
            <Text style={styles.termsText}>
              {selectedRole === 'DOCTOR'
                ? 'I declare that I hold an active Medical Council Registration and comply with NMC regulations.'
                : selectedRole === 'CLINIC'
                ? 'I declare that this facility is a recognized clinical establishment with valid local registrations.'
                : 'I agree to the MediArca Terms of Service, Zero-Upfront Payment policy, and Privacy Policy.'}
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <AppButton
            title={`Register as ${selectedRole}`}
            onPress={handleSignup}
            loading={isLoading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </AppCard>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Already have an account?</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(auth)/login',
              })
            }
            style={styles.loginLink}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.eight,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    marginBottom: Spacing.two,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  placeholderButton: {
    width: 44,
  },
  headerBarTitle: {
    ...Typography.title2,
    color: Colors.ink,
  },

  // Role Tabs
  roleTabsWrapper: {
    marginBottom: Spacing.four,
  },
  sectionLabel: {
    ...Typography.captionBold,
    color: Colors.inkMuted48,
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ebebf0',
    borderRadius: BorderRadius.pill,
    padding: 3,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    gap: 4,
    minHeight: TouchTarget.minHeight,
  },
  roleTabSelected: {
    backgroundColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    ...Typography.captionBold,
    color: Colors.inkMuted80,
  },
  roleTabTextSelected: {
    color: Colors.inkWhite,
    fontWeight: '700',
  },

  // Form Card
  formCard: {
    marginBottom: Spacing.four,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  formCardTitle: {
    ...Typography.title2,
    color: Colors.ink,
  },
  errorCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: '#ffd0cc',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  errorCalloutText: {
    ...Typography.subheadline,
    color: Colors.dangerDark,
    flex: 1,
    fontWeight: '500',
  },

  // Role specifics
  roleSpecificBlock: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  roleSubhead: {
    ...Typography.captionBold,
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: Spacing.three,
    textTransform: 'uppercase',
  },
  genderChipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  genderChip: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderChipText: {
    ...Typography.bodyBold,
    color: Colors.inkMuted80,
  },
  genderChipTextSelected: {
    color: Colors.inkWhite,
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: Spacing.three,
    gap: Spacing.three,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.inkMuted48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: Colors.canvas,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    flex: 1,
    lineHeight: 18,
  },

  submitBtn: {
    marginTop: Spacing.two,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  footerPrompt: {
    ...Typography.subheadline,
    color: Colors.inkMuted80,
  },
  loginLink: {
    padding: Spacing.two,
    minHeight: TouchTarget.minHeight,
    justifyContent: 'center',
  },
  loginLinkText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
});
