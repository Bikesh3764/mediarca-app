import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Doctor,
  Appointment,
  QueuePreview,
  api,
  getLocalDateString,
  getTomorrowDateString,
  getDayOfWeekCode,
  parseDoctorSlots,
  cleanSlotName,
  format12Hour,
  formatDoctorDegrees,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { AppCard } from '@/components/ui/AppCard';
import {
  Colors,
  Spacing,
  BorderRadius,
  TouchTarget,
  Shadows,
} from '@/constants/theme';
import { toTelUri, formatDisplayPhone } from '@/utils/phoneUtils';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { id, clinicId: initialClinicId } = useLocalSearchParams<{ id: string; clinicId?: string }>();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState<string>(initialClinicId || '');
  const [appointmentDate, setAppointmentDate] = useState<string>(getLocalDateString());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [queuePreview, setQueuePreview] = useState<QueuePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Patient Info State
  const [bookingFor, setBookingFor] = useState<'myself' | 'dependent'>('myself');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // UI & Flow State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // 1. Fetch Doctor details
  const fetchDoctor = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getDoctorById(id);
      setDoctor(data);

      const targetClinic = initialClinicId
        ? data.clinics?.find((c) => c.clinicId === initialClinicId)
        : data.clinics?.[0];

      const cId = targetClinic?.clinicId || data.clinics?.[0]?.clinicId || '';
      setSelectedClinicId(cId);

      const clinicSlots =
        targetClinic?.slots && targetClinic.slots.length > 0
          ? targetClinic.slots
          : parseDoctorSlots(data);

      if (clinicSlots.length > 0) {
        setSelectedSlotId(clinicSlots[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load doctor profile.');
    } finally {
      setLoading(false);
    }
  }, [id, initialClinicId]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  // 2. Fetch Live Queue Preview whenever Date, Slot, or Clinic changes
  const fetchQueuePreview = useCallback(async () => {
    if (!id || !appointmentDate) return;
    setPreviewLoading(true);
    try {
      const preview = await api.getQueuePreview(
        id,
        appointmentDate,
        selectedSlotId || undefined,
        selectedClinicId || undefined
      );
      setQueuePreview(preview);
      if (preview.selectedSlotId && (!selectedSlotId || (preview.isPassed && preview.selectedSlotId !== selectedSlotId))) {
        setSelectedSlotId(preview.selectedSlotId);
      }
    } catch (err) {
      console.warn('Queue preview fetch failed:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [id, appointmentDate, selectedSlotId, selectedClinicId]);

  useEffect(() => {
    if (doctor) {
      fetchQueuePreview();
    }
  }, [doctor, fetchQueuePreview]);

  // Derived Doctor Values
  const selectedClinic =
    doctor?.clinics?.find((c) => c.clinicId === selectedClinicId) ||
    doctor?.clinics?.[0];
  const activeFee = selectedClinic?.consultationFee ?? queuePreview?.consultationFee ?? doctor?.consultationFee ?? 0;
  const activeSlots =
    selectedClinic?.slots && selectedClinic.slots.length > 0
      ? selectedClinic.slots
      : doctor ? parseDoctorSlots(doctor) : [];

  const workingDays =
    queuePreview?.workingDays ||
    ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Generate 7 upcoming dates with IST calendar arithmetic
  const upcomingDates = useMemo(() => {
    const dates: Array<{ dateStr: string; dayName: string; dayNum: string; isSitting: boolean }> = [];
    const base = new Date();

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = getLocalDateString(targetDate);
      const dayCode = getDayOfWeekCode(dateStr);
      const isSitting = workingDays.includes(dayCode);

      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayCode.slice(0, 3);
      const dayNum = dateStr.split('-')[2];

      dates.push({ dateStr, dayName, dayNum, isSitting });
    }
    return dates;
  }, [workingDays]);

  // Slot status checks
  const isSelectedSlotOnLeave = Boolean(queuePreview?.isOnLeave);
  const isSelectedSlotDayOff = Boolean(queuePreview?.isDayOff);
  const isSelectedSlotPassed = Boolean(queuePreview?.isPassed && !isSelectedSlotOnLeave && !isSelectedSlotDayOff);
  const isSelectedSlotFull = Boolean(queuePreview?.isFull);

  // Attached receptionists resolution
  const deskPhone =
    selectedClinic?.clinic?.phone ||
    doctor?.receptionists?.[0]?.phone ||
    null;
  const deskName =
    selectedClinic?.clinic?.clinicName
      ? `${selectedClinic.clinic.clinicName} Desk`
      : 'Front Desk Receptionist';

  // Handle Booking Submission
  const handleBookingSubmit = async () => {
    if (!doctor) return;
    setErrorMessage(null);

    // Dependent validation
    if (bookingFor === 'dependent') {
      if (!patientName.trim()) {
        setErrorMessage('Please enter the patient full name.');
        return;
      }
      if (!patientAge.trim()) {
        setErrorMessage('Please enter the patient age.');
        return;
      }
      const ageNum = parseInt(patientAge.trim(), 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 125) {
        setErrorMessage('Please enter a valid age between 0 and 125.');
        return;
      }
    }

    if (isSelectedSlotOnLeave) {
      setErrorMessage('Doctor is on leave on this date. Please select another date.');
      return;
    }

    if (isSelectedSlotDayOff) {
      setErrorMessage('Doctor is off on this weekday. Please select a practice day.');
      return;
    }

    if (isSelectedSlotPassed) {
      setErrorMessage('This shift has already ended for today. Please pick an upcoming shift.');
      return;
    }

    if (isSelectedSlotFull) {
      setErrorMessage('This shift is fully booked. Please select another shift or date.');
      return;
    }

    setSubmitting(true);
    try {
      const isForOther = bookingFor === 'dependent';
      const appt = await api.bookAppointment({
        doctorId: doctor.id,
        clinicId: selectedClinicId || undefined,
        appointmentDate,
        slotId: selectedSlotId || undefined,
        reasonForVisit: reasonForVisit.trim() || 'General Medical Consultation',
        symptoms: symptoms.trim() || undefined,
        isForOther,
        patientName: isForOther ? patientName.trim() : (user?.fullName || 'Patient'),
        patientAge: isForOther ? patientAge.trim() : undefined,
        patientGender: isForOther ? patientGender : undefined,
      });

      setConfirmedAppointment(appt);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete appointment booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallReceptionist = () => {
    if (!deskPhone) return;
    Linking.openURL(toTelUri(deskPhone)).catch((err) =>
      console.warn('Failed to dial receptionist:', err)
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Initializing booking engine...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.errorTitle}>Doctor Not Found</Text>
        <TouchableOpacity
          style={styles.backButtonPill}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonPillText}>Back to Discovery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =========================================================================
  // SUCCESS CONFIRMATION VIEW (Zero-Upfront Policy + Receptionist Call)
  // =========================================================================
  if (confirmedAppointment) {
    const estToken =
      confirmedAppointment.estimatedQueueNumber ||
      (confirmedAppointment.queueNumber > 0 ? confirmedAppointment.queueNumber : 1);

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: insets.bottom + 40 },
          ]}
        >
          <AppCard style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.primary} />
            </View>

            <Text style={styles.successSubHeader}>REQUEST SUBMITTED</Text>
            <Text style={styles.successHeader}>Pending Desk Approval</Text>
            <Text style={styles.successDateSub}>
              {confirmedAppointment.appointmentDate} ·{' '}
              {cleanSlotName(confirmedAppointment.checkingWindow)}
            </Text>

            {/* Estimated Token Badge */}
            <View style={styles.tokenPill}>
              <Text style={styles.tokenPillLabel}>Estimated Token</Text>
              <Text style={styles.tokenPillNumber}>#{estToken}</Text>
            </View>

            {/* Zero-Upfront Payment Disclosure Notice */}
            <View style={styles.paymentDisclosureBox}>
              <View style={styles.disclosureHeader}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.disclosureTitle}>
                  Zero-Upfront Payment Policy
                </Text>
              </View>
              <Text style={styles.disclosureText}>
                No payment was required right now. Pay ₹{activeFee} directly to
                the receptionist via UPI or in cash upon arrival to confirm your
                queue token.
              </Text>
            </View>

            {/* Receptionist Contact & Direct Dialer */}
            <View style={styles.receptionistCard}>
              <Text style={styles.deskLabel}>CLINIC RECEPTIONIST</Text>
              <Text style={styles.deskNameText}>{deskName}</Text>
              <Text style={styles.deskClinicText}>
                {selectedClinic?.clinic?.clinicName} ·{' '}
                {selectedClinic?.clinic?.address}
              </Text>

              {deskPhone ? (
                <TouchableOpacity
                  style={styles.callDeskButton}
                  onPress={handleCallReceptionist}
                  activeOpacity={0.85}
                >
                  <Ionicons name="call" size={16} color={Colors.inkWhite} />
                  <Text style={styles.callDeskText}>
                    Call Desk: {formatDisplayPhone(deskPhone)}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.deskNoticeText}>
                  Please present your estimated token at the clinic front desk.
                </Text>
              )}
            </View>

            {/* Bottom Actions */}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => router.replace('/explore')}
              activeOpacity={0.85}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </AppCard>
        </ScrollView>
      </View>
    );
  }

  // =========================================================================
  // STEP-BY-STEP BOOKING FORM
  // =========================================================================
  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.navBackButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Book Consultation</Text>
        <View style={styles.navRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        {/* Doctor Summary Banner */}
        <AppCard style={styles.doctorBanner}>
          <Text style={styles.bannerDoctorName}>
            {doctor.user?.fullName?.startsWith('Dr.')
              ? doctor.user.fullName
              : `Dr. ${doctor.user?.fullName}`}
          </Text>
          <Text style={styles.bannerSpecialty}>
            {doctor.specialty} · {formatDoctorDegrees(doctor.qualifications)}
          </Text>
        </AppCard>

        {/* Step 1: Clinic Selector (if multi-clinic) */}
        {doctor.clinics && doctor.clinics.length > 1 && (
          <AppCard style={styles.stepCard}>
            <View style={styles.stepTitleRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Select Clinic Venue</Text>
            </View>

            <View style={styles.clinicOptionsList}>
              {doctor.clinics.map((cd) => {
                const isSelected = selectedClinicId === cd.clinicId;
                const cFee = cd.consultationFee ?? doctor.consultationFee;
                return (
                  <TouchableOpacity
                    key={cd.clinicId}
                    style={[
                      styles.clinicOption,
                      isSelected && styles.clinicOptionSelected,
                    ]}
                    onPress={() => setSelectedClinicId(cd.clinicId)}
                  >
                    <View style={styles.clinicOptionLeft}>
                      <Text style={styles.clinicOptionName}>
                        {cd.clinic.clinicName}
                      </Text>
                      <Text style={styles.clinicOptionAddr}>
                        {cd.clinic.address}
                      </Text>
                    </View>
                    <View style={styles.clinicOptionRight}>
                      <Text style={styles.clinicOptionFee}>₹{cFee}</Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={Colors.primary}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </AppCard>
        )}

        {/* Step 2: Date Selector */}
        <AppCard style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {doctor.clinics && doctor.clinics.length > 1 ? '2' : '1'}
              </Text>
            </View>
            <Text style={styles.stepTitle}>Select Date (IST)</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {upcomingDates.map(({ dateStr, dayName, dayNum, isSitting }) => {
              const isSelected = appointmentDate === dateStr;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.datePill,
                    isSelected && styles.datePillSelected,
                    !isSitting && styles.datePillDisabled,
                  ]}
                  disabled={!isSitting}
                  onPress={() => setAppointmentDate(dateStr)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.datePillDayName,
                      isSelected && styles.datePillTextSelected,
                      !isSitting && styles.datePillTextDisabled,
                    ]}
                  >
                    {dayName}
                  </Text>
                  <Text
                    style={[
                      styles.datePillDayNum,
                      isSelected && styles.datePillTextSelected,
                      !isSitting && styles.datePillTextDisabled,
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {!isSitting && (
                    <Text style={styles.datePillOffLabel}>Off</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </AppCard>

        {/* Step 3: Shift Selector with Live Capacity Indicator */}
        <AppCard style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {doctor.clinics && doctor.clinics.length > 1 ? '3' : '2'}
              </Text>
            </View>
            <Text style={styles.stepTitle}>Select Shift & Capacity</Text>
          </View>

          {previewLoading ? (
            <View style={styles.slotLoadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.slotLoadingText}>
                Checking live shift availability...
              </Text>
            </View>
          ) : (
            <View style={styles.slotsContainer}>
              {activeSlots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                const statusRes = queuePreview?.availableSlots?.find(
                  (s) => s.slot.id === slot.id
                );

                const isFull = Boolean(statusRes?.isFull);
                const isEnded = Boolean(statusRes?.isPassed);

                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotOption,
                      isSelected && styles.slotOptionSelected,
                      (isEnded || isFull) && styles.slotOptionUnavailable,
                    ]}
                    disabled={isEnded || isFull}
                    onPress={() => setSelectedSlotId(slot.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.slotOptionLeft}>
                      <Text style={styles.slotOptionName}>
                        {cleanSlotName(slot.name)}
                      </Text>
                      <Text style={styles.slotOptionTimings}>
                        {format12Hour(slot.startTime)} – {format12Hour(slot.endTime)}
                      </Text>
                    </View>

                    <View style={styles.slotOptionRight}>
                      {isEnded ? (
                        <View style={styles.slotStatusPillEnded}>
                          <Text style={styles.slotStatusTextEnded}>Ended</Text>
                        </View>
                      ) : isFull ? (
                        <View style={styles.slotStatusPillFull}>
                          <Text style={styles.slotStatusTextFull}>Full</Text>
                        </View>
                      ) : (
                        <View style={styles.slotStatusPillAvailable}>
                          <Text style={styles.slotStatusTextAvailable}>Available</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Dynamic Queue Preview Metrics */}
              {queuePreview && (
                <View style={styles.queuePreviewBox}>
                  <View style={styles.queuePreviewMetric}>
                    <Text style={styles.queuePreviewLabel}>Next Token</Text>
                    <Text style={styles.queuePreviewVal}>
                      #{queuePreview.nextQueueNumber || 1}
                    </Text>
                  </View>
                  <View style={styles.queuePreviewDivider} />
                  <View style={styles.queuePreviewMetric}>
                    <Text style={styles.queuePreviewLabel}>Ahead in Queue</Text>
                    <Text style={styles.queuePreviewVal}>
                      {queuePreview.patientsAhead || 0}
                    </Text>
                  </View>
                  <View style={styles.queuePreviewDivider} />
                  <View style={styles.queuePreviewMetric}>
                    <Text style={styles.queuePreviewLabel}>Est. Consultation</Text>
                    <Text style={styles.queuePreviewVal}>
                      {queuePreview.estimatedTime || 'On Schedule'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </AppCard>

        {/* Step 4: Patient Details (Self vs Family Member/Dependent) */}
        <AppCard style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {doctor.clinics && doctor.clinics.length > 1 ? '4' : '3'}
              </Text>
            </View>
            <Text style={styles.stepTitle}>Patient Information</Text>
          </View>

          {/* Toggle Self vs Dependent */}
          <View style={styles.segmentTrack}>
            <TouchableOpacity
              style={[
                styles.segmentItem,
                bookingFor === 'myself' && styles.segmentItemSelected,
              ]}
              onPress={() => setBookingFor('myself')}
            >
              <Text
                style={[
                  styles.segmentText,
                  bookingFor === 'myself' && styles.segmentTextSelected,
                ]}
              >
                Book for Myself
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentItem,
                bookingFor === 'dependent' && styles.segmentItemSelected,
              ]}
              onPress={() => setBookingFor('dependent')}
            >
              <Text
                style={[
                  styles.segmentText,
                  bookingFor === 'dependent' && styles.segmentTextSelected,
                ]}
              >
                Book for Dependent
              </Text>
            </TouchableOpacity>
          </View>

          {/* Self Profile View */}
          {bookingFor === 'myself' ? (
            <View style={styles.selfBox}>
              <Ionicons
                name="person-circle-outline"
                size={36}
                color={Colors.primary}
              />
              <View style={styles.selfInfo}>
                <Text style={styles.selfName}>
                  {user?.fullName || 'Logged-In Patient'}
                </Text>
                <Text style={styles.selfSub}>
                  {user?.phone || user?.email || 'Self-Booking'}
                </Text>
              </View>
            </View>
          ) : (
            /* Dependent Input Form */
            <View style={styles.dependentForm}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Patient Full Name *</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Rahul Deshmukh"
                  placeholderTextColor={Colors.inkMuted48}
                  value={patientName}
                  onChangeText={setPatientName}
                />
              </View>

              <View style={styles.dependentRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Age (Years) *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. 28"
                    placeholderTextColor={Colors.inkMuted48}
                    keyboardType="number-pad"
                    maxLength={3}
                    value={patientAge}
                    onChangeText={setPatientAge}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.genderRow}>
                    {(['Male', 'Female', 'Other'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderOption,
                          patientGender === g && styles.genderOptionSelected,
                        ]}
                        onPress={() => setPatientGender(g)}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            patientGender === g && styles.genderOptionTextSelected,
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}
        </AppCard>

        {/* Step 5: Reason for Visit & Symptoms */}
        <AppCard style={styles.stepCard}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {doctor.clinics && doctor.clinics.length > 1 ? '5' : '4'}
              </Text>
            </View>
            <Text style={styles.stepTitle}>Reason & Symptoms</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Reason for Visit</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Routine consultation, checkup, fever"
              placeholderTextColor={Colors.inkMuted48}
              value={reasonForVisit}
              onChangeText={setReasonForVisit}
            />
          </View>

          <View style={[styles.fieldGroup, { marginTop: Spacing.two }]}>
            <Text style={styles.fieldLabel}>Symptoms (Optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMultiline]}
              placeholder="Describe any active symptoms (optional)..."
              placeholderTextColor={Colors.inkMuted48}
              multiline
              numberOfLines={3}
              value={symptoms}
              onChangeText={setSymptoms}
            />
          </View>
        </AppCard>

        {/* Step 6: Zero-Upfront Payment Disclosure Card */}
        <AppCard style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.policyTitle}>Zero-Upfront Payment Policy</Text>
          </View>
          <Text style={styles.policyBody}>
            No payment required now. An estimated token will be issued. Pay ₹{activeFee} directly to the clinic receptionist via UPI or at the desk to confirm your appointment.
          </Text>
        </AppCard>

        {/* Error Callout */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.danger} />
            <Text style={styles.errorBoxText}>{errorMessage}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomFeeCol}>
          <Text style={styles.bottomFeeLabel}>Consultation Fee</Text>
          <Text style={styles.bottomFeeValue}>₹{activeFee}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || isSelectedSlotOnLeave || isSelectedSlotDayOff || isSelectedSlotPassed || isSelectedSlotFull) &&
              styles.submitButtonDisabled,
          ]}
          disabled={
            submitting ||
            isSelectedSlotOnLeave ||
            isSelectedSlotDayOff ||
            isSelectedSlotPassed ||
            isSelectedSlotFull
          }
          onPress={handleBookingSubmit}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.inkWhite} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Request Token</Text>
              <Ionicons name="checkmark" size={16} color={Colors.inkWhite} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasParchment,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
    backgroundColor: Colors.canvasParchment,
  },
  loadingText: {
    marginTop: Spacing.three,
    fontSize: 13,
    color: Colors.inkMuted80,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: Spacing.three,
  },
  backButtonPill: {
    marginTop: Spacing.four,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
  },
  backButtonPillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  navBackButton: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  navRightPlaceholder: {
    width: TouchTarget.minSize,
  },
  scrollBody: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  doctorBanner: {
    padding: Spacing.three,
    backgroundColor: '#ffffff',
  },
  bannerDoctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
  },
  bannerSpecialty: {
    fontSize: 12,
    color: Colors.inkMuted80,
    marginTop: 2,
  },
  stepCard: {
    padding: Spacing.four,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: Colors.inkWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  clinicOptionsList: {
    gap: Spacing.two,
  },
  clinicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  clinicOptionSelected: {
    backgroundColor: '#ffffff',
    borderColor: Colors.primary,
  },
  clinicOptionLeft: {
    flex: 1,
  },
  clinicOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  clinicOptionAddr: {
    fontSize: 11,
    color: Colors.inkMuted80,
    marginTop: 2,
  },
  clinicOptionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  clinicOptionFee: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  dateStrip: {
    gap: Spacing.two,
  },
  datePill: {
    width: 58,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  datePillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  datePillDisabled: {
    opacity: 0.45,
  },
  datePillDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  datePillDayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
  },
  datePillTextSelected: {
    color: Colors.inkWhite,
  },
  datePillTextDisabled: {
    color: Colors.inkMuted48,
  },
  datePillOffLabel: {
    fontSize: 9,
    color: Colors.danger,
    fontWeight: '600',
  },
  slotLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.three,
  },
  slotLoadingText: {
    fontSize: 12,
    color: Colors.inkMuted80,
  },
  slotsContainer: {
    gap: Spacing.two,
  },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  slotOptionSelected: {
    backgroundColor: '#ffffff',
    borderColor: Colors.primary,
  },
  slotOptionUnavailable: {
    opacity: 0.5,
  },
  slotOptionLeft: {
    gap: 2,
  },
  slotOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  slotOptionTimings: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  slotOptionRight: {},
  slotStatusPillAvailable: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#ecfdf5',
  },
  slotStatusTextAvailable: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  slotStatusPillEnded: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#f5f5f7',
  },
  slotStatusTextEnded: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8e8e93',
  },
  slotStatusPillFull: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#fff1f2',
  },
  slotStatusTextFull: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e11d48',
  },
  queuePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  queuePreviewMetric: {
    alignItems: 'center',
  },
  queuePreviewLabel: {
    fontSize: 10,
    color: Colors.inkMuted48,
    fontWeight: '500',
  },
  queuePreviewVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 2,
  },
  queuePreviewDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e5ea',
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: Spacing.three,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemSelected: {
    backgroundColor: '#ffffff',
    ...Shadows.subtle,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.inkMuted80,
  },
  segmentTextSelected: {
    fontWeight: '700',
    color: Colors.ink,
  },
  selfBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.md,
  },
  selfInfo: {
    flex: 1,
  },
  selfName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  selfSub: {
    fontSize: 12,
    color: Colors.inkMuted80,
    marginTop: 2,
  },
  dependentForm: {
    gap: Spacing.two,
  },
  dependentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  fieldGroup: {},
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkMuted80,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  fieldInput: {
    height: TouchTarget.minSize,
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    fontSize: 13,
    color: Colors.ink,
  },
  fieldInputMultiline: {
    height: 72,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 4,
  },
  genderOption: {
    flex: 1,
    height: TouchTarget.minSize,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  genderOptionTextSelected: {
    color: Colors.inkWhite,
  },
  policyCard: {
    padding: Spacing.three,
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#cce3fd',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  policyBody: {
    fontSize: 12,
    color: '#004c99',
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.three,
    backgroundColor: '#fff1f2',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  errorBoxText: {
    fontSize: 12,
    color: Colors.danger,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    ...Shadows.subtle,
  },
  bottomFeeCol: {
    justifyContent: 'center',
  },
  bottomFeeLabel: {
    fontSize: 11,
    color: Colors.inkMuted48,
    fontWeight: '500',
  },
  bottomFeeValue: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: TouchTarget.minSize,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    ...Shadows.subtle,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.inkWhite,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  // Success Screen Styles
  successCard: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  successIconCircle: {
    marginBottom: Spacing.two,
  },
  successSubHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  successHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  successDateSub: {
    fontSize: 13,
    color: Colors.inkMuted80,
    marginTop: 2,
    textAlign: 'center',
  },
  tokenPill: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  tokenPillLabel: {
    fontSize: 12,
    color: Colors.inkMuted80,
    fontWeight: '500',
  },
  tokenPillNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  paymentDisclosureBox: {
    width: '100%',
    padding: Spacing.four,
    backgroundColor: '#f0f7ff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#cce3fd',
    gap: 6,
  },
  disclosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disclosureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  disclosureText: {
    fontSize: 12,
    color: '#004c99',
    lineHeight: 18,
  },
  receptionistCard: {
    width: '100%',
    padding: Spacing.four,
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginTop: Spacing.two,
    gap: 4,
  },
  deskLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.inkMuted48,
    letterSpacing: 0.5,
  },
  deskNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  deskClinicText: {
    fontSize: 12,
    color: Colors.inkMuted80,
  },
  callDeskButton: {
    marginTop: Spacing.three,
    height: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callDeskText: {
    color: Colors.inkWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  deskNoticeText: {
    marginTop: Spacing.two,
    fontSize: 12,
    color: Colors.inkMuted80,
    fontStyle: 'italic',
  },
  doneButton: {
    marginTop: Spacing.four,
    width: '100%',
    height: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
});
