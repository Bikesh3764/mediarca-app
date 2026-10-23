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

export default function TermsOfServiceScreen() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>Last Updated: October 2026 • Version 1.0</Text>
        </View>

        {/* Section 1 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>1. Acceptance of Terms</Text>
          <Text style={styles.bodyText}>
            By downloading, accessing, or using the MediArca mobile application or web portal, you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use immediately.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>2. OPD Queue Telemetry & Token Generation</Text>
          <Text style={styles.bodyText}>
            MediArca provides real-time outpatient queue management and appointment booking. Reserving an appointment generates an estimated sequential token (#X) for your chosen shift. Estimated wait times are dynamic calculations based on current doctor consultation pace and clinic flow.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>3. Zero-Upfront Payment Model</Text>
          <Text style={styles.bodyText}>
            MediArca does not process advance consultation fee transactions for standard outpatient visits. Generating an OPD queue token is completely free of charge.
          </Text>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            The doctor's consultation fee is paid directly to the clinic at the physical reception counter upon your arrival. Any dispute regarding fee amounts or clinic payment receipts must be resolved directly with the respective clinic management.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>4. Arrival & Counter QR Check-In</Text>
          <Text style={styles.bodyText}>
            To preserve queue integrity, patients must physically arrive at the clinic counter before their token is called. Patients must scan the official Clinic QR Standee with their mobile app or request the desk receptionist to mark them as Checked In.
          </Text>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            If a patient fails to arrive when their token is called, the doctor or clinic receptionist may temporarily place the token On Hold or mark it as No-Show.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>5. Clinical Emergency Disclaimers</Text>
          <Text style={styles.bodyText}>
            MediArca is an administrative queue facilitation platform, NOT an emergency medical response service. In the event of an acute medical emergency, chest pain, difficulty breathing, or severe trauma, please proceed immediately to the nearest hospital emergency room or dial 112 / 108.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>6. Fair Use & Account Integrity</Text>
          <Text style={styles.bodyText}>
            Users agree not to create fraudulent accounts, spam booking slots, or hoard queue tokens without intending to visit the clinic. MediArca reserves the right to suspend accounts engaging in queue manipulation or abusive behavior.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>7. Governing Law & Jurisdiction</Text>
          <Text style={styles.bodyText}>
            These terms are governed by and construed in accordance with the laws of India. Any disputes arising out of the use of MediArca shall be subject to the exclusive jurisdiction of the competent courts in India.
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
  badgeRow: {
    marginBottom: Spacing.xs,
  },
  badgeText: {
    ...Typography.caption1,
    color: Colors.inkSecondary,
    fontWeight: '500',
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
});
