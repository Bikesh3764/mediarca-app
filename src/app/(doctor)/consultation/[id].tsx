import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Header } from '@/components/common/Header';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import {
  api,
  Appointment,
} from '@/services/api';
import { formatIndianPhone } from '@/utils/phoneUtils';
import {
  validateAllVitals,
  isPatientArrivalVerified,
} from '@/services/doctorUtils';
import { VitalsCard, VitalsData } from '@/components/doctor/VitalsCard';

export default function DoctorConsultationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Vitals State
  const [vitals, setVitals] = useState<VitalsData>({
    bp: '',
    pulse: '',
    temp: '',
    weight: '',
  });
  const [vitalsErrors, setVitalsErrors] = useState<Partial<Record<keyof VitalsData, string>>>({});

  // Clinical Diagnosis & Notes
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [advice, setAdvice] = useState('');

  // Fetch Appointment Details
  const fetchAppointment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.getAppointmentById(id);
      if (data) {
        setAppointment(data);

        // Prepopulate diagnosis & notes if exist
        if ((data as any).diagnosis) setDiagnosis((data as any).diagnosis);
        if (data.clinicalNotes) setClinicalNotes(data.clinicalNotes);
        if ((data as any).advice) setAdvice((data as any).advice);

        // Prepopulate vitals if exist
        if (data.vitals) {
          try {
            const parsed =
              typeof data.vitals === 'object' ? data.vitals : JSON.parse(data.vitals);
            setVitals({
              bp: parsed.bp || '',
              pulse: parsed.pulse ? String(parsed.pulse) : '',
              temp: parsed.temp ? String(parsed.temp) : '',
              weight: parsed.weight ? String(parsed.weight) : '',
            });
          } catch {
            // Ignore parse error
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load encounter record');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const handleVitalsChange = (field: keyof VitalsData, value: string) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
    setVitalsErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Draft Save
  const handleSaveDraft = async () => {
    if (!appointment) return;
    setSavingDraft(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate vitals before saving
    const validation = validateAllVitals(vitals);
    if (!validation.isValid) {
      setVitalsErrors(validation.errors);
      setSavingDraft(false);
      Alert.alert('Clinical Validation Error', 'Please check clinical bounds on vitals.');
      return;
    }

    try {
      const cleanVitals = (vitals.bp || vitals.pulse || vitals.temp || vitals.weight)
        ? {
            bp: vitals.bp.trim() || undefined,
            pulse: vitals.pulse.trim() || undefined,
            temp: vitals.temp.trim() || undefined,
            weight: vitals.weight.trim() || undefined,
          }
        : undefined;

      await api.updateNotes({
        appointmentId: appointment.id,
        clinicalNotes: clinicalNotes.trim(),
        diagnosis: diagnosis.trim() || undefined,
        advice: advice.trim() || undefined,
        vitals: cleanVitals,
      });

      setSuccessMsg('Consultation notes draft saved.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save draft notes.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit completion payload to backend
  const submitCompletion = async () => {
    if (!appointment) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const cleanVitals = (vitals.bp || vitals.pulse || vitals.temp || vitals.weight)
        ? {
            bp: vitals.bp.trim() || undefined,
            pulse: vitals.pulse.trim() || undefined,
            temp: vitals.temp.trim() || undefined,
            weight: vitals.weight.trim() || undefined,
          }
        : undefined;

      // Calls api.completeAppointment
      await api.completeAppointment({
        appointmentId: appointment.id,
        diagnosis: diagnosis.trim() || undefined,
        clinicalNotes: clinicalNotes.trim() || undefined,
        advice: advice.trim() || undefined,
        vitals: cleanVitals,
      });

      Alert.alert(
        'Consultation Completed',
        'Patient consultation is complete. Patient is directed to the front desk for physical prescription collection and checkout.',
        [
          {
            text: 'Return to Queue',
            onPress: () => router.replace('/(doctor)/queue'),
          },
        ]
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete consultation.');
      setSubmitting(false);
    }
  };

  // One-Tap Complete & Finish Consultation
  const handleCompleteConsultation = async () => {
    if (!appointment) return;

    // Validate vitals
    const validation = validateAllVitals(vitals);
    if (!validation.isValid) {
      setVitalsErrors(validation.errors);
      Alert.alert(
        'Vitals Validation Error',
        'One or more vitals are outside permitted clinical bounds. Please correct before completing.'
      );
      return;
    }

    if (!isPatientArrivalVerified(appointment)) {
      Alert.alert(
        'Arrival Not Verified',
        'This patient has not yet checked in at the clinic desk. Finalizing the encounter may be rejected by the healthcare network until arrival is marked.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete Anyway',
            onPress: () => submitCompletion(),
          },
        ]
      );
      return;
    }

    await submitCompletion();
  };

  if (loading) {
    return (
      <SafeAreaViewContainer>
        <Header title="Consultation Room" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Opening patient encounter...</Text>
        </View>
      </SafeAreaViewContainer>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaViewContainer>
        <Header title="Consultation Room" showBack />
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={styles.emptyTitle}>Encounter Not Found</Text>
          <Text style={styles.emptySubtitle}>
            This appointment could not be retrieved from the healthcare database.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Return to Queue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaViewContainer>
    );
  }

  const patientName =
    appointment.patientName ||
    appointment.patient?.user?.fullName ||
    'Patient';

  const tokenNum = appointment.queueNumber || (appointment as any).tokenNumber || (appointment as any).token;
  const tokenDisplay = tokenNum ? `#${tokenNum}` : '#--';
  const phone = appointment.patientPhone || appointment.patient?.user?.phone;
  const rawGender = appointment.patientGender;
  const rawAge = appointment.patientAge;
  const complaint = appointment.reasonForVisit || appointment.symptoms || (appointment as any).chiefComplaint;
  const isCheckedIn = isPatientArrivalVerified(appointment);
  const isCompleted = (appointment.status || '').toUpperCase() === 'COMPLETED';

  return (
    <SafeAreaViewContainer>
      <Header
        title={`Consultation: ${tokenDisplay}`}
        subtitle={patientName}
        showBack
        rightElement={
          !isCompleted ? (
            <TouchableOpacity
              style={styles.saveDraftBtn}
              onPress={handleSaveDraft}
              disabled={savingDraft || submitting}
              activeOpacity={0.75}
            >
              {savingDraft ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={16} color={Colors.primary} />
                  <Text style={styles.saveDraftBtnText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Notifications / Alerts */}
          {errorMsg ? (
            <View style={styles.alertBannerError}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.alertBannerErrorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.alertBannerSuccess}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.successDark} />
              <Text style={styles.alertBannerSuccessText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* 1. Patient Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeaderRow}>
              <View style={styles.tokenTag}>
                <Text style={styles.tokenTagText}>{tokenDisplay}</Text>
              </View>

              <View style={styles.arrivalTagGroup}>
                {isCheckedIn ? (
                  <View style={styles.arrivalPillVerified}>
                    <View style={styles.greenDot} />
                    <Text style={styles.arrivalPillVerifiedText}>Checked In at Desk</Text>
                  </View>
                ) : (
                  <View style={styles.arrivalPillPending}>
                    <Text style={styles.arrivalPillPendingText}>Not Checked In</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.patientFullName}>{patientName}</Text>

            <View style={styles.demographicsRow}>
              {rawAge ? (
                <View style={styles.demoChip}>
                  <Text style={styles.demoChipText}>Age: {rawAge} yrs</Text>
                </View>
              ) : null}

              {rawGender ? (
                <View style={styles.demoChip}>
                  <Text style={styles.demoChipText}>Gender: {rawGender}</Text>
                </View>
              ) : null}

              {phone ? (
                <View style={styles.demoChip}>
                  <Ionicons name="call-outline" size={12} color={Colors.inkMuted80} />
                  <Text style={styles.demoChipText}>{formatIndianPhone(phone)}</Text>
                </View>
              ) : null}
            </View>

            {complaint ? (
              <View style={styles.complaintContainer}>
                <Text style={styles.complaintHeader}>Chief Complaint / Symptoms</Text>
                <Text style={styles.complaintBody}>{complaint}</Text>
              </View>
            ) : null}
          </View>

          {/* 2. Vitals Input Card */}
          <VitalsCard
            vitals={vitals}
            onChangeVitals={handleVitalsChange}
            errors={vitalsErrors}
            editable={!isCompleted}
          />

          {/* 3. Clinical Diagnosis & Clinical Notes */}
          <View style={styles.clinicalNotesCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Clinical Diagnosis & Notes</Text>
            </View>

            {/* Diagnosis Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Primary Diagnosis / Assessment</Text>
              <TextInput
                style={styles.diagnosisInput}
                value={diagnosis}
                onChangeText={setDiagnosis}
                placeholder="e.g. Acute Viral Bronchitis, Essential Hypertension"
                placeholderTextColor={Colors.inkMuted48}
                editable={!isCompleted}
              />
            </View>

            {/* Clinical Notes Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Doctor Clinical Notes & Observations</Text>
              <TextInput
                style={styles.notesTextArea}
                value={clinicalNotes}
                onChangeText={setClinicalNotes}
                placeholder="Clinical observations, findings, chest auscultation, follow-up advice..."
                placeholderTextColor={Colors.inkMuted48}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isCompleted}
              />
            </View>

            {/* Patient Advice */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Advice / Instructions for Patient</Text>
              <TextInput
                style={styles.adviceInput}
                value={advice}
                onChangeText={setAdvice}
                placeholder="e.g. Adequate hydration, avoid cold exposure, review in 5 days"
                placeholderTextColor={Colors.inkMuted48}
                editable={!isCompleted}
              />
            </View>
          </View>

          {/* 4. Front Desk Prescription Collection Notice */}
          <View style={styles.frontDeskNotice}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <View style={styles.frontDeskNoticeTextCol}>
              <Text style={styles.frontDeskNoticeTitle}>Physical Prescription Handover</Text>
              <Text style={styles.frontDeskNoticeDesc}>
                Completing this visit will notify the clinic front desk to print or verify the patient's physical prescription sheet upon desk exit.
              </Text>
            </View>
          </View>

          {/* 5. Complete & Finish Consultation Action */}
          {!isCompleted ? (
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={handleCompleteConsultation}
              disabled={submitting || savingDraft}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.inkWhite} />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color={Colors.inkWhite} />
                  <Text style={styles.finishBtnText}>Complete & Finish Consultation</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.completedNotice}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.successDark} />
              <Text style={styles.completedNoticeText}>
                Consultation completed and encounter closed.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaViewContainer>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  saveDraftBtnText: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.primary,
  },
  alertBannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.two,
  },
  alertBannerErrorText: {
    ...Typography.footnote,
    color: Colors.danger,
    flex: 1,
  },
  alertBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.two,
  },
  alertBannerSuccessText: {
    ...Typography.footnote,
    color: Colors.successDark,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.hairline,
    ...Shadows.card,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  tokenTag: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  tokenTagText: {
    ...Typography.headline,
    fontWeight: '800',
    color: Colors.ink,
  },
  arrivalTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrivalPillVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 5,
    borderWidth: 1,
    borderColor: '#c2f0d4',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  arrivalPillVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
  },
  arrivalPillPending: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  arrivalPillPendingText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.inkMuted48,
  },
  patientFullName: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: Spacing.two,
  },
  demographicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
    marginBottom: Spacing.three,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  demoChipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  complaintContainer: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  complaintHeader: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.inkMuted48,
    marginBottom: 2,
  },
  complaintBody: {
    ...Typography.body,
    color: Colors.ink,
  },
  clinicalNotesCard: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.hairline,
    ...Shadows.card,
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  cardTitle: {
    ...Typography.headline,
    color: Colors.ink,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  diagnosisInput: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.three,
    ...Typography.body,
    color: Colors.ink,
  },
  notesTextArea: {
    minHeight: 90,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.three,
    ...Typography.body,
    color: Colors.ink,
  },
  adviceInput: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.three,
    ...Typography.body,
    color: Colors.ink,
  },
  frontDeskNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#cce0f5',
  },
  frontDeskNoticeTextCol: {
    flex: 1,
    gap: 2,
  },
  frontDeskNoticeTitle: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  frontDeskNoticeDesc: {
    ...Typography.caption,
    color: Colors.primaryDark,
    lineHeight: 16,
  },
  finishBtn: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    ...Shadows.card,
  },
  finishBtnText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    padding: Spacing.four,
    borderRadius: BorderRadius.pill,
    gap: Spacing.two,
  },
  completedNoticeText: {
    ...Typography.bodyBold,
    color: Colors.successDark,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.inkMuted48,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.seven,
    gap: Spacing.three,
  },
  emptyTitle: {
    ...Typography.title2,
    color: Colors.ink,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.inkMuted48,
    textAlign: 'center',
  },
  backBtn: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
});
