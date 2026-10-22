import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import {
  api,
  getLocalDateString,
  ReceptionistDashboardData,
  ReceptionistLinkedDoctor,
  DoctorSlot,
  Appointment,
} from '@/services/api';
import { validateWalkinPayload } from '@/services/receptionistUtils';
import { useAuth } from '@/context/AuthContext';
import { MustChangePasswordModal } from '@/components/receptionist/MustChangePasswordModal';
import { WalkinConfirmationModal } from '@/components/receptionist/WalkinConfirmationModal';

export default function WalkinScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [deskData, setDeskData] = useState<ReceptionistDashboardData | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  // Form Fields
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [isForOther, setIsForOther] = useState(false);
  const [patientAge, setPatientAge] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');

  // Status
  const [isLoadingDesk, setIsLoadingDesk] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Confirmation Modal
  const [dispensedAppointment, setDispensedAppointment] = useState<Appointment | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const mustChangePassword = Boolean(user?.mustChangePassword);

  const fetchDesk = useCallback(async () => {
    setIsLoadingDesk(true);
    try {
      const data = await api.getMyReceptionist();
      setDeskData(data);
      const docs = data?.doctors || [];
      if (docs.length > 0) {
        setSelectedDoctorId(docs[0].doctorId);
        if (docs[0].slots && docs[0].slots.length > 0) {
          setSelectedSlotId(docs[0].slots[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch receptionist desk profile:', err);
    } finally {
      setIsLoadingDesk(false);
    }
  }, []);

  useEffect(() => {
    fetchDesk();
  }, [fetchDesk]);

  // Update selected slot when doctor changes
  const handleSelectDoctor = (docId: string) => {
    setSelectedDoctorId(docId);
    setFieldErrors((prev) => ({ ...prev, doctorId: '' }));
    const doc = (deskData?.doctors || []).find((d) => d.doctorId === docId);
    if (doc?.slots && doc.slots.length > 0) {
      setSelectedSlotId(doc.slots[0].id);
    } else {
      setSelectedSlotId('');
    }
  };

  const selectedDoctor = (deskData?.doctors || []).find((d) => d.doctorId === selectedDoctorId);

  // Dispense Walk-In Token
  const handleDispenseToken = async () => {
    setFieldErrors({});

    const validation = validateWalkinPayload({
      patientName,
      patientPhone,
      doctorId: selectedDoctorId,
      slotId: selectedSlotId,
      patientAge,
      isForOther,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors as Record<string, string>);
      Alert.alert('Required Fields', validation.message || 'Please check the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const todayStr = getLocalDateString();
      const payload = {
        doctorId: selectedDoctorId,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        gender,
        patientAge: patientAge.trim() || undefined,
        isForOther,
        appointmentDate: todayStr,
        slotId: selectedSlotId || undefined,
        reasonForVisit: reasonForVisit.trim() || 'General OPD Consultation',
        clinicId: deskData?.clinic?.id,
      };

      const res = await api.createWalkinAppointment(payload);
      const appt = res?.data || res;

      // Show instant confirmation modal
      setDispensedAppointment(appt);
      setShowConfirmation(true);

      // Reset form fields
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      setReasonForVisit('');
      setIsForOther(false);
    } catch (err: any) {
      Alert.alert('Dispenser Error', err?.message || 'Failed to dispense walk-in token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaViewContainer scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Back to Desk"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Walk-in Token Dispenser</Text>
            <Text style={styles.headerSubtitle}>
              Rapid counter OPD queue registration
            </Text>
          </View>
        </View>

        {isLoadingDesk ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading practicing doctors...</Text>
          </View>
        ) : (
          <View style={styles.formCard}>
            {/* 1. Doctor Selector */}
            <Text style={styles.fieldSectionLabel}>SELECT PRACTICING DOCTOR</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.doctorChipsScroll}
              style={styles.doctorScrollView}
            >
              {(deskData?.doctors || []).map((doc) => {
                const isSelected = selectedDoctorId === doc.doctorId;
                const raw = doc.fullName || 'Doctor';
                const name = raw.startsWith('Dr.') ? raw : `Dr. ${raw}`;

                return (
                  <TouchableOpacity
                    key={doc.doctorId}
                    style={[
                      styles.docChip,
                      isSelected && styles.docChipActive,
                    ]}
                    onPress={() => handleSelectDoctor(doc.doctorId)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="medkit"
                      size={14}
                      color={isSelected ? Colors.inkWhite : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.docChipText,
                        isSelected && styles.docChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {fieldErrors.doctorId && (
              <Text style={styles.fieldErrorText}>{fieldErrors.doctorId}</Text>
            )}

            {/* 2. Shift / Slot Selector */}
            {selectedDoctor && selectedDoctor.slots && selectedDoctor.slots.length > 0 && (
              <View style={styles.slotSection}>
                <Text style={styles.fieldSectionLabel}>SELECT CLINIC SHIFT</Text>
                <View style={styles.slotRow}>
                  {selectedDoctor.slots.map((slot) => {
                    const isSlotSelected = selectedSlotId === slot.id;
                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.slotChip,
                          isSlotSelected && styles.slotChipActive,
                        ]}
                        onPress={() => setSelectedSlotId(slot.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.slotNameText,
                            isSlotSelected && styles.slotNameTextActive,
                          ]}
                        >
                          {slot.name || 'Shift'}
                        </Text>
                        <Text
                          style={[
                            styles.slotTimeText,
                            isSlotSelected && styles.slotTimeTextActive,
                          ]}
                        >
                          {slot.startTime} - {slot.endTime}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. Patient Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Patient Full Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, fieldErrors.patientName && styles.inputError]}
                placeholder="Enter patient full name"
                placeholderTextColor={Colors.inkMuted48}
                value={patientName}
                onChangeText={(t) => {
                  setPatientName(t);
                  setFieldErrors((prev) => ({ ...prev, patientName: '' }));
                }}
                autoCapitalize="words"
              />
              {fieldErrors.patientName && (
                <Text style={styles.fieldErrorText}>{fieldErrors.patientName}</Text>
              )}
            </View>

            {/* 4. 10-Digit Mobile Number (+91) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Mobile Number (+91 Indian Phone) <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={[styles.phoneInputWrap, fieldErrors.patientPhone && styles.inputError]}>
                <View style={styles.phonePrefixBox}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={Colors.inkMuted48}
                  value={patientPhone}
                  onChangeText={(t) => {
                    const digitsOnly = t.replace(/\D/g, '');
                    setPatientPhone(digitsOnly);
                    setFieldErrors((prev) => ({ ...prev, patientPhone: '' }));
                  }}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
              {fieldErrors.patientPhone && (
                <Text style={styles.fieldErrorText}>{fieldErrors.patientPhone}</Text>
              )}
            </View>

            {/* 5. Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as const).map((g) => {
                  const isG = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, isG && styles.genderChipActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          isG && styles.genderChipTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 6. Dependent / Family Member Toggle */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsForOther((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isForOther ? 'checkbox' : 'square-outline'}
                size={22}
                color={isForOther ? Colors.primary : Colors.inkMuted48}
              />
              <Text style={styles.checkboxLabel}>
                Booking for family member or dependent
              </Text>
            </TouchableOpacity>

            {/* Patient Age (Conditional / Optional) */}
            {(isForOther || patientAge.length > 0) && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Patient Age {isForOther && <Text style={styles.requiredAsterisk}>*</Text>}
                </Text>
                <TextInput
                  style={[styles.textInput, fieldErrors.patientAge && styles.inputError]}
                  placeholder="e.g. 35"
                  placeholderTextColor={Colors.inkMuted48}
                  value={patientAge}
                  onChangeText={(t) => {
                    const d = t.replace(/\D/g, '');
                    setPatientAge(d);
                    setFieldErrors((prev) => ({ ...prev, patientAge: '' }));
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                {fieldErrors.patientAge && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.patientAge}</Text>
                )}
              </View>
            )}

            {/* 7. Reason for Visit */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason for Visit / Symptoms</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="e.g. Fever, Cough, Routine Checkup, Blood Pressure Follow-up..."
                placeholderTextColor={Colors.inkMuted48}
                value={reasonForVisit}
                onChangeText={setReasonForVisit}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Direct Action: Dispense Token */}
            <TouchableOpacity
              style={styles.dispenseBtn}
              onPress={handleDispenseToken}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.inkWhite} />
              ) : (
                <>
                  <Ionicons name="ticket" size={20} color={Colors.inkWhite} />
                  <Text style={styles.dispenseBtnText}>
                    Dispense Token (Generate Live Pass)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Confirmation Modal */}
        <WalkinConfirmationModal
          visible={showConfirmation}
          appointment={dispensedAppointment}
          onClose={() => {
            setShowConfirmation(false);
            setDispensedAppointment(null);
            router.push('/(receptionist)/desk');
          }}
        />

        {/* Password Guard */}
        <MustChangePasswordModal
          visible={mustChangePassword}
          onSuccess={() => fetchDesk()}
        />
      </KeyboardAvoidingView>
    </SafeAreaViewContainer>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.title2,
    fontWeight: '700',
    color: Colors.ink,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted48,
    marginTop: 1,
  },
  loadingBox: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted80,
  },
  formCard: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    ...Shadows.subtle,
  },
  fieldSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkMuted80,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  doctorScrollView: {
    marginBottom: Spacing.sm,
  },
  doctorChipsScroll: {
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.hairline,
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  docChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  docChipText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '600',
    color: Colors.ink,
  },
  docChipTextActive: {
    color: Colors.inkWhite,
  },
  slotSection: {
    marginBottom: Spacing.sm,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  slotChip: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    minHeight: TouchTarget.minHeight,
    justifyContent: 'center',
  },
  slotChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  slotNameText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Colors.ink,
  },
  slotNameTextActive: {
    color: Colors.primary,
  },
  slotTimeText: {
    fontSize: 11,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  slotTimeTextActive: {
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkMuted80,
    marginBottom: 4,
  },
  requiredAsterisk: {
    color: Colors.danger,
  },
  textInput: {
    minHeight: TouchTarget.minHeight,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.body,
    color: Colors.ink,
    backgroundColor: Colors.canvasParchment,
  },
  multilineInput: {
    minHeight: 64,
    textAlignVertical: 'top',
    paddingVertical: Spacing.xs,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.input,
    backgroundColor: Colors.canvasParchment,
    minHeight: TouchTarget.minHeight,
    overflow: 'hidden',
  },
  phonePrefixBox: {
    backgroundColor: Colors.canvasPure,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    borderRightWidth: 1,
    borderRightColor: Colors.hairline,
  },
  phonePrefixText: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.ink,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.body,
    color: Colors.ink,
    minHeight: TouchTarget.minHeight,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  fieldErrorText: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  genderChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderChipText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '600',
    color: Colors.ink,
  },
  genderChipTextActive: {
    color: Colors.inkWhite,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
    minHeight: TouchTarget.minHeight,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.subheadline,
    color: Colors.ink,
    fontWeight: '500',
  },
  dispenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    gap: 8,
    marginTop: Spacing.md,
  },
  dispenseBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
});
