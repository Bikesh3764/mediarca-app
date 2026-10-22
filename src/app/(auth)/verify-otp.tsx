import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '@/context/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppBadge } from '@/components/ui/AppBadge';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  TouchTarget,
} from '@/constants/theme';

const OTP_LENGTH = 6;
const DEFAULT_COOLDOWN_SECONDS = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ email?: string; role?: string }>();
  const { verifyOtp, resendOtp } = useAuth();

  const email = (searchParams.email || '').trim().toLowerCase();
  const role = (searchParams.role?.toUpperCase() as UserRole) || 'PATIENT';

  // 6 Digit Box State
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeBoxIndex, setActiveBoxIndex] = useState<number>(0);
  const inputRefs = useRef<any[]>([]);

  // Timer & Loading State
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_COOLDOWN_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // 60-second Countdown Timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  // Focus first input box on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  const handleDigitChange = (text: string, index: number) => {
    setErrorMessage(null);
    setSuccessNotice(null);

    // Clean non-digit characters
    const cleaned = text.replace(/\D/g, '');

    // Case 1: Pasting full 6-digit OTP code into any box
    if (cleaned.length >= OTP_LENGTH) {
      const pasted = cleaned.slice(0, OTP_LENGTH).split('');
      setDigits(pasted);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }

    const updated = [...digits];

    // Case 2: User typed over an already-filled box (e.g. was '5', user entered '7' -> cleaned is '57' or '75')
    if (cleaned.length > 1) {
      const newChar = cleaned.slice(-1);
      updated[index] = newChar;
      setDigits(updated);
      if (index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }

    // Case 3: Standard single digit entry or clearing
    updated[index] = cleaned;
    setDigits(updated);

    // Auto-advance to next box if digit was entered
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<{ key: string }>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back to previous box and clear
        const updated = [...digits];
        updated[index - 1] = '';
        setDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const currentOtp = digits.join('');

  const handleVerify = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    if (currentOtp.length < OTP_LENGTH) {
      setErrorMessage(`Please enter all ${OTP_LENGTH} digits of your verification code`);
      return;
    }

    if (!email) {
      setErrorMessage('Missing target email address. Please return to login.');
      return;
    }

    setIsVerifying(true);
    try {
      const verifiedUser = await verifyOtp(email, currentOtp, role);
      Alert.alert(
        'Email Verified',
        `Welcome to MediArca, ${verifiedUser.fullName}! Your account is now active.`
      );
      router.replace('/');
    } catch (err: any) {
      if (err.isAlreadyVerified || err.message?.toLowerCase().includes('already verified')) {
        Alert.alert(
          'Already Verified',
          'Your email is already verified. Please sign in to your account.',
          [
            {
              text: 'Sign In',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
        return;
      }
      setErrorMessage(
        err.message || 'Invalid or expired verification code. Please request a new code.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;

    if (!email) {
      setErrorMessage('Missing email address to resend verification code');
      return;
    }

    setIsResending(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      await resendOtp(email, role);
      setSecondsLeft(DEFAULT_COOLDOWN_SECONDS);
      setSuccessNotice('A fresh 6-digit verification code has been sent to your email.');
      // Clear existing inputs and refocus first box
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      if (err.cooldownSeconds || err.retryAfterSeconds) {
        setSecondsLeft(err.cooldownSeconds || err.retryAfterSeconds);
      }
      setErrorMessage(
        err.message || 'Unable to resend verification code. Please wait before retrying.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={styles.navBarTitle}>Verify Email</Text>
          <View style={styles.placeholderButton} />
        </View>

        {/* Hero Card */}
        <AppCard elevated style={styles.card}>
          <View style={styles.iconHero}>
            <View style={styles.mailCircle}>
              <Ionicons name="mail-unread" size={32} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>6-Digit Verification Code</Text>
          <Text style={styles.subtitle}>
            We have sent a one-time verification passcode to
          </Text>
          <Text style={styles.emailHighlight} numberOfLines={1}>
            {email || 'your registered email'}
          </Text>

          <View style={styles.badgeRow}>
            <AppBadge role={role} label={`${role} Portal`} size="sm" />
          </View>

          {/* Success or Error Notice */}
          {successNotice ? (
            <View style={styles.successCallout}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.successDark} />
              <Text style={styles.successCalloutText}>{successNotice}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.errorCallout}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorCalloutText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* 6 Digit Auto-Advancing Input Boxes */}
          <View style={styles.otpGrid}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => {
              const isFocused = activeBoxIndex === i;
              const hasValue = Boolean(digits[i]);
              return (
                <View
                  key={i}
                  style={[
                    styles.digitBox,
                    isFocused && styles.digitBoxFocused,
                    hasValue && styles.digitBoxFilled,
                  ]}
                >
                  <TextInput
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    style={styles.digitInput}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    value={digits[i]}
                    onChangeText={(text) => handleDigitChange(text, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    onFocus={() => setActiveBoxIndex(i)}
                    selectTextOnFocus
                    accessibilityLabel={`Digit ${i + 1} of 6`}
                  />
                </View>
              );
            })}
          </View>

          {/* Verify Button */}
          <AppButton
            title="Verify & Continue"
            onPress={handleVerify}
            loading={isVerifying}
            disabled={currentOtp.length < OTP_LENGTH}
            variant="primary"
            size="lg"
            style={styles.verifyButton}
          />

          {/* Resend OTP Section with Countdown */}
          <View style={styles.resendContainer}>
            {secondsLeft > 0 ? (
              <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={16} color={Colors.inkMuted48} />
                <Text style={styles.timerText}>
                  Resend code in {formatTimer(secondsLeft)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={isResending}
                style={styles.resendTouch}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={Colors.primary} />
                <Text style={styles.resendActiveText}>
                  {isResending ? 'Sending Code...' : 'Resend Verification Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </AppCard>

        {/* Change Email Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerNote}>Wrong email address?</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.changeEmailTouch}
            activeOpacity={0.7}
          >
            <Text style={styles.changeEmailText}>Edit Information</Text>
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
  navBar: {
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
  navBarTitle: {
    ...Typography.title2,
    color: Colors.ink,
  },

  card: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    marginBottom: Spacing.four,
  },
  iconHero: {
    marginBottom: Spacing.four,
  },
  mailCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.title1,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  subtitle: {
    ...Typography.subheadline,
    color: Colors.inkMuted80,
    textAlign: 'center',
  },
  emailHighlight: {
    ...Typography.bodyBold,
    color: Colors.ink,
    textAlign: 'center',
    marginTop: 4,
  },
  badgeRow: {
    marginVertical: Spacing.three,
  },

  // Notices
  successCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    width: '100%',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  successCalloutText: {
    ...Typography.subheadline,
    color: Colors.successDark,
    flex: 1,
    fontWeight: '500',
  },
  errorCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: '#ffd0cc',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    width: '100%',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  errorCalloutText: {
    ...Typography.subheadline,
    color: Colors.dangerDark,
    flex: 1,
    fontWeight: '500',
  },

  // 6 Digit Grid
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: Spacing.four,
    gap: 8,
  },
  digitBox: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#f8fbff',
  },
  digitBoxFilled: {
    borderColor: Colors.inkMuted80,
  },
  digitInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.ink,
  },

  verifyButton: {
    marginTop: Spacing.three,
  },

  // Resend
  resendContainer: {
    marginTop: Spacing.five,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    ...Typography.subheadline,
    color: Colors.inkMuted48,
  },
  resendTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.two,
    minHeight: TouchTarget.minHeight,
  },
  resendActiveText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  footerNote: {
    ...Typography.subheadline,
    color: Colors.inkMuted80,
  },
  changeEmailTouch: {
    padding: Spacing.two,
    minHeight: TouchTarget.minHeight,
    justifyContent: 'center',
  },
  changeEmailText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
});
