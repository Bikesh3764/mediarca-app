import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import {
  validateBloodPressure,
  validatePulse,
  validateTemperature,
  validateWeight,
} from '@/services/doctorUtils';

export interface VitalsData {
  bp: string;
  pulse: string;
  temp: string;
  weight: string;
}

export interface VitalsCardProps {
  vitals: VitalsData;
  onChangeVitals: (field: keyof VitalsData, value: string) => void;
  errors?: Partial<Record<keyof VitalsData, string>>;
  editable?: boolean;
  style?: any;
}

export const VitalsCard: React.FC<VitalsCardProps> = ({
  vitals,
  onChangeVitals,
  errors = {},
  editable = true,
  style,
}) => {
  // Live validation checks
  const bpCheck = vitals.bp ? validateBloodPressure(vitals.bp) : null;
  const pulseCheck = vitals.pulse ? validatePulse(vitals.pulse) : null;
  const tempCheck = vitals.temp ? validateTemperature(vitals.temp) : null;
  const weightCheck = vitals.weight ? validateWeight(vitals.weight) : null;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="pulse" size={18} color={Colors.primary} />
          <Text style={styles.titleText}>Patient Vitals</Text>
        </View>
        <Text style={styles.subtitleText}>Clinical Bounds Monitored</Text>
      </View>

      <View style={styles.grid}>
        {/* Blood Pressure Input */}
        <View style={styles.gridItem}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Blood Pressure</Text>
            {bpCheck && bpCheck.isValid ? (
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            ) : null}
          </View>
          <View
            style={[
              styles.inputBox,
              Boolean(errors.bp || (bpCheck && !bpCheck.isValid)) && styles.inputBoxError,
            ]}
          >
            <TextInput
              style={styles.textInput}
              value={vitals.bp}
              onChangeText={(val) => onChangeVitals('bp', val)}
              placeholder="120/80"
              placeholderTextColor={Colors.inkMuted48}
              editable={editable}
              autoCapitalize="none"
            />
            <Text style={styles.unitText}>mmHg</Text>
          </View>
          {errors.bp || (bpCheck && !bpCheck.isValid) ? (
            <Text style={styles.errorText}>
              {errors.bp || bpCheck?.error}
            </Text>
          ) : null}
        </View>

        {/* Pulse / Heart Rate Input */}
        <View style={styles.gridItem}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Pulse / HR</Text>
            {pulseCheck && pulseCheck.isValid ? (
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            ) : null}
          </View>
          <View
            style={[
              styles.inputBox,
              Boolean(errors.pulse || (pulseCheck && !pulseCheck.isValid)) && styles.inputBoxError,
            ]}
          >
            <TextInput
              style={styles.textInput}
              value={vitals.pulse}
              onChangeText={(val) => onChangeVitals('pulse', val)}
              placeholder="72"
              placeholderTextColor={Colors.inkMuted48}
              keyboardType="number-pad"
              editable={editable}
            />
            <Text style={styles.unitText}>bpm</Text>
          </View>
          {errors.pulse || (pulseCheck && !pulseCheck.isValid) ? (
            <Text style={styles.errorText}>
              {errors.pulse || pulseCheck?.error}
            </Text>
          ) : null}
        </View>

        {/* Body Temperature Input */}
        <View style={styles.gridItem}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Temperature</Text>
            {tempCheck && tempCheck.isValid ? (
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            ) : null}
          </View>
          <View
            style={[
              styles.inputBox,
              Boolean(errors.temp || (tempCheck && !tempCheck.isValid)) && styles.inputBoxError,
            ]}
          >
            <TextInput
              style={styles.textInput}
              value={vitals.temp}
              onChangeText={(val) => onChangeVitals('temp', val)}
              placeholder="98.6"
              placeholderTextColor={Colors.inkMuted48}
              keyboardType="decimal-pad"
              editable={editable}
            />
            <Text style={styles.unitText}>°F</Text>
          </View>
          {errors.temp || (tempCheck && !tempCheck.isValid) ? (
            <Text style={styles.errorText}>
              {errors.temp || tempCheck?.error}
            </Text>
          ) : null}
        </View>

        {/* Weight Input */}
        <View style={styles.gridItem}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Body Weight</Text>
            {weightCheck && weightCheck.isValid ? (
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            ) : null}
          </View>
          <View
            style={[
              styles.inputBox,
              Boolean(errors.weight || (weightCheck && !weightCheck.isValid)) && styles.inputBoxError,
            ]}
          >
            <TextInput
              style={styles.textInput}
              value={vitals.weight}
              onChangeText={(val) => onChangeVitals('weight', val)}
              placeholder="68.0"
              placeholderTextColor={Colors.inkMuted48}
              keyboardType="decimal-pad"
              editable={editable}
            />
            <Text style={styles.unitText}>kg</Text>
          </View>
          {errors.weight || (weightCheck && !weightCheck.isValid) ? (
            <Text style={styles.errorText}>
              {errors.weight || weightCheck?.error}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.hairline,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titleText: {
    ...Typography.headline,
    color: Colors.ink,
  },
  subtitleText: {
    ...Typography.caption,
    color: Colors.inkMuted48,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gridItem: {
    width: '47.5%',
    minWidth: 140,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  inputBox: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  inputBoxError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.ink,
    paddingVertical: Spacing.two,
  },
  unitText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.inkMuted48,
    marginLeft: Spacing.one,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 2,
    fontSize: 10.5,
  },
});
