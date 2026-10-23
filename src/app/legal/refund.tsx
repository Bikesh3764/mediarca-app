import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';

export default function RefundPolicyScreen() {
  const router = useRouter();

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
        <Text style={styles.headerTitle}>Cancellation & Refund Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.contentContainer}>
        {/* Zero Upfront Highlight Banner */}
        <View style={styles.highlightBanner}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
          <View style={styles.highlightTextCol}>
            <Text style={styles.highlightTitle}>Zero Upfront Online Payments</Text>
            <Text style={styles.highlightSubtitle}>
              MediArca does NOT charge any online booking or reservation fees. Generating an OPD queue token is 100% free.
            </Text>
          </View>
        </View>

        {/* Section 1 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>1. No Online Payment Deductions</Text>
          <Text style={styles.bodyText}>
            Because MediArca operates on a zero-upfront payment policy for outpatient bookings, no payment gateway deductions, card charges, or wallet debits occur on our mobile application.
          </Text>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            Patients do not risk locked funds, failed online refund attempts, or multi-day banking wait times.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>2. Free Token Cancellation</Text>
          <Text style={styles.bodyText}>
            You may cancel your scheduled OPD token pass at any time before your consultation directly from the "My Passes" section of the mobile app.
          </Text>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            There are strictly NO cancellation charges, penalties, or booking forfeiture fees.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>3. Clinic Counter Payments</Text>
          <Text style={styles.bodyText}>
            The doctor's consultation fee is collected exclusively at the physical clinic reception desk upon your arrival. Clinics accept cash, UPI (Google Pay, PhonePe, Paytm), or credit/debit cards according to their local counter capabilities.
          </Text>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            Any billing inquiries, tax receipts, or refund requests for fees paid directly to a clinic counter are governed by the respective clinic's billing policy.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>4. Doctor Schedule Changes & Leaves</Text>
          <Text style={styles.bodyText}>
            If a practicing doctor encounters an unforeseen clinical emergency or takes leave during your scheduled shift, our platform automatically updates the queue status and notifies you.
          </Text>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            You will have the option to reschedule your token pass to another upcoming shift or cancel with zero hassle.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>5. Contact Support</Text>
          <Text style={styles.bodyText}>
            For any queries regarding clinic billing disputes or cancellation status, please reach out to our support team at <Text style={styles.linkText}>contact@mediarca.in</Text>.
          </Text>
        </View>
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
  highlightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.2)',
    gap: Spacing.md,
  },
  highlightTextCol: {
    flex: 1,
  },
  highlightTitle: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.primary,
  },
  highlightSubtitle: {
    ...Typography.footnote,
    color: Colors.inkDark,
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  sectionHeading: {
    ...Typography.headline,
    fontWeight: '600',
    color: Colors.inkDark,
    marginBottom: Spacing.xs,
  },
  bodyText: {
    ...Typography.body,
    color: Colors.inkDark,
    lineHeight: 22,
  },
  paragraphSpacer: {
    marginTop: Spacing.sm,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
