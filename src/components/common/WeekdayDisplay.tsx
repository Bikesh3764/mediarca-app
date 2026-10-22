import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import {
  ALL_WEEKDAYS,
  WEEKDAY_SINGLE_LETTERS,
  formatWeekdaySummary,
  getDayOfWeekCode,
  WeekdayCode,
} from '@/services/api';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

export interface WeekdayDisplayProps {
  days?: string[];
  isOnLeaveToday?: boolean;
  showSummary?: boolean;
  showTodayBadge?: boolean;
  style?: ViewStyle;
}

/**
 * Sleek Apple HIG 7-Day Circular Discs Display (M T W T F S S)
 * Displays doctor weekly schedule, practicing status, and today's presence ring.
 */
export const WeekdayDisplay: React.FC<WeekdayDisplayProps> = ({
  days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  isOnLeaveToday = false,
  showSummary = true,
  showTodayBadge = true,
  style,
}) => {
  const todayCode = getDayOfWeekCode();
  const sitsToday = days.includes(todayCode);

  return (
    <View style={[styles.container, style]}>
      {(showSummary || showTodayBadge) && (
        <View style={styles.headerRow}>
          {showSummary ? (
            <Text style={styles.summaryText}>{formatWeekdaySummary(days)}</Text>
          ) : (
            <View />
          )}

          {showTodayBadge && (
            <View
              style={[
                styles.todayBadge,
                isOnLeaveToday
                  ? styles.leaveBadge
                  : sitsToday
                  ? styles.sittingBadge
                  : styles.offBadge,
              ]}
            >
              <Text
                style={[
                  styles.todayBadgeText,
                  isOnLeaveToday
                    ? styles.leaveBadgeText
                    : sitsToday
                    ? styles.sittingBadgeText
                    : styles.offBadgeText,
                ]}
              >
                {isOnLeaveToday ? 'On Leave' : sitsToday ? 'Practicing Today' : 'Off Today'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 7-Day Apple HIG Circle Strip */}
      <View style={styles.discsRow}>
        {ALL_WEEKDAYS.map((d: WeekdayCode) => {
          const isSitting = days.includes(d);
          const isToday = todayCode === d;
          return (
            <View
              key={d}
              style={[
                styles.disc,
                isSitting ? styles.discSitting : styles.discOff,
                isToday && styles.discTodayRing,
              ]}
            >
              <Text
                style={[
                  styles.discText,
                  isSitting ? styles.discTextSitting : styles.discTextOff,
                  isToday && isSitting && styles.discTextTodaySitting,
                ]}
              >
                {WEEKDAY_SINGLE_LETTERS[d]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  todayBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sittingBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  sittingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  leaveBadge: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  leaveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e11d48',
  },
  offBadge: {
    backgroundColor: '#f5f5f7',
    borderColor: '#e5e5ea',
  },
  offBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8e8e93',
  },
  discsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f7',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  disc: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discSitting: {
    backgroundColor: '#1d1d1f',
  },
  discOff: {
    backgroundColor: 'transparent',
  },
  discTodayRing: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  discText: {
    fontSize: 11,
    fontWeight: '700',
  },
  discTextSitting: {
    color: '#ffffff',
  },
  discTextOff: {
    color: '#a1a1a6',
  },
  discTextTodaySitting: {
    color: '#ffffff',
  },
});
