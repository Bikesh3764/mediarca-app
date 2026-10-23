import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';

export default function AboutUsScreen() {
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
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.contentContainer}>
        {/* Hero Card */}
        <View style={[styles.card, styles.heroCard]}>
          <View style={styles.iconCircle}>
            <Ionicons name="pulse" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>MediArca Healthcare</Text>
          <Text style={styles.heroSubtitle}>
            Democratizing Indian Outpatient Healthcare with Real-Time Queue Transparency
          </Text>
        </View>

        {/* Mission Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="compass-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <Text style={styles.bodyText}>
            Patients in India routinely lose 2 to 4 hours sitting in crowded clinic waiting rooms with zero visibility into doctor arrival times or queue progress.
          </Text>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            MediArca eliminates OPD waiting anxiety by providing live cabin presence tracking, sequential token passes, real-time wait telemetry, and counter QR check-ins.
          </Text>
        </View>

        {/* Core Principles */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
            <Text style={styles.sectionTitle}>Core Platform Principles</Text>
          </View>

          <View style={styles.principleItem}>
            <Text style={styles.principleTitle}>1. Zero Upfront Payment</Text>
            <Text style={styles.principleDesc}>
              Token reservations on MediArca are completely free. Patients pay consultation fees directly at the clinic counter desk upon arrival.
            </Text>
          </View>

          <View style={styles.principleItem}>
            <Text style={styles.principleTitle}>2. Live Cabin Presence</Text>
            <Text style={styles.principleDesc}>
              Doctors update their real-time cabin status (In Cabin, Stepped Out with estimated return time, or Not In Cabin) so patients arrive precisely when their turn approaches.
            </Text>
          </View>

          <View style={styles.principleItem}>
            <Text style={styles.principleTitle}>3. Offline Patient Inclusivity</Text>
            <Text style={styles.principleDesc}>
              Clinic receptionists use our Walk-in Token Dispenser to seamlessly issue official tokens for patients without smartphones, maintaining a unified queue sequence.
            </Text>
          </View>

          <View style={styles.principleItem}>
            <Text style={styles.principleTitle}>4. Regulatory Compliance</Text>
            <Text style={styles.principleDesc}>
              Medical council license verification queues for doctors and clinic establishment license validation ensure full patient safety and National Medical Commission compliance.
            </Text>
          </View>
        </View>

        {/* Contact CTA */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Get in Touch</Text>
          </View>
          <Text style={styles.bodyText}>
            Have suggestions, questions, or would like to onboard your medical clinic? Our team is here to assist you.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/legal/contact')}
            activeOpacity={0.85}
          >
            <Ionicons name="paper-plane-outline" size={18} color={Colors.inkWhite} />
            <Text style={styles.primaryButtonText}>Send Us a Message</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  heroCard: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.title2,
    fontWeight: '700',
    color: Colors.inkDark,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    ...Typography.subhead,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.headline,
    fontWeight: '600',
    color: Colors.inkDark,
  },
  bodyText: {
    ...Typography.body,
    color: Colors.inkDark,
    lineHeight: 22,
  },
  paragraphSpacer: {
    marginTop: Spacing.sm,
  },
  principleItem: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderSubtle,
  },
  principleTitle: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.inkDark,
    marginBottom: 2,
  },
  principleDesc: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    minHeight: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  primaryButtonText: {
    ...Typography.subhead,
    color: Colors.inkWhite,
    fontWeight: '600',
  },
});
