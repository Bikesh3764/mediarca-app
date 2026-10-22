import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Doctor,
  DoctorScheduleConfig,
  api,
  getFileUrl,
  formatDoctorDegrees,
  format12Hour,
  parseDoctorSlots,
  cleanSlotName,
} from '@/services/api';
import { CabinBadge } from '@/components/common/CabinBadge';
import { WeekdayDisplay } from '@/components/common/WeekdayDisplay';
import { AppCard } from '@/components/ui/AppCard';
import {
  Colors,
  Spacing,
  BorderRadius,
  TouchTarget,
  Shadows,
} from '@/constants/theme';
import { toTelUri, formatDisplayPhone } from '@/utils/phoneUtils';

export default function DoctorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [scheduleConfig, setScheduleConfig] = useState<DoctorScheduleConfig | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDoctor = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getDoctorById(id);
      setDoctor(data);

      if (data.clinics && data.clinics.length > 0) {
        setSelectedClinicId(data.clinics[0].clinicId);
      }

      // Fetch dynamic schedule configuration
      try {
        const config = await api.getDoctorScheduleConfig(id);
        setScheduleConfig(config);
      } catch {
        // Non-critical: defaults will be derived from doctor profile
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load doctor profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading doctor profile...</Text>
      </View>
    );
  }

  if (errorMessage || !doctor) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.errorTitle}>Doctor Not Found</Text>
        <Text style={styles.errorSubtitle}>
          {errorMessage || 'The requested doctor profile is unavailable.'}
        </Text>
        <TouchableOpacity
          style={styles.backButtonPill}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonPillText}>Back to Discovery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = doctor.user?.fullName || 'Doctor';
  const cleanName = fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`;
  const initial = (doctor.user?.fullName ? doctor.user.fullName.replace(/^Dr\.\s*/i, '').trim()[0] : 'D') || 'D';
  const avatarUrl = doctor.user?.avatarUrl ? getFileUrl(doctor.user.avatarUrl) : null;
  const degrees = formatDoctorDegrees(doctor.qualifications);

  // Active clinic & fee
  const selectedClinic =
    doctor.clinics?.find((c) => c.clinicId === selectedClinicId) ||
    doctor.clinics?.[0];
  const activeFee = selectedClinic?.consultationFee ?? doctor.consultationFee;

  // Active slots for selected clinic
  const activeSlots =
    selectedClinic?.slots && selectedClinic.slots.length > 0
      ? selectedClinic.slots
      : parseDoctorSlots(doctor);

  // Working days resolution
  const workingDays =
    scheduleConfig?.workingDays ||
    (doctor.slots ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);

  const handleCallClinic = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(toTelUri(phone)).catch((err) =>
      console.warn('Failed to launch phone dialer:', err)
    );
  };

  const handleBookToken = () => {
    router.push({
      pathname: '/book/[id]',
      params: {
        id: doctor.id,
        clinicId: selectedClinicId || undefined,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.navBackButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Doctor Profile
        </Text>
        <View style={styles.navRightPlaceholder} />
      </View>

      {/* Main Scrollable Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: insets.bottom + 90 },
        ]}
      >
        {/* 1. Hero Identity Card */}
        <AppCard style={styles.heroCard}>
          <View style={styles.identityRow}>
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

            <View style={styles.identityDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  {cleanName}
                </Text>
                {doctor.isVerified && (
                  <Ionicons
                    name="shield-checkmark"
                    size={18}
                    color={Colors.primary}
                  />
                )}
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.specialtyBadge}>
                  <Text style={styles.specialtyBadgeText}>
                    {doctor.specialty}
                  </Text>
                </View>
                <CabinBadge
                  status={doctor.cabinStatus}
                  expectedReturnTime={doctor.expectedReturnTime}
                  size="sm"
                />
              </View>

              <Text style={styles.degreesSubtitle}>
                {degrees}
                {doctor.experienceYears ? ` · ${doctor.experienceYears} yrs experience` : ''}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* 2. Weekly Practice Schedule Card */}
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Weekly Practice Days</Text>
          <Text style={styles.sectionHeaderSub}>
            Standard outpatient consultation schedule in Indian Standard Time (IST)
          </Text>
          <View style={styles.weekdayWrapper}>
            <WeekdayDisplay
              days={workingDays}
              isOnLeaveToday={scheduleConfig?.isOnLeaveToday || false}
              showSummary={true}
              showTodayBadge={true}
            />
          </View>
        </AppCard>

        {/* 3. Daily Shifts & Capacity */}
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Practice Shifts</Text>
          <Text style={styles.sectionHeaderSub}>
            OPD consultation shifts and patient intake limits
          </Text>

          <View style={styles.shiftList}>
            {activeSlots.map((slot, idx) => (
              <View key={slot.id || idx} style={styles.shiftCard}>
                <View style={styles.shiftHeader}>
                  <View style={styles.shiftTitleRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.shiftName}>
                      {cleanSlotName(slot.name, `Shift ${idx + 1}`)}
                    </Text>
                  </View>
                  <Text style={styles.shiftTimings}>
                    {format12Hour(slot.startTime)} – {format12Hour(slot.endTime)}
                  </Text>
                </View>

                <View style={styles.shiftDivider} />

                <View style={styles.shiftMetricsRow}>
                  <View style={styles.shiftMetric}>
                    <Text style={styles.shiftMetricLabel}>Capacity</Text>
                    <Text style={styles.shiftMetricVal}>
                      {slot.maxPatients} patients
                    </Text>
                  </View>
                  <View style={styles.shiftMetric}>
                    <Text style={styles.shiftMetricLabel}>Avg Consultation</Text>
                    <Text style={styles.shiftMetricVal}>
                      {slot.avgConsultationMinutes} mins
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </AppCard>

        {/* 4. Affiliated Clinics */}
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Affiliated Clinical Facilities</Text>
          <Text style={styles.sectionHeaderSub}>
            Select a practice location to book your token
          </Text>

          {doctor.clinics && doctor.clinics.length > 0 ? (
            <View style={styles.clinicList}>
              {doctor.clinics.map((cd) => {
                const isSelected = selectedClinicId === cd.clinicId;
                const cFee = cd.consultationFee ?? doctor.consultationFee;
                const clinic = cd.clinic;

                return (
                  <TouchableOpacity
                    key={cd.clinicId}
                    style={[
                      styles.clinicCard,
                      isSelected && styles.clinicCardSelected,
                    ]}
                    onPress={() => setSelectedClinicId(cd.clinicId)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.clinicHeaderRow}>
                      <View style={styles.clinicTitleCol}>
                        <View style={styles.clinicNameRow}>
                          <Text style={styles.clinicName} numberOfLines={1}>
                            {clinic.clinicName}
                          </Text>
                          {isSelected && (
                            <View style={styles.selectedTickBadge}>
                              <Ionicons
                                name="checkmark"
                                size={12}
                                color={Colors.inkWhite}
                              />
                            </View>
                          )}
                        </View>
                        <Text style={styles.clinicAddress}>
                          {clinic.address}
                          {clinic.city ? `, ${clinic.city}` : ''}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.clinicFooterRow}>
                      <View style={styles.clinicFeeCol}>
                        <Text style={styles.clinicFeeLabel}>Consultation Fee</Text>
                        <Text style={styles.clinicFeeVal}>₹{cFee}</Text>
                      </View>

                      {clinic.phone ? (
                        <TouchableOpacity
                          style={styles.callClinicButton}
                          onPress={() => handleCallClinic(clinic.phone)}
                        >
                          <Ionicons
                            name="call-outline"
                            size={14}
                            color={Colors.primary}
                          />
                          <Text style={styles.callClinicText}>
                            {formatDisplayPhone(clinic.phone)}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noClinicsBox}>
              <Ionicons
                name="business-outline"
                size={24}
                color={Colors.inkMuted48}
              />
              <Text style={styles.noClinicsText}>
                {doctor.clinicAddress || 'Private OPD Consulting Suite'}
              </Text>
            </View>
          )}
        </AppCard>

        {/* 5. Doctor Bio & Credentials */}
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>About the Doctor</Text>
          <Text style={styles.bioText}>
            {doctor.bio ||
              `${cleanName} is an experienced specialist in ${doctor.specialty} with over ${
                doctor.experienceYears || 5
              } years of clinical expertise. Dedicated to patient-centric outpatient care, timely diagnostics, and ethical practice.`}
          </Text>

          <View style={styles.qualificationsBlock}>
            <Text style={styles.credentialsLabel}>Medical Qualifications</Text>
            <Text style={styles.credentialsValue}>{doctor.qualifications}</Text>
          </View>
        </AppCard>
      </ScrollView>

      {/* Sticky Bottom Booking Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomFeeCol}>
          <Text style={styles.bottomFeeLabel}>Consultation Fee</Text>
          <Text style={styles.bottomFeeValue}>₹{activeFee}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookTokenButton}
          onPress={handleBookToken}
          activeOpacity={0.88}
        >
          <Text style={styles.bookTokenText}>Book Token</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.inkWhite} />
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
  errorSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted80,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.four,
  },
  backButtonPill: {
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
  heroCard: {
    padding: Spacing.four,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  avatarContainer: {
    width: 76,
    height: 76,
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
    fontSize: 30,
    fontWeight: '700',
  },
  identityDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  specialtyBadge: {
    backgroundColor: '#e8f2fc',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.pill,
  },
  specialtyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  degreesSubtitle: {
    fontSize: 12,
    color: Colors.inkMuted80,
    marginTop: 6,
  },
  sectionCard: {
    padding: Spacing.four,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  sectionHeaderSub: {
    fontSize: 12,
    color: Colors.inkMuted80,
    marginTop: 2,
    marginBottom: Spacing.three,
  },
  weekdayWrapper: {
    marginTop: Spacing.one,
  },
  shiftList: {
    gap: Spacing.two,
  },
  shiftCard: {
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  shiftTimings: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  shiftDivider: {
    height: 1,
    backgroundColor: '#e5e5ea',
    marginVertical: Spacing.two,
  },
  shiftMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftMetricLabel: {
    fontSize: 11,
    color: Colors.inkMuted48,
  },
  shiftMetricVal: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink,
  },
  clinicList: {
    gap: Spacing.two,
  },
  clinicCard: {
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#e5e5ea',
  },
  clinicCardSelected: {
    backgroundColor: '#ffffff',
    borderColor: Colors.primary,
    ...Shadows.subtle,
  },
  clinicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  clinicTitleCol: {
    flex: 1,
  },
  clinicNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clinicName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
    flexShrink: 1,
  },
  selectedTickBadge: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicAddress: {
    fontSize: 12,
    color: Colors.inkMuted80,
    marginTop: 2,
  },
  clinicFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
  },
  clinicFeeCol: {
    justifyContent: 'center',
  },
  clinicFeeLabel: {
    fontSize: 10,
    color: Colors.inkMuted48,
    fontWeight: '500',
  },
  clinicFeeVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  callClinicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#e8f2fc',
  },
  callClinicText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  noClinicsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.three,
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.md,
  },
  noClinicsText: {
    fontSize: 13,
    color: Colors.inkMuted80,
    flex: 1,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.ink,
  },
  qualificationsBlock: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f2',
  },
  credentialsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkMuted48,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credentialsValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.ink,
    marginTop: 4,
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
  bookTokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: TouchTarget.minSize,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    ...Shadows.subtle,
  },
  bookTokenText: {
    color: Colors.inkWhite,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
