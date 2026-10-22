import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import { calculateMultiDoctorMetrics } from '@/services/receptionistUtils';
import { ReceptionistLinkedDoctor, ClinicProfile } from '@/services/api';

export interface MultiDoctorOverviewCardProps {
  clinic?: ClinicProfile | null;
  doctors: ReceptionistLinkedDoctor[];
  pendingApprovalsCount?: number;
  onOpenScanQr: () => void;
  onOpenWalkin: () => void;
  onOpenApprovals: () => void;
}

export const MultiDoctorOverviewCard: React.FC<MultiDoctorOverviewCardProps> = ({
  clinic,
  doctors,
  pendingApprovalsCount = 0,
  onOpenScanQr,
  onOpenWalkin,
  onOpenApprovals,
}) => {
  const metrics = calculateMultiDoctorMetrics(doctors);

  return (
    <View style={styles.card}>
      {/* Clinic Header */}
      <View style={styles.clinicHeaderRow}>
        <View style={styles.clinicBadgeIcon}>
          <Ionicons name="business" size={18} color={Colors.primary} />
        </View>
        <View style={styles.clinicInfoCol}>
          <Text style={styles.clinicNameText} numberOfLines={1}>
            {clinic?.clinicName || 'Clinic Front Desk'}
          </Text>
          <Text style={styles.clinicLocationText} numberOfLines={1}>
            {clinic?.address ? `${clinic.address}${clinic.city ? `, ${clinic.city}` : ''}` : 'OPD Reception Terminal'}
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.livePulseDot} />
          <Text style={styles.liveBadgeText}>Live Desk</Text>
        </View>
      </View>

      {/* 4-Tile Telemetry Grid */}
      <View style={styles.grid}>
        {/* Tile 1: Practicing Doctors */}
        <View style={styles.gridTile}>
          <Text style={styles.gridLabel}>Doctors</Text>
          <Text style={styles.gridValue}>{metrics.totalDoctors}</Text>
          <Text style={styles.gridFootnote}>
            {metrics.inCabinCount} in cabin
          </Text>
        </View>

        {/* Tile 2: Total Waiting Patients */}
        <View style={styles.gridTile}>
          <Text style={styles.gridLabel}>In Queue</Text>
          <Text style={[styles.gridValue, { color: Colors.primary }]}>
            {metrics.totalWaitingCount}
          </Text>
          <Text style={styles.gridFootnote}>Waiting now</Text>
        </View>

        {/* Tile 3: Pending Approvals */}
        <View style={styles.gridTile}>
          <Text style={styles.gridLabel}>Approvals</Text>
          <Text
            style={[
              styles.gridValue,
              pendingApprovalsCount > 0 && { color: Colors.warning },
            ]}
          >
            {pendingApprovalsCount}
          </Text>
          <Text style={styles.gridFootnote}>Online requests</Text>
        </View>

        {/* Tile 4: Today Bookings */}
        <View style={styles.gridTile}>
          <Text style={styles.gridLabel}>Total Today</Text>
          <Text style={styles.gridValue}>{metrics.totalTodayBookings}</Text>
          <Text style={styles.gridFootnote}>All shifts</Text>
        </View>
      </View>

      {/* Quick Action Pill Buttons */}
      <View style={styles.actionRow}>
        {/* Scan Patient Ticket QR */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={onOpenScanQr}
          activeOpacity={0.85}
        >
          <Ionicons name="qr-code" size={16} color={Colors.inkWhite} />
          <Text style={styles.primaryBtnText}>Scan QR</Text>
        </TouchableOpacity>

        {/* Rapid Walk-in Dispenser */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.secondaryBtn]}
          onPress={onOpenWalkin}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add" size={16} color={Colors.primary} />
          <Text style={styles.secondaryBtnText}>+ Walk-In</Text>
        </TouchableOpacity>

        {/* Online Approvals Queue */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.secondaryBtn]}
          onPress={onOpenApprovals}
          activeOpacity={0.85}
        >
          <Ionicons name="card-outline" size={16} color={Colors.primary} />
          <Text style={styles.secondaryBtnText}>
            Approvals{pendingApprovalsCount > 0 ? ` (${pendingApprovalsCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    ...Shadows.subtle,
  },
  clinicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  clinicBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  clinicInfoCol: {
    flex: 1,
  },
  clinicNameText: {
    fontSize: Typography.fontSize.headline,
    fontWeight: '700',
    color: Colors.ink,
  },
  clinicLocationText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted48,
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eafaf1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 5,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.success,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  grid: {
    flexDirection: 'row',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  gridTile: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkMuted48,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridValue: {
    fontSize: Typography.fontSize.title2,
    fontWeight: '700',
    color: Colors.ink,
    marginVertical: 2,
  },
  gridFootnote: {
    fontSize: 10,
    color: Colors.inkMuted80,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    borderRadius: BorderRadius.pill,
    gap: 6,
    paddingHorizontal: 10,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  primaryBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
  secondaryBtn: {
    backgroundColor: Colors.canvasParchment,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '600',
    color: Colors.primary,
  },
});
