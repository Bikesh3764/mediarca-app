import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
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

const ROLES: { id: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'PATIENT', label: 'Patient', icon: 'person-outline' },
  { id: 'DOCTOR', label: 'Doctor', icon: 'medkit-outline' },
  { id: 'RECEPTIONIST', label: 'Desk', icon: 'clipboard-outline' },
  { id: 'CLINIC', label: 'Clinic', icon: 'business-outline' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>('PATIENT');
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setErrorMessage(null);
  };

  const handleLogin = async () => {
    setErrorMessage(null);

    const identifier = loginMode === 'email' ? email.trim() : sanitizeIndianPhone(phone);

    if (!identifier) {
      setErrorMessage(
        loginMode === 'email'
          ? 'Please enter your registered email address'
          : 'Please enter your 10-digit mobile number'
      );
      return;
    }

    if (loginMode === 'phone' && !isValidIndianPhone(identifier)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(identifier, password, activeRole);
      Alert.alert('Welcome Back', `Logged in successfully as ${user.fullName}`);
      router.replace('/');
    } catch (err: any) {
      if (err.requiresVerification) {
        // Redirect to OTP verification screen
        router.push({
          pathname: '/(auth)/verify-otp',
          params: {
            email: err.email || identifier,
            role: activeRole,
          },
        });
        return;
      }
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // In production, integrate native Google OAuth SDK
    Alert.alert(
      'Google Sign-In',
      'Native Google OAuth requires Google Cloud SHA-1 fingerprint configuration. Would you like to view instructions?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Email Login',
          onPress: () => setLoginMode('email'),
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Top Brand Hero */}
        <View style={styles.brandHero}>
          <View style={styles.brandBadgeContainer}>
            <View style={styles.brandIcon}>
              <Ionicons name="pulse" size={28} color={Colors.inkWhite} />
            </View>
          </View>
          <Text style={styles.brandTitle}>MediArca</Text>
          <Text style={styles.brandSubtitle}>Healthcare Platform • Secure Sign In</Text>
        </View>

        {/* Role Switcher Tabs */}
        <View style={styles.roleTabsWrapper}>
          <Text style={styles.roleTabsLabel}>SELECT PORTAL ROLE</Text>
          <View style={styles.roleTabsContainer}>
            {ROLES.map((r) => {
              const isActive = activeRole === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.roleTab, isActive && styles.roleTabActive]}
                  onPress={() => handleRoleChange(r.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={r.icon}
                    size={16}
                    color={isActive ? Colors.inkWhite : Colors.inkMuted80}
                    style={styles.roleTabIcon}
                  />
                  <Text
                    style={[
                      styles.roleTabText,
                      isActive && styles.roleTabTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Main Login Card */}
        <AppCard elevated style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {ROLES.find((r) => r.id === activeRole)?.label} Sign In
            </Text>
            <AppBadge role={activeRole} label={activeRole} size="sm" />
          </View>

          {/* Identifier Toggle: Email vs Mobile */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                loginMode === 'email' && styles.modeButtonActive,
              ]}
              onPress={() => {
                setLoginMode('email');
                setErrorMessage(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  loginMode === 'email' && styles.modeButtonTextActive,
                ]}
              >
                Email Address
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                loginMode === 'phone' && styles.modeButtonActive,
              ]}
              onPress={() => {
                setLoginMode('phone');
                setErrorMessage(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  loginMode === 'phone' && styles.modeButtonTextActive,
                ]}
              >
                Mobile (+91)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Callout */}
          {errorMessage ? (
            <View style={styles.errorCallout}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorCalloutText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Input Fields */}
          {loginMode === 'email' ? (
            <AppInput
              label="Email Address"
              placeholder="e.g. yourname@domain.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              leftIcon={
                <Ionicons name="mail-outline" size={18} color={Colors.inkMuted48} />
              }
            />
          ) : (
            <AppInput
              label="Mobile Number"
              placeholder="98200 12345"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              prefixBadge="+91"
              helperText="10-digit Indian mobile number"
            />
          )}

          <AppInput
            label="Password"
            placeholder="Enter your account password"
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

          {/* Primary Action Button */}
          <AppButton
            title={`Sign In to ${ROLES.find((r) => r.id === activeRole)?.label} Portal`}
            onPress={handleLogin}
            loading={isLoading}
            variant="primary"
            size="lg"
            style={styles.submitButton}
          />

          {/* Google Sign In Divider */}
          {activeRole === 'PATIENT' || activeRole === 'DOCTOR' ? (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <AppButton
                title="Continue with Google"
                onPress={handleGoogleSignIn}
                variant="google"
                size="md"
                icon={<Ionicons name="logo-google" size={18} color="#EA4335" />}
              />
            </>
          ) : null}
        </AppCard>

        {/* Footer Navigation */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerPrompt}>
            {activeRole === 'RECEPTIONIST'
              ? 'Receptionist accounts are provisioned by Clinic Admin.'
              : "Don't have an account?"}
          </Text>

          {activeRole !== 'RECEPTIONIST' ? (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(auth)/signup',
                  params: { role: activeRole },
                })
              }
              style={styles.signupLinkTouch}
              activeOpacity={0.7}
            >
              <Text style={styles.signupLinkText}>
                Create a new {ROLES.find((r) => r.id === activeRole)?.label} account
              </Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={styles.backHomeTouch}
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={14} color={Colors.inkMuted80} />
            <Text style={styles.backHomeText}>Return to Live App Telemetry</Text>
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
  brandHero: {
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  brandBadgeContainer: {
    marginBottom: Spacing.two,
  },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.card,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    ...Typography.hero,
    color: Colors.ink,
    textAlign: 'center',
  },
  brandSubtitle: {
    ...Typography.subheadline,
    color: Colors.inkMuted80,
    marginTop: 2,
    textAlign: 'center',
  },

  // Role Switcher
  roleTabsWrapper: {
    marginBottom: Spacing.four,
  },
  roleTabsLabel: {
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
    minHeight: TouchTarget.minHeight,
  },
  roleTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabIcon: {
    marginRight: 4,
  },
  roleTabText: {
    ...Typography.captionBold,
    color: Colors.inkMuted80,
  },
  roleTabTextActive: {
    color: Colors.inkWhite,
    fontWeight: '700',
  },

  // Card Content
  card: {
    marginBottom: Spacing.five,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  cardTitle: {
    ...Typography.title2,
    color: Colors.ink,
  },

  // Mode Toggle (Email / Phone)
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  modeButtonActive: {
    backgroundColor: Colors.canvas,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeButtonText: {
    ...Typography.captionBold,
    color: Colors.inkMuted80,
  },
  modeButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // Error Callout
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

  submitButton: {
    marginTop: Spacing.two,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.hairline,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.inkMuted48,
    marginHorizontal: Spacing.three,
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  footerPrompt: {
    ...Typography.subheadline,
    color: Colors.inkMuted80,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  signupLinkTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.three,
  },
  signupLinkText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  backHomeTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.four,
    padding: Spacing.two,
    minHeight: TouchTarget.minHeight,
  },
  backHomeText: {
    ...Typography.subheadline,
    color: Colors.inkMuted80,
  },
});
