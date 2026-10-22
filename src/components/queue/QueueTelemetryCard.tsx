import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appointment } from '@/services/api';
import { formatWaitTime } from '@/services/queueUtils';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

interface QueueTelemetryCardProps {
  appointment: Appointment;
  isToday: boolean;
  doctorDisplayName: string;
}

export const QueueTelemetryCard: React.FC<QueueTelemetryCardProps> = ({
  appointment,
  isToday,
  doctorDisplayName,
}) => {
  const { doctor, queueNumber, status, liveQueue } = appointment;

  if (!isToday || (status !== 'WAITING' && status !== 'IN_CONSULTATION') || !liveQueue) {
    return null;
  }

  const currentServing = liveQueue.currentServingQueueNumber || 0;
  const isCalled = currentServing === queueNumber && queueNumber > 0;
  const isInConsultation = status === 'IN_CONSULTATION';
  const patientsAway = liveQueue.patientsAway ?? 0;
  const waitMinutes = liveQueue.estimatedWaitMinutes;

  return (
    <View style={styles.container}>
      {/* Header Row: Live Queue Flow & Serving Pill */}
      <View style={styles.headerRow}>
        <View style={styles.flowHeaderLeft}>
          <View style={styles.livePulseDot} />
          <Text style={styles.flowTitle}>Live Queue Flow</Text>
        </View>

        <View style={styles.servingPill}>
          <Text style={styles.servingPillText}>
            Serving:{' '}
            <Text style={styles.servingPillBold}>
              {currentServing > 0 ? `Queue #${currentServing}` : 'Waiting to Call'}
            </Text>
          </Text>
        </View>
      </View>

      {/* Cabin Status Alert (if doctor stepped out or not in cabin) */}
      {doctor.cabinStatus === 'STEPPED_OUT' && (
        <View style={[styles.cabinAlertBanner, styles.steppedOutBanner]}>
          <Ionicons name="time" size={16} color={Colors.warningDark} style={styles.alertIcon} />
          <Text style={styles.cabinAlertText}>
            <Text style={styles.boldText}>Doctor stepped out:</Text> Expected back{' '}
            {doctor.expectedReturnTime ? `around ${doctor.expectedReturnTime}` : 'soon'}.
          </Text>
        </View>
      )}

      {doctor.cabinStatus === 'NOT_IN_CABIN' && (
        <View style={[styles.cabinAlertBanner, styles.notInCabinBanner]}>
          <Ionicons name="alert-circle" size={16} color={Colors.inkMuted80} style={styles.alertIcon} />
          <Text style={styles.cabinAlertText}>
            <Text style={styles.boldText}>Doctor not yet in cabin:</Text> Waiting for doctor arrival.
          </Text>
        </View>
      )}

      {/* Active Consultation / Token Called Banner OR 2-Tile Telemetry Metric Grid */}
      {isInConsultation || isCalled ? (
        <View style={styles.activeCallBanner}>
          <View style={styles.checkIconWrap}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.primary} />
          </View>
          <View style={styles.activeCallContent}>
            <Text style={styles.activeCallTitle}>
              {isInConsultation ? 'Consultation in Progress' : 'Your Token is Called!'}
            </Text>
            <Text style={styles.activeCallSubtitle}>
              {isInConsultation
                ? `You are currently in consultation with ${doctorDisplayName} in the cabin.`
                : `Please proceed to the consultation cabin. ${doctorDisplayName} is ready for you.`}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.telemetryGrid}>
          {/* Tile 1: Patients Ahead */}
          <View style={styles.telemetryTile}>
            <Text style={styles.tileLabel}>Patients Ahead</Text>
            <View style={styles.tileValueWrap}>
              <Text style={styles.tileLargeNumber}>{patientsAway}</Text>
              <Text style={styles.tileSubtext} numberOfLines={1}>
                {patientsAway === 0 ? 'You are next in line' : `Ahead of #${queueNumber}`}
              </Text>
            </View>
          </View>

          {/* Tile 2: Dynamic Estimated Wait */}
          <View style={styles.telemetryTile}>
            <Text style={styles.tileLabel}>Estimated Wait</Text>
            <View style={styles.tileValueWrap}>
              <Text style={[styles.tileLargeNumber, { color: Colors.primary }]}>
                {formatWaitTime(waitMinutes)}
              </Text>
              <Text style={styles.tileSubtext} numberOfLines={1}>
                Based on live clinic pace
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.card,
    padding: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    marginTop: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  flowHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  flowTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 14,
  },
  servingPill: {
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  servingPillText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
  },
  servingPillBold: {
    fontWeight: '700',
    color: Colors.ink,
  },
  cabinAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  steppedOutBanner: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  notInCabinBanner: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.hairline,
  },
  alertIcon: {
    marginRight: Spacing.two,
  },
  cabinAlertText: {
    ...Typography.caption,
    color: Colors.ink,
    flex: 1,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
  activeCallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.four,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...Shadows.card,
  },
  checkIconWrap: {
    marginRight: Spacing.three,
  },
  activeCallContent: {
    flex: 1,
  },
  activeCallTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 15,
  },
  activeCallSubtitle: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    marginTop: 2,
    lineHeight: 16,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  telemetryTile: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  tileLabel: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    fontSize: 11,
    marginBottom: 4,
  },
  tileValueWrap: {
    marginTop: 2,
  },
  tileLargeNumber: {
    ...Typography.title2,
    color: Colors.ink,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tileSubtext: {
    ...Typography.caption,
    color: Colors.inkMuted48,
    fontSize: 11,
    marginTop: 2,
  },
});
