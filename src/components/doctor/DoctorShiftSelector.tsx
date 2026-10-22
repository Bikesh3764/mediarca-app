import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { DoctorSlot, DoctorAffiliationClinic, cleanSlotName } from '@/services/api';

export interface DoctorShiftSelectorProps {
  clinics: DoctorAffiliationClinic[];
  selectedClinicId: string;
  onClinicChange: (clinicId: string) => void;
  slots: DoctorSlot[];
  selectedSlotId: string;
  onShiftChange: (slotId: string) => void;
  style?: any;
}

export const DoctorShiftSelector: React.FC<DoctorShiftSelectorProps> = ({
  clinics,
  selectedClinicId,
  onClinicChange,
  slots,
  selectedSlotId,
  onShiftChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Clinic Selector Row (if doctor practices at clinics) */}
      {clinics && clinics.length > 0 ? (
        <View style={styles.sectionBlock}>
          <View style={styles.labelRow}>
            <Ionicons name="business-outline" size={14} color={Colors.inkMuted48} />
            <Text style={styles.labelText}>ACTIVE CLINIC</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            <TouchableOpacity
              style={[
                styles.clinicChip,
                selectedClinicId === 'all' && styles.clinicChipActive,
              ]}
              onPress={() => onClinicChange('all')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.clinicChipText,
                  selectedClinicId === 'all' && styles.clinicChipTextActive,
                ]}
              >
                All Clinics
              </Text>
            </TouchableOpacity>

            {clinics.map((clinic) => {
              const isActive = selectedClinicId === clinic.clinicId;
              return (
                <TouchableOpacity
                  key={clinic.clinicId}
                  style={[styles.clinicChip, isActive && styles.clinicChipActive]}
                  onPress={() => onClinicChange(clinic.clinicId)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.clinicChipText,
                      isActive && styles.clinicChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {clinic.clinicName || 'Clinic'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Shift Switcher Row */}
      <View style={styles.sectionBlock}>
        <View style={styles.labelRow}>
          <Ionicons name="time-outline" size={14} color={Colors.inkMuted48} />
          <Text style={styles.labelText}>OPD SHIFT</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <TouchableOpacity
            style={[
              styles.shiftChip,
              selectedSlotId === 'all' && styles.shiftChipActive,
            ]}
            onPress={() => onShiftChange('all')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.shiftChipText,
                selectedSlotId === 'all' && styles.shiftChipTextActive,
              ]}
            >
              All Shifts
            </Text>
          </TouchableOpacity>

          {slots && slots.length > 0 ? (
            slots.map((slot, index) => {
              const isActive = selectedSlotId === slot.id;
              const title = cleanSlotName(slot.name, `Shift ${index + 1}`);
              const timeRange = slot.startTime && slot.endTime ? ` (${slot.startTime}-${slot.endTime})` : '';

              return (
                <TouchableOpacity
                  key={slot.id || index}
                  style={[styles.shiftChip, isActive && styles.shiftChipActive]}
                  onPress={() => onShiftChange(slot.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.shiftChipText,
                      isActive && styles.shiftChipTextActive,
                    ]}
                  >
                    {title}{timeRange}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <TouchableOpacity
              style={[styles.shiftChip, styles.shiftChipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.shiftChipText, styles.shiftChipTextActive]}>
                General OPD
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  sectionBlock: {
    gap: Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  labelText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.inkMuted48,
    letterSpacing: 0.5,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: 2,
  },
  clinicChip: {
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  clinicChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  clinicChipText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.ink,
  },
  clinicChipTextActive: {
    color: Colors.inkWhite,
  },
  shiftChip: {
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  shiftChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  shiftChipText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.ink,
  },
  shiftChipTextActive: {
    color: Colors.inkWhite,
  },
});
