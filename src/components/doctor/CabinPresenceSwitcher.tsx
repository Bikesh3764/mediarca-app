import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { api } from '@/services/api';
import {
  CabinPresenceStatus,
  QUICK_RETURN_MINUTES,
  calculateExpectedReturnTime,
  formatReturnDisplay,
} from '@/services/doctorUtils';

export interface CabinPresenceSwitcherProps {
  currentStatus?: CabinPresenceStatus | string | null;
  expectedReturnTime?: string | null;
  doctorId?: string;
  onStatusChange?: (newStatus: CabinPresenceStatus, returnTime: string | null) => void;
  style?: any;
}

export const CabinPresenceSwitcher: React.FC<CabinPresenceSwitcherProps> = ({
  currentStatus = 'IN_CABIN',
  expectedReturnTime: initialReturnTime,
  doctorId,
  onStatusChange,
  style,
}) => {
  const [status, setStatus] = useState<CabinPresenceStatus>(
    ((currentStatus || 'IN_CABIN').toUpperCase() as CabinPresenceStatus) || 'IN_CABIN'
  );
  const [returnTime, setReturnTime] = useState<string | null>(initialReturnTime || null);
  const [selectedMins, setSelectedMins] = useState<number | null>(15);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom Return Time Modal
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('20');

  useEffect(() => {
    if (currentStatus) {
      setStatus(currentStatus.toUpperCase() as CabinPresenceStatus);
    }
  }, [currentStatus]);

  useEffect(() => {
    setReturnTime(initialReturnTime || null);
  }, [initialReturnTime]);

  const handleStatusTransition = async (
    targetStatus: CabinPresenceStatus,
    minutes?: number | null,
    explicitTime?: string | null
  ) => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}

    const previousStatus = status;
    const previousReturnTime = returnTime;

    // Optimistic UI Update
    const optimisticReturn =
      targetStatus === 'STEPPED_OUT'
        ? explicitTime !== undefined
          ? explicitTime
          : minutes
          ? calculateExpectedReturnTime(minutes)
          : returnTime || calculateExpectedReturnTime(15)
        : null;

    setStatus(targetStatus);
    setReturnTime(optimisticReturn);
    if (minutes !== undefined) setSelectedMins(minutes);
    setErrorMsg(null);
    setFeedback(null);
    setLoading(true);

    try {
      const payload: {
        status: CabinPresenceStatus;
        doctorId?: string;
        returnEstimateMinutes?: number | null;
        expectedReturnTime?: string | null;
      } = {
        status: targetStatus,
        ...(doctorId ? { doctorId } : {}),
      };

      if (targetStatus === 'STEPPED_OUT') {
        if (minutes !== undefined && minutes !== null) {
          payload.returnEstimateMinutes = minutes;
          payload.expectedReturnTime = calculateExpectedReturnTime(minutes);
        } else if (explicitTime !== undefined) {
          payload.expectedReturnTime = explicitTime;
        } else if (optimisticReturn) {
          payload.expectedReturnTime = optimisticReturn;
        }
      }

      const res = await api.updateCabinPresence(payload);
      const resData = (res as any)?.data || res;
      const finalStatus = (resData?.cabinStatus || targetStatus) as CabinPresenceStatus;
      const finalReturn =
        targetStatus === 'STEPPED_OUT'
          ? resData?.expectedReturnTime || optimisticReturn
          : null;

      setStatus(finalStatus);
      setReturnTime(finalReturn);
      if (onStatusChange) {
        onStatusChange(finalStatus, finalReturn);
      }

      setFeedback('Cabin Presence Updated');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err: any) {
      // Error Recovery: Revert back to previous confirmed state
      setStatus(previousStatus);
      setReturnTime(previousReturnTime);
      setErrorMsg(err?.message || 'Failed to update presence. Reverted.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = () => {
    const mins = parseInt(customMinutesInput.trim(), 10);
    if (isNaN(mins) || mins <= 0 || mins > 240) {
      setErrorMsg('Please enter 1 to 240 minutes');
      return;
    }
    setCustomModalOpen(false);
    handleStatusTransition('STEPPED_OUT', mins);
  };

  const displayReturn = formatReturnDisplay(returnTime);

  return (
    <View style={[styles.container, style]}>
      {/* Top Header Label & Feedback */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerLabel}>CABIN PRESENCE</Text>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />
          ) : feedback ? (
            <View style={styles.feedbackPill}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ) : null}
        </View>

        {errorMsg ? (
          <View style={styles.errorPill}>
            <Ionicons name="alert-circle" size={12} color={Colors.danger} />
            <Text style={styles.errorText} numberOfLines={1}>
              {errorMsg}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 3-Button Segmented Track */}
      <View style={styles.segmentedTrack}>
        {/* IN_CABIN Button */}
        <TouchableOpacity
          style={[
            styles.segmentButton,
            status === 'IN_CABIN' && styles.segmentButtonActive,
          ]}
          onPress={() => handleStatusTransition('IN_CABIN')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: status === 'IN_CABIN' ? Colors.success : '#d2d2d7' },
            ]}
          />
          <Text
            style={[
              styles.segmentText,
              status === 'IN_CABIN' && styles.segmentTextActive,
            ]}
          >
            In Cabin
          </Text>
        </TouchableOpacity>

        {/* STEPPED_OUT Button */}
        <TouchableOpacity
          style={[
            styles.segmentButton,
            status === 'STEPPED_OUT' && styles.segmentButtonActive,
          ]}
          onPress={() => handleStatusTransition('STEPPED_OUT', selectedMins || 15)}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: status === 'STEPPED_OUT' ? Colors.warning : '#d2d2d7' },
            ]}
          />
          <Text
            style={[
              styles.segmentText,
              status === 'STEPPED_OUT' && styles.segmentTextActive,
            ]}
          >
            Stepped Out
          </Text>
        </TouchableOpacity>

        {/* NOT_IN_CABIN Button */}
        <TouchableOpacity
          style={[
            styles.segmentButton,
            status === 'NOT_IN_CABIN' && styles.segmentButtonActive,
          ]}
          onPress={() => handleStatusTransition('NOT_IN_CABIN')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: status === 'NOT_IN_CABIN' ? Colors.inkMuted48 : '#d2d2d7' },
            ]}
          />
          <Text
            style={[
              styles.segmentText,
              status === 'NOT_IN_CABIN' && styles.segmentTextActive,
            ]}
          >
            Not in Cabin
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stepped Out Quick Return Time Bar */}
      {status === 'STEPPED_OUT' ? (
        <View style={styles.returnDurationContainer}>
          <View style={styles.returnMetaRow}>
            <Ionicons name="time-outline" size={14} color={Colors.warningDark} />
            <Text style={styles.returnMetaLabel}>Expected back:</Text>
            <Text style={styles.returnMetaValue}>{displayReturn}</Text>
          </View>

          <View style={styles.durationPillsRow}>
            {QUICK_RETURN_MINUTES.map((mins) => {
              const isActive = selectedMins === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.durationPill,
                    isActive && styles.durationPillActive,
                  ]}
                  onPress={() => handleStatusTransition('STEPPED_OUT', mins)}
                  disabled={loading}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.durationPillText,
                      isActive && styles.durationPillTextActive,
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Custom Time Option */}
            <TouchableOpacity
              style={styles.durationPill}
              onPress={() => setCustomModalOpen(true)}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={styles.durationPillText}>Custom</Text>
            </TouchableOpacity>

            {/* Clear Button */}
            {returnTime ? (
              <TouchableOpacity
                style={styles.clearPill}
                onPress={() => handleStatusTransition('STEPPED_OUT', null, null)}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Text style={styles.clearPillText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Custom Duration Modal */}
      <Modal
        visible={customModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Return Estimate</Text>
              <TouchableOpacity
                onPress={() => setCustomModalOpen(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color={Colors.inkMuted48} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              How many minutes until you return to the consultation cabin?
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                value={customMinutesInput}
                onChangeText={setCustomMinutesInput}
                placeholder="20"
                maxLength={3}
                autoFocus
              />
              <Text style={styles.inputSuffix}>minutes</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCustomModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCustomSubmit}
              >
                <Text style={styles.modalSaveText}>Set Return Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.hairline,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.inkMuted48,
    letterSpacing: 0.5,
  },
  spinner: {
    marginLeft: Spacing.one,
  },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.successDark,
  },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    gap: 4,
    maxWidth: '55%',
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.danger,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  segmentButton: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.two,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: Colors.canvas,
    ...Shadows.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  segmentText: {
    ...Typography.footnote,
    color: Colors.inkMuted48,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: Colors.ink,
    fontWeight: '700',
  },
  returnDurationContainer: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  returnMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  returnMetaLabel: {
    ...Typography.footnote,
    color: Colors.inkMuted48,
  },
  returnMetaValue: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.warningDark,
  },
  durationPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  durationPill: {
    minHeight: 32,
    minWidth: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  durationPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationPillText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.ink,
  },
  durationPillTextActive: {
    color: Colors.inkWhite,
  },
  clearPill: {
    minHeight: 32,
    paddingHorizontal: Spacing.two,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPillText: {
    ...Typography.caption,
    color: Colors.inkMuted48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.xl,
    padding: Spacing.five,
    ...Shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  modalTitle: {
    ...Typography.headline,
    color: Colors.ink,
  },
  modalCloseButton: {
    padding: Spacing.one,
  },
  modalSubtitle: {
    ...Typography.subheadline,
    color: Colors.inkMuted48,
    marginBottom: Spacing.four,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.five,
  },
  textInput: {
    flex: 1,
    height: 48,
    ...Typography.title2,
    color: Colors.ink,
  },
  inputSuffix: {
    ...Typography.body,
    color: Colors.inkMuted48,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.canvasParchment,
  },
  modalCancelText: {
    ...Typography.bodyBold,
    color: Colors.inkMuted48,
  },
  modalSaveBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  modalSaveText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
});
