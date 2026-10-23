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

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>Last Updated: October 2026 • Google Play & NMC Compliant</Text>
        </View>

        {/* Section 1 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>1. Information We Collect</Text>
          <Text style={styles.bodyText}>
            MediArca collects only the information necessary to facilitate outpatient clinic reservations:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• <Text style={styles.bulletBold}>Identity & Contact Details:</Text> Full name, mobile phone number (+91), and email address.</Text>
            <Text style={styles.bulletItem}>• <Text style={styles.bulletBold}>OPD Booking Details:</Text> Doctor selection, clinic venue, appointment date, shift time, and dependent name/age when booking for family.</Text>
            <Text style={styles.bulletItem}>• <Text style={styles.bulletBold}>Device Camera Access:</Text> Used strictly to scan clinic QR standees for counter arrival check-in. No camera images or video frames are stored or transmitted.</Text>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>2. Zero Data Selling Pledge</Text>
          <Text style={styles.bodyText}>
            We never sell, lease, or monetize your personal or health data to pharmaceutical companies, insurance aggregators, or third-party advertisers. Your information is strictly used for clinical care coordination.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>3. Statutory Data Retention (NMC & MCI Regulations)</Text>
          <Text style={styles.bodyText}>
            In compliance with the National Medical Commission (NMC) regulations and Medical Council of India (MCI) Code of Medical Ethics Regulation 1.3, clinical consultation notes, diagnostic vitals, and doctor prescriptions must be retained for a minimum statutory period of 3 years.
          </Text>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            This retention is mandatory under Indian law to preserve patient safety, allow clinical continuity of care, and satisfy medico-legal audit obligations.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>4. Self-Serve Account Deletion (Google Play Compliance)</Text>
          <Text style={styles.bodyText}>
            In accordance with Google Play Developer Policies, MediArca provides an in-app self-service account deletion mechanism located in <Text style={styles.bulletBold}>Profile → Request Account Deletion</Text>.
          </Text>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            Upon your confirmed request, we immediately purge:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Your account authentication credentials, passwords, and active session tokens.</Text>
            <Text style={styles.bulletItem}>• Your personal identifiers, email, phone number, and avatar photo.</Text>
            <Text style={styles.bulletItem}>• Device push notification tokens and hardware identifiers.</Text>
          </View>
          <Text style={[styles.bodyText, styles.paragraphSpacer]}>
            Any clinical consultation records previously created remain securely archived in an anonymized state solely to satisfy the 3-year NMC regulatory retention requirement.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>5. Hardware-Backed Encryption</Text>
          <Text style={styles.bodyText}>
            All network communication utilizes TLS 1.3 encryption. On Android devices, authentication tokens are persisted inside the Android Keystore via Expo SecureStore to prevent extraction by third-party applications.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>6. Contact Data Protection Officer</Text>
          <Text style={styles.bodyText}>
            If you have questions regarding data privacy or wish to submit a data removal request via email, contact our privacy team at <Text style={styles.linkText}>contact@mediarca.in</Text>.
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
  bulletList: {
    marginTop: Spacing.sm,
    gap: 6,
  },
  bulletItem: {
    ...Typography.footnote,
    color: Colors.inkDark,
    lineHeight: 20,
  },
  bulletBold: {
    fontWeight: '600',
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
