import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Header } from '@/components/common/Header';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import {
  api,
  DoctorSlot,
  parseDoctorSlots,
  DoctorLeave,
  DoctorAffiliationClinic,
  cleanSlotName,
  getLocalDateString,
  getTomorrowDateString,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  APPLE_HIG_WEEKDAYS,
  calculateAverageConsultationMinutes,
  isDoctorOnLeave,
} from '@/services/doctorUtils';

export default function DoctorScheduleScreen() {
  const router = useRouter();
  const { user, isAuthenticated, role, refreshUser } = useAuth();

  const [clinics, setClinics] = useState<DoctorAffiliationClinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Practice Days State
  const [workingDays, setWorkingDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);

  // Shift Configuration
  const [slots, setSlots] = useState<DoctorSlot[]>([
    {
      id: 'slot_1',
      name: 'Shift 1',
      startTime: '09:00',
      endTime: '13:00',
      maxPatients: 25,
      avgConsultationMinutes: 10,
    },
  ]);
  const [consultationFee, setConsultationFee] = useState<string>('500');

  // Emergency Leave State
  const [isOnLeaveToday, setIsOnLeaveToday] = useState(false);
  const [todayLeave, setTodayLeave] = useState<DoctorLeave | null>(null);
  const [leavesList, setLeavesList] = useState<DoctorLeave[]>([]);

  // Scheduled Absence Form State
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState(getTomorrowDateString());
  const [leaveEndDate, setLeaveEndDate] = useState(getTomorrowDateString());
  const [leaveReason, setLeaveReason] = useState('Personal leave');
  const [addingLeave, setAddingLeave] = useState(false);

  const doctorId = user?.doctorProfile?.id;

  const loadScheduleData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      if (user?.doctorProfile) {
        // Hydrate from user profile first
        const userSlots = parseDoctorSlots(user.doctorProfile);
        if (userSlots && userSlots.length > 0) {
          setSlots(
            userSlots.map((s, idx) => ({
              ...s,
              name: cleanSlotName(s.name, `Shift ${idx + 1}`),
            }))
          );
        }
        if (user.doctorProfile.consultationFee) {
          setConsultationFee(String(user.doctorProfile.consultationFee));
        }
        if (user.doctorProfile.workingDays) {
          try {
            const parsed = JSON.parse(user.doctorProfile.workingDays);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setWorkingDays(parsed);
            }
          } catch {}
        }
        if (user.doctorProfile.leaves) {
          try {
            const rawLeaves = user.doctorProfile.leaves;
            const parsedLeaves = typeof rawLeaves === 'string' ? JSON.parse(rawLeaves) : rawLeaves;
            if (Array.isArray(parsedLeaves)) {
              setLeavesList(parsedLeaves);
            }
          } catch {}
        }
        setIsOnLeaveToday(Boolean(user.doctorProfile.isOnLeaveToday));
        setTodayLeave(user.doctorProfile.todayLeave || null);
      }

      // Fetch live affiliations
      const aff = await api.getDoctorAffiliations();
      if (aff && aff.clinics) {
        setClinics(aff.clinics);
        if (aff.clinics.length > 0 && !selectedClinicId) {
          setSelectedClinicId(aff.clinics[0].clinicId);
          const first = aff.clinics[0];
          if (first.slots && first.slots.length > 0) {
            setSlots(first.slots);
          }
          if (first.workingDays && first.workingDays.length > 0) {
            setWorkingDays(first.workingDays);
          }
          if (first.consultationFee) {
            setConsultationFee(String(first.consultationFee));
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load schedule from healthcare network');
    } finally {
      setLoading(false);
    }
  }, [user, selectedClinicId]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Toggle Day
  const handleToggleDay = (code: string) => {
    setWorkingDays((prev) => {
      if (prev.includes(code)) {
        if (prev.length <= 1) {
          Alert.alert('Minimum Days', 'At least one practicing day must be active.');
          return prev;
        }
        return prev.filter((d) => d !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  // Preset Handlers
  const handleApplyPreset = (preset: 'ALL' | 'WEEKDAYS' | 'MON_SAT') => {
    if (preset === 'ALL') {
      setWorkingDays(APPLE_HIG_WEEKDAYS.map((d) => d.code));
    } else if (preset === 'WEEKDAYS') {
      setWorkingDays(['MON', 'TUE', 'WED', 'THU', 'FRI']);
    } else if (preset === 'MON_SAT') {
      setWorkingDays(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
    }
  };

  // Slot Handlers
  const handleAddSlot = () => {
    const nextIndex = slots.length + 1;
    let nextStart = '14:00';
    let nextEnd = '18:00';

    if (slots.length > 0) {
      const last = slots[slots.length - 1];
      if (last.endTime) {
        nextStart = last.endTime;
        const [h, m] = last.endTime.split(':').map(Number);
        const endH = (h + 3) % 24;
        nextEnd = `${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
      }
    }

    const newSlot: DoctorSlot = {
      id: `slot_${Date.now()}`,
      name: `Shift ${nextIndex}`,
      startTime: nextStart,
      endTime: nextEnd,
      maxPatients: 25,
      avgConsultationMinutes: 10,
    };

    setSlots((prev) => [...prev, newSlot]);
  };

  const handleRemoveSlot = (index: number) => {
    if (slots.length <= 1) {
      Alert.alert('Required Shift', 'You must maintain at least one clinical shift.');
      return;
    }
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (index: number, field: keyof DoctorSlot, value: any) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Emergency "Take Leave Today" Toggle
  const handleToggleTakeLeaveToday = async (val: boolean) => {
    if (!doctorId) {
      Alert.alert('Doctor ID Missing', 'Please ensure you are signed in with a doctor account.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!val && todayLeave) {
        // Cancel today leave
        await api.cancelDoctorLeave(doctorId, todayLeave.id);
        setIsOnLeaveToday(false);
        setTodayLeave(null);
        setSuccessMsg('You have resumed OPD consultations for today.');
      } else {
        // Add emergency leave today
        const leave = await api.addDoctorLeave(doctorId, {
          type: 'TODAY',
          reason: 'Emergency Leave Today',
          clinicId: selectedClinicId || undefined,
        });
        setIsOnLeaveToday(true);
        setTodayLeave(leave);
        setSuccessMsg('You are marked ON LEAVE for today. Patients see updated return dates.');
      }
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update emergency leave.');
    } finally {
      setSaving(false);
    }
  };

  // Add Scheduled Leave Range
  const handleAddScheduledLeave = async () => {
    if (!doctorId) return;

    if (!leaveStartDate || !leaveEndDate) {
      Alert.alert('Missing Dates', 'Please provide start and end dates (YYYY-MM-DD).');
      return;
    }

    if (leaveEndDate < leaveStartDate) {
      Alert.alert('Invalid Range', 'End date cannot be earlier than start date.');
      return;
    }

    setAddingLeave(true);
    setErrorMsg(null);

    try {
      const created = await api.addDoctorLeave(doctorId, {
        type: 'DATE_RANGE',
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason || 'Planned absence',
        clinicId: selectedClinicId || undefined,
      });

      setLeavesList((prev) => [...prev, created]);
      setShowAddLeaveModal(false);
      setSuccessMsg('Scheduled leave added to practice calendar.');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to schedule leave.');
    } finally {
      setAddingLeave(false);
    }
  };

  // Cancel Scheduled Leave
  const handleCancelLeave = async (leaveId: string) => {
    if (!doctorId) return;

    try {
      await api.cancelDoctorLeave(doctorId, leaveId);
      setLeavesList((prev) => prev.filter((l) => l.id !== leaveId));
      setSuccessMsg('Leave canceled.');
      setTimeout(() => setSuccessMsg(null), 2500);
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      Alert.alert('Cancellation Failed', err?.message || 'Could not cancel leave.');
    }
  };

  // Save Schedule Changes
  const handleSaveAll = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (workingDays.length === 0) {
      setErrorMsg('Please select at least one active practicing day.');
      setSaving(false);
      return;
    }

    try {
      // Calculate updated avg consultation minutes for each slot
      const updatedSlots = slots.map((s, idx) => ({
        ...s,
        id: s.id || `slot_${idx + 1}`,
        name: cleanSlotName(s.name, `Shift ${idx + 1}`),
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '13:00',
        maxPatients: Number(s.maxPatients) || 25,
        avgConsultationMinutes: calculateAverageConsultationMinutes(
          s.startTime || '09:00',
          s.endTime || '13:00',
          Number(s.maxPatients) || 25
        ),
      }));

      const feeNum = parseFloat(consultationFee) || 500;

      // Update doctor schedule & working days
      if (doctorId) {
        await api.updateDoctorWorkingDays(doctorId, workingDays, selectedClinicId || undefined);
      }

      await api.updateDoctorSchedule({
        slots: updatedSlots,
        consultationFee: feeNum,
        workingDays,
        clinicId: selectedClinicId || undefined,
      });

      setSuccessMsg('Doctor schedule and shift capacity saved successfully.');
      if (refreshUser) await refreshUser();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save schedule changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaViewContainer>
        <Header title="Manage Schedule" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading shift configuration...</Text>
        </View>
      </SafeAreaViewContainer>
    );
  }

  return (
    <SafeAreaViewContainer>
      <Header
        title="Schedule & Shifts"
        subtitle="Practice Hours, Capacity & Leaves"
        showBack
        rightElement={
          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={handleSaveAll}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.inkWhite} />
            ) : (
              <Text style={styles.saveHeaderBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Success / Error Banners */}
        {errorMsg ? (
          <View style={styles.alertError}>
            <Ionicons name="alert-circle" size={16} color={Colors.danger} />
            <Text style={styles.alertErrorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View style={styles.alertSuccess}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.successDark} />
            <Text style={styles.alertSuccessText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* Emergency Leave Toggle Card */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyTextCol}>
            <View style={styles.emergencyHeaderRow}>
              <Ionicons name="flash" size={18} color={isOnLeaveToday ? Colors.danger : Colors.warningDark} />
              <Text style={styles.emergencyTitle}>Take Leave Today</Text>
            </View>
            <Text style={styles.emergencyDesc}>
              Instantly pauses online token booking and flags your cabin as on emergency leave for today.
            </Text>
          </View>

          <Switch
            value={isOnLeaveToday}
            onValueChange={handleToggleTakeLeaveToday}
            thumbColor={Colors.inkWhite}
            trackColor={{ false: Colors.hairline, true: Colors.danger }}
          />
        </View>

        {/* 1. Active Practice Days (Apple HIG Discs) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Active Practice Days</Text>
              <Text style={styles.cardSubtitle}>Days when your OPD is active</Text>
            </View>

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => handleApplyPreset('WEEKDAYS')}
              >
                <Text style={styles.presetText}>Mon-Fri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => handleApplyPreset('MON_SAT')}
              >
                <Text style={styles.presetText}>Mon-Sat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => handleApplyPreset('ALL')}
              >
                <Text style={styles.presetText}>All 7</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 7 Apple HIG Circular Discs: M T W T F S S */}
          <View style={styles.discsContainer}>
            {APPLE_HIG_WEEKDAYS.map(({ code, label, full }) => {
              const isActive = workingDays.includes(code);
              return (
                <View key={code} style={styles.discCol}>
                  <TouchableOpacity
                    style={[styles.discCircle, isActive && styles.discCircleActive]}
                    onPress={() => handleToggleDay(code)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.discLabel, isActive && styles.discLabelActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.discSubName}>{code}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 2. Shift Configuration Cards */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>OPD Shift Configuration</Text>
              <Text style={styles.cardSubtitle}>
                Timings, capacity & average consultation minutes
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addShiftBtn}
              onPress={handleAddSlot}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addShiftBtnText}>Add Shift</Text>
            </TouchableOpacity>
          </View>

          {slots.map((slot, index) => {
            const maxPatientsNum = Number(slot.maxPatients) || 25;
            const avgMins = calculateAverageConsultationMinutes(
              slot.startTime,
              slot.endTime,
              maxPatientsNum
            );

            return (
              <View key={slot.id || index} style={styles.slotCard}>
                <View style={styles.slotTopRow}>
                  <Text style={styles.slotNameTitle}>
                    {cleanSlotName(slot.name, `Shift ${index + 1}`)}
                  </Text>

                  {slots.length > 1 ? (
                    <TouchableOpacity
                      onPress={() => handleRemoveSlot(index)}
                      style={styles.removeSlotBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Timing Row: Start & End Time */}
                <View style={styles.slotGridRow}>
                  <View style={styles.slotGridCol}>
                    <Text style={styles.fieldLabel}>Start Time (HH:MM)</Text>
                    <TextInput
                      style={styles.slotInput}
                      value={slot.startTime}
                      onChangeText={(val) => handleUpdateSlot(index, 'startTime', val)}
                      placeholder="09:00"
                    />
                  </View>

                  <View style={styles.slotGridCol}>
                    <Text style={styles.fieldLabel}>End Time (HH:MM)</Text>
                    <TextInput
                      style={styles.slotInput}
                      value={slot.endTime}
                      onChangeText={(val) => handleUpdateSlot(index, 'endTime', val)}
                      placeholder="13:00"
                    />
                  </View>
                </View>

                {/* Capacity & Computed Avg Duration */}
                <View style={styles.slotGridRow}>
                  <View style={styles.slotGridCol}>
                    <Text style={styles.fieldLabel}>Max Patient Capacity</Text>
                    <TextInput
                      style={styles.slotInput}
                      value={String(slot.maxPatients || '')}
                      onChangeText={(val) =>
                        handleUpdateSlot(index, 'maxPatients', parseInt(val, 10) || 0)
                      }
                      placeholder="25"
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={styles.slotGridCol}>
                    <Text style={styles.fieldLabel}>Avg Minutes / Patient</Text>
                    <View style={styles.computedBox}>
                      <Ionicons name="timer-outline" size={16} color={Colors.primary} />
                      <Text style={styles.computedText}>{avgMins} mins</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* 3. Consultation Fee Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consultation Fee (Zero-Upfront)</Text>
          <Text style={styles.cardSubtitle}>
            Fee collected by the clinic front desk upon physical patient arrival.
          </Text>

          <View style={styles.feeInputRow}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.feeInput}
              value={consultationFee}
              onChangeText={setConsultationFee}
              placeholder="500"
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* 4. Scheduled Absence & Leaves Manager */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Scheduled Absences & Leaves</Text>
              <Text style={styles.cardSubtitle}>
                Block out future vacation dates on your booking calendar
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addLeaveBtn}
              onPress={() => setShowAddLeaveModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              <Text style={styles.addLeaveBtnText}>Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* Add Leave Inline Form */}
          {showAddLeaveModal ? (
            <View style={styles.addLeaveCard}>
              <Text style={styles.addLeaveTitle}>Add Scheduled Leave Range</Text>

              <View style={styles.slotGridRow}>
                <View style={styles.slotGridCol}>
                  <Text style={styles.fieldLabel}>Start Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.slotInput}
                    value={leaveStartDate}
                    onChangeText={setLeaveStartDate}
                    placeholder="2026-10-25"
                  />
                </View>

                <View style={styles.slotGridCol}>
                  <Text style={styles.fieldLabel}>End Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.slotInput}
                    value={leaveEndDate}
                    onChangeText={setLeaveEndDate}
                    placeholder="2026-10-27"
                  />
                </View>
              </View>

              <View style={styles.inputSpacing}>
                <Text style={styles.fieldLabel}>Reason (Optional)</Text>
                <TextInput
                  style={styles.slotInput}
                  value={leaveReason}
                  onChangeText={setLeaveReason}
                  placeholder="Medical Conference, Vacation"
                />
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddLeaveModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleAddScheduledLeave}
                  disabled={addingLeave}
                >
                  {addingLeave ? (
                    <ActivityIndicator size="small" color={Colors.inkWhite} />
                  ) : (
                    <Text style={styles.modalSaveText}>Confirm Absence</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Leaves List */}
          {leavesList && leavesList.length > 0 ? (
            <View style={styles.leavesList}>
              {leavesList.map((l) => (
                <View key={l.id} style={styles.leaveItem}>
                  <View style={styles.leaveTextCol}>
                    <Text style={styles.leaveDates}>
                      {l.startDate} {l.endDate && l.endDate !== l.startDate ? `to ${l.endDate}` : ''}
                    </Text>
                    <Text style={styles.leaveReasonText}>
                      {l.reason || (l.type === 'TODAY' ? 'Today emergency leave' : 'Scheduled Absence')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.leaveCancelBtn}
                    onPress={() => handleCancelLeave(l.id)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noLeavesText}>
              No future scheduled leaves. You are available on all configured practicing days.
            </Text>
          )}
        </View>

        {/* Bottom Save CTA */}
        <TouchableOpacity
          style={styles.bottomSaveBtn}
          onPress={handleSaveAll}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.inkWhite} />
          ) : (
            <>
              <Ionicons name="checkmark-sharp" size={18} color={Colors.inkWhite} />
              <Text style={styles.bottomSaveBtnText}>Save Schedule & Shift Capacity</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaViewContainer>
  );
}

const styles = StyleSheet.create({
  saveHeaderBtn: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveHeaderBtnText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.two,
  },
  alertErrorText: {
    ...Typography.footnote,
    color: Colors.danger,
    flex: 1,
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.two,
  },
  alertSuccessText: {
    ...Typography.footnote,
    color: Colors.successDark,
    flex: 1,
  },
  emergencyCard: {
    backgroundColor: '#fffbeb',
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    ...Shadows.card,
  },
  emergencyTextCol: {
    flex: 1,
    gap: 4,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emergencyTitle: {
    ...Typography.headline,
    color: '#92400e',
    fontWeight: '800',
  },
  emergencyDesc: {
    ...Typography.caption,
    color: '#b45309',
    lineHeight: 16,
  },
  card: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.hairline,
    ...Shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cardTitle: {
    ...Typography.headline,
    color: Colors.ink,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetPill: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  discsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  discCol: {
    alignItems: 'center',
    gap: 4,
  },
  discCircle: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    borderRadius: TouchTarget.minSize / 2,
    backgroundColor: Colors.canvasParchment,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.card,
  },
  discLabel: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.inkMuted48,
  },
  discLabelActive: {
    color: Colors.inkWhite,
  },
  discSubName: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.inkMuted48,
  },
  addShiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  addShiftBtnText: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.primary,
  },
  slotCard: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.hairline,
    gap: Spacing.two,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotNameTitle: {
    ...Typography.subheadline,
    fontWeight: '700',
    color: Colors.ink,
  },
  removeSlotBtn: {
    padding: 4,
  },
  slotGridRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  slotGridCol: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  slotInput: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.two,
    ...Typography.body,
    color: Colors.ink,
  },
  computedBox: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: '#e6f0fa',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#cce0f5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
  },
  computedText: {
    ...Typography.bodyBold,
    color: Colors.primaryDark,
  },
  feeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
  },
  rupeeSymbol: {
    ...Typography.title2,
    color: Colors.ink,
    marginRight: Spacing.two,
  },
  feeInput: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    ...Typography.title2,
    color: Colors.ink,
  },
  addLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  addLeaveBtnText: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.primary,
  },
  addLeaveCard: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.hairline,
    gap: Spacing.two,
  },
  addLeaveTitle: {
    ...Typography.subheadline,
    fontWeight: '700',
    color: Colors.ink,
  },
  inputSpacing: {
    gap: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.inkMuted48,
  },
  modalSaveBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
  leavesList: {
    gap: Spacing.two,
  },
  leaveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
  },
  leaveTextCol: {
    flex: 1,
    gap: 2,
  },
  leaveDates: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.ink,
  },
  leaveReasonText: {
    ...Typography.caption,
    color: Colors.inkMuted48,
  },
  leaveCancelBtn: {
    padding: Spacing.one,
  },
  noLeavesText: {
    ...Typography.footnote,
    color: Colors.inkMuted48,
    fontStyle: 'italic',
    paddingVertical: Spacing.two,
  },
  bottomSaveBtn: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    ...Shadows.card,
  },
  bottomSaveBtnText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
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
});
