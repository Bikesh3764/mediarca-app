import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, TouchTarget } from '@/constants/theme';
import { ALL_SPECIALTIES } from '@/services/api';

export interface SpecialtyPillCarouselProps {
  selectedSpecialty: string;
  onSelectSpecialty: (specialty: string) => void;
  style?: ViewStyle;
}

// Icon mapping for top medical specialties
const SPECIALTY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  All: 'apps-outline',
  'General Medicine': 'medkit-outline',
  Cardiology: 'heart-outline',
  Dermatology: 'sparkles-outline',
  Pediatrics: 'happy-outline',
  Orthopedics: 'body-outline',
  Neurology: 'hardware-chip-outline',
  'Gynecology & Obstetrics': 'female-outline',
  Gastroenterology: 'nutrition-outline',
  Oncology: 'shield-outline',
  Ophthalmology: 'eye-outline',
  'ENT / Otorhinolaryngology': 'ear-outline',
  Pulmonology: 'fitness-outline',
  Nephrology: 'water-outline',
  Dentistry: 'bandage-outline',
  Psychiatry: 'headset-outline',
};

export const SpecialtyPillCarousel: React.FC<SpecialtyPillCarouselProps> = ({
  selectedSpecialty,
  onSelectSpecialty,
  style,
}) => {
  const specialties = ['All', ...ALL_SPECIALTIES];

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {specialties.map((spec) => {
          const isSelected =
            spec === 'All'
              ? !selectedSpecialty || selectedSpecialty === 'All'
              : selectedSpecialty.toLowerCase() === spec.toLowerCase();

          const icon = SPECIALTY_ICONS[spec] || 'fitness-outline';

          return (
            <TouchableOpacity
              key={spec}
              style={[
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillUnselected,
              ]}
              onPress={() => onSelectSpecialty(spec)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={icon}
                size={14}
                color={isSelected ? Colors.inkWhite : Colors.inkMuted80}
              />
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextUnselected,
                ]}
                numberOfLines={1}
              >
                {spec === 'All' ? 'All Specialties' : spec}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.two,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: TouchTarget.minSize,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  pillUnselected: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  pillTextSelected: {
    color: '#ffffff',
  },
  pillTextUnselected: {
    color: Colors.ink,
  },
});
