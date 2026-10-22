import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReceptionistLinkedDoctor, getFileUrl } from '@/services/api';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';

export interface ActiveDoctorSwitcherProps {
  doctors: ReceptionistLinkedDoctor[];
  selectedDoctorId: string | null;
  onSelectDoctor: (doctorId: string) => void;
  showAllOption?: boolean;
}

export const ActiveDoctorSwitcher: React.FC<ActiveDoctorSwitcherProps> = ({
  doctors,
  selectedDoctorId,
  onSelectDoctor,
  showAllOption = false,
}) => {
  if (!doctors || doctors.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>CLINIC PRACTITIONERS</Text>
        <Text style={styles.countBadge}>{doctors.length} Active</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {showAllOption && (
          <TouchableOpacity
            style={[
              styles.pill,
              selectedDoctorId === 'all' && styles.pillActive,
            ]}
            onPress={() => onSelectDoctor('all')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconWrap,
                selectedDoctorId === 'all' && styles.iconWrapActive,
              ]}
            >
              <Ionicons
                name="people"
                size={16}
                color={selectedDoctorId === 'all' ? Colors.inkWhite : Colors.primary}
              />
            </View>
            <View style={styles.textCol}>
              <Text
                style={[
                  styles.nameText,
                  selectedDoctorId === 'all' && styles.nameTextActive,
                ]}
                numberOfLines={1}
              >
                All Doctors
              </Text>
              <Text
                style={[
                  styles.subText,
                  selectedDoctorId === 'all' && styles.subTextActive,
                ]}
              >
                Overview
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {doctors.map((doc) => {
          const isSelected = selectedDoctorId === doc.doctorId;
          const status = doc.cabinStatus || 'IN_CABIN';
          const statusColor =
            status === 'IN_CABIN'
              ? Colors.success
              : status === 'STEPPED_OUT'
              ? Colors.warning
              : Colors.inkMuted48;

          const waitingCount = doc.todayWaitingPatients || 0;
          const rawName = doc.fullName || 'Doctor';
          const displayName = rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`;

          return (
            <TouchableOpacity
              key={doc.doctorId}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => onSelectDoctor(doc.doctorId)}
              activeOpacity={0.8}
            >
              {/* Doctor Avatar with Status Dot */}
              <View style={styles.avatarContainer}>
                {doc.avatarUrl ? (
                  <Image
                    source={{ uri: getFileUrl(doc.avatarUrl) }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      isSelected && styles.avatarFallbackActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarFallbackText,
                        isSelected && styles.avatarFallbackTextActive,
                      ]}
                    >
                      {displayName.replace('Dr. ', '')[0]?.toUpperCase() || 'D'}
                    </Text>
                  </View>
                )}
                {/* Cabin Presence Dot */}
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor }]}
                />
              </View>

              {/* Info Column */}
              <View style={styles.textCol}>
                <Text
                  style={[styles.nameText, isSelected && styles.nameTextActive]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <Text
                  style={[styles.subText, isSelected && styles.subTextActive]}
                  numberOfLines={1}
                >
                  {doc.specialty || 'General OPD'}
                </Text>
              </View>

              {/* Waiting Count Badge */}
              <View
                style={[
                  styles.waitingPill,
                  isSelected && styles.waitingPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.waitingPillText,
                    isSelected && styles.waitingPillTextActive,
                  ]}
                >
                  {waitingCount}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Colors.inkMuted80,
    letterSpacing: 0.8,
  },
  countBadge: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollView: {
    paddingLeft: Spacing.md,
  },
  scrollContent: {
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: TouchTarget.minHeight,
    ...Shadows.subtle,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.xs,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  avatarFallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  avatarFallbackTextActive: {
    color: Colors.inkWhite,
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.canvasPure,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  textCol: {
    maxWidth: 120,
    marginRight: Spacing.xs,
  },
  nameText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '600',
    color: Colors.ink,
  },
  nameTextActive: {
    color: Colors.inkWhite,
  },
  subText: {
    fontSize: 11,
    color: Colors.inkMuted48,
    marginTop: 1,
  },
  subTextActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  waitingPill: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 2,
  },
  waitingPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  waitingPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkMuted80,
  },
  waitingPillTextActive: {
    color: Colors.inkWhite,
  },
});
