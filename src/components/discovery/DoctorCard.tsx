import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Doctor, formatDoctorDegrees, getFileUrl } from '@/services/api';
import { CabinBadge } from '@/components/common/CabinBadge';
import {
  Colors,
  BorderRadius,
  Spacing,
  Typography,
  TouchTarget,
  Shadows,
} from '@/constants/theme';

export interface DoctorCardProps {
  doctor: Doctor;
  onPress: (doctor: Doctor) => void;
  onBookPress?: (doctor: Doctor) => void;
  style?: ViewStyle;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onPress,
  onBookPress,
  style,
}) => {
  const [imageError, setImageError] = useState(false);

  const fullName = doctor.user?.fullName || 'Doctor';
  const cleanName = fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`;
  const initial = (doctor.user?.fullName ? doctor.user.fullName.replace(/^Dr\.\s*/i, '').trim()[0] : 'D') || 'D';

  const avatarUrl = doctor.user?.avatarUrl ? getFileUrl(doctor.user.avatarUrl) : null;
  const degrees = formatDoctorDegrees(doctor.qualifications);

  // Clinic affiliation resolution
  const primaryClinic = doctor.clinics?.[0]?.clinic;
  const clinicName = primaryClinic?.clinicName || 'Private Practice';
  const clinicCity = primaryClinic?.city || (doctor.clinicAddress ? doctor.clinicAddress.split(',')[0].trim() : null);

  // Fee resolution
  const effectiveFee = doctor.clinics?.[0]?.consultationFee ?? doctor.consultationFee;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(doctor)}
      activeOpacity={0.88}
    >
      {/* Top Identity Row */}
      <View style={styles.topRow}>
        {/* Doctor Photo / Monogram */}
        <View style={styles.avatarContainer}>
          {avatarUrl && !imageError ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.monogram}>
              <Text style={styles.monogramText}>{initial.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Doctor Info */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.doctorName} numberOfLines={1}>
              {cleanName}
            </Text>
            {doctor.isVerified && (
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={Colors.primary}
                style={styles.verifiedIcon}
              />
            )}
          </View>

          {/* Specialty & Cabin Badge */}
          <View style={styles.specialtyRow}>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyText} numberOfLines={1}>
                {doctor.specialty}
              </Text>
            </View>
            <CabinBadge
              status={doctor.cabinStatus}
              expectedReturnTime={doctor.expectedReturnTime}
              size="sm"
            />
          </View>

          {/* Degrees & Experience */}
          <Text style={styles.degreesText} numberOfLines={1}>
            {degrees}
            {doctor.experienceYears ? ` · ${doctor.experienceYears} yrs exp` : ''}
          </Text>
        </View>
      </View>

      {/* Clinic & Location Row */}
      <View style={styles.clinicRow}>
        <Ionicons name="business-outline" size={14} color={Colors.inkMuted48} />
        <Text style={styles.clinicText} numberOfLines={1}>
          {clinicName}
          {clinicCity ? ` · ${clinicCity}` : ''}
        </Text>
      </View>

      {/* Footer: Fee & Book Token Button */}
      <View style={styles.footerRow}>
        <View style={styles.feeBlock}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeValue}>₹{effectiveFee}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => (onBookPress ? onBookPress(doctor) : onPress(doctor))}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>Book Token</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.inkWhite} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    ...Shadows.subtle,
    marginBottom: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#f5f5f7',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  monogram: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    color: Colors.inkWhite,
    fontSize: 24,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  specialtyPill: {
    backgroundColor: '#e8f2fc',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.pill,
  },
  specialtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  degreesText: {
    fontSize: 12,
    color: Colors.inkMuted80,
    marginTop: 4,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f2',
  },
  clinicText: {
    fontSize: 12,
    color: Colors.inkMuted80,
    fontWeight: '500',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f2',
  },
  feeBlock: {
    justifyContent: 'center',
  },
  feeLabel: {
    fontSize: 11,
    color: Colors.inkMuted48,
    fontWeight: '500',
  },
  feeValue: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: TouchTarget.minSize,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    ...Shadows.subtle,
  },
  bookButtonText: {
    color: Colors.inkWhite,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
