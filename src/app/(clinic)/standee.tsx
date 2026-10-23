import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { api, ClinicProfile } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const DEMO_STAND_CLINIC: ClinicProfile = {
  id: 'clinic_demo_1',
  clinicName: 'City Heart & Vascular Institute',
  address: 'Suite 402, Hill Road, Bandra West',
  city: 'Mumbai',
  state: 'Maharashtra',
  phone: '+91 98200 12345',
  checkinCode: 'CHVI',
  isVerified: true,
};

export default function ClinicStandeeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [clinic, setClinic] = useState<ClinicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClinic() {
      try {
        const res = await api.getMyClinic();
        if (res?.clinic) {
          setClinic(res.clinic);
        } else {
          setClinic(DEMO_STAND_CLINIC);
        }
      } catch {
        // Fallback to active demo clinic
        setClinic(DEMO_STAND_CLINIC);
      } finally {
        setLoading(false);
      }
    }
    loadClinic();
  }, []);

  const clinicId = clinic?.id || 'clinic_demo_1';
  const clinicName = clinic?.clinicName || 'MediArca Partner Clinic';
  const checkinCode = clinic?.checkinCode || 'MEDI';

  // Standardized MediArca checkin payload
  const checkinPayload = JSON.stringify({
    clinicId,
    clinicName,
    code: checkinCode,
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkinPayload)}`;

  const handleShareStandee = async () => {
    try {
      const shareMessage = `🏥 MediArca Counter Check-In Standee\n\nClinic: ${clinicName}\nAddress: ${clinic?.address || ''}, ${clinic?.city || ''}\nCheck-in Code: ${checkinCode}\n\nScan this QR code with the MediArca app upon counter arrival for instant OPD queue check-in!`;
      await Share.share({
        message: shareMessage,
        title: `${clinicName} - MediArca Standee`,
      });
    } catch (err) {
      console.warn('Share standee error:', err);
    }
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
        <Text style={styles.headerTitle}>Counter QR Standee</Text>
        <TouchableOpacity
          style={styles.shareIconButton}
          onPress={handleShareStandee}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Generating Counter Standee...</Text>
          </View>
        ) : (
          <>
            {/* Counter Standee Card (Printable Layout) */}
            <View style={styles.standeeFrame}>
              {/* Brand Top Bar */}
              <View style={styles.brandRow}>
                <View style={styles.brandLogoIcon}>
                  <Ionicons name="pulse" size={20} color={Colors.inkWhite} />
                </View>
                <Text style={styles.brandName}>MediArca</Text>
                <View style={styles.officialPill}>
                  <Text style={styles.officialPillText}>Official Standee</Text>
                </View>
              </View>

              <Text style={styles.standeeSubtitle}>
                Instant Outpatient Queue Arrival Check-In
              </Text>

              {/* QR Container */}
              <View style={styles.qrCard}>
                <Image
                  source={{ uri: qrImageUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>

              {/* Clinic Information */}
              <View style={styles.clinicInfoBlock}>
                <Text style={styles.clinicNameText}>{clinicName}</Text>
                {clinic?.address ? (
                  <Text style={styles.clinicAddressText}>
                    {clinic.address}, {clinic.city}
                  </Text>
                ) : null}
                {clinic?.phone ? (
                  <Text style={styles.clinicPhoneText}>{clinic.phone}</Text>
                ) : null}

                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeLabel}>Standee Code: </Text>
                  <Text style={styles.codeBadgeValue}>{checkinCode}</Text>
                </View>
              </View>

              {/* Instruction Steps */}
              <View style={styles.instructionBox}>
                <View style={styles.instructionStep}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Open MediArca app on your phone</Text>
                </View>
                <View style={styles.instructionStep}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Tap Camera Scan on your active ticket pass</Text>
                </View>
                <View style={styles.instructionStep}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Instant arrival recorded at reception</Text>
                </View>
              </View>
            </View>

            {/* Action Bar */}
            <TouchableOpacity
              style={styles.printShareButton}
              onPress={handleShareStandee}
              activeOpacity={0.85}
            >
              <Ionicons name="share-social-outline" size={18} color={Colors.inkWhite} />
              <Text style={styles.printShareButtonText}>Share & Print Standee</Text>
            </TouchableOpacity>
          </>
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
  shareIconButton: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
  },
  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.subhead,
    color: Colors.inkSecondary,
  },
  standeeFrame: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  brandLogoIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    ...Typography.title3,
    fontWeight: '800',
    color: Colors.inkDark,
    letterSpacing: -0.5,
  },
  officialPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    marginLeft: 4,
  },
  officialPillText: {
    ...Typography.caption2,
    color: Colors.primary,
    fontWeight: '700',
  },
  standeeSubtitle: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  qrCard: {
    width: 240,
    height: 240,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.canvasPure,
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  clinicInfoBlock: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    width: '100%',
  },
  clinicNameText: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.inkDark,
    textAlign: 'center',
    marginBottom: 2,
  },
  clinicAddressText: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  clinicPhoneText: {
    ...Typography.caption1,
    color: Colors.inkSecondary,
    marginBottom: 6,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  codeBadgeLabel: {
    ...Typography.caption2,
    color: Colors.inkSecondary,
  },
  codeBadgeValue: {
    ...Typography.caption1,
    color: Colors.inkDark,
    fontWeight: '700',
    letterSpacing: 1,
  },
  instructionBox: {
    width: '100%',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...Typography.caption2,
    color: Colors.inkWhite,
    fontWeight: '700',
  },
  stepText: {
    ...Typography.caption1,
    color: Colors.inkDark,
    flex: 1,
  },
  printShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.primary,
    minHeight: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    ...Shadows.sm,
  },
  printShareButtonText: {
    ...Typography.subhead,
    color: Colors.inkWhite,
    fontWeight: '600',
  },
});
