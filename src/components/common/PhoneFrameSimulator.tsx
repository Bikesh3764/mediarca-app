import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

interface PhoneFrameSimulatorProps {
  children: React.ReactNode;
}

export function PhoneFrameSimulator({ children }: PhoneFrameSimulatorProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [isPhoneMode, setIsPhoneMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const h12 = hours % 12 || 12;
      const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      setCurrentTime(`${h12}:${mStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // On real phones or narrow windows, render native edge-to-edge
  if (Platform.OS !== 'web' || width <= 540) {
    return <>{children}</>;
  }

  return (
    <View style={styles.outerCanvas}>
      {/* Top Floating Control Bar */}
      <View style={styles.floatingBar}>
        <View style={styles.floatingLeft}>
          <View style={styles.brandDot} />
          <Text style={styles.brandTitle}>MediArca Mobile Preview</Text>
          <Text style={styles.resolutionBadge}>iPhone 16 Pro (414 × 896)</Text>
        </View>

        <View style={styles.floatingRight}>
          <TouchableOpacity
            style={[styles.modeButton, isPhoneMode && styles.modeButtonActive]}
            onPress={() => setIsPhoneMode(true)}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={14}
              color={isPhoneMode ? '#ffffff' : '#94a3b8'}
            />
            <Text style={[styles.modeButtonText, isPhoneMode && styles.modeButtonTextActive]}>
              Phone View
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, !isPhoneMode && styles.modeButtonActive]}
            onPress={() => setIsPhoneMode(false)}
          >
            <Ionicons
              name="laptop-outline"
              size={14}
              color={!isPhoneMode ? '#ffffff' : '#94a3b8'}
            />
            <Text style={[styles.modeButtonText, !isPhoneMode && styles.modeButtonTextActive]}>
              Full Screen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.diagButton}
            onPress={() => router.push('/diagnostics' as any)}
          >
            <Ionicons name="pulse-outline" size={14} color="#38bdf8" />
            <Text style={styles.diagButtonText}>Diagnostics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Container: Either Phone Frame or Full-Width */}
      {isPhoneMode ? (
        <View
          style={[
            styles.phoneChassis,
            { height: Math.min(896, Math.max(680, height - 76)) },
          ]}
        >
          {/* Top Speaker / Dynamic Island */}
          <View style={styles.statusBar}>
            <Text style={styles.statusTime}>{currentTime}</Text>
            <View style={styles.dynamicIsland}>
              <View style={styles.cameraLens} />
              <View style={styles.sensorDot} />
            </View>
            <View style={styles.statusIcons}>
              <Ionicons name="cellular" size={13} color="#1d1d1f" />
              <Ionicons name="wifi" size={13} color="#1d1d1f" style={{ marginHorizontal: 3 }} />
              <Ionicons name="battery-full" size={17} color="#1d1d1f" />
            </View>
          </View>

          {/* Actual Mobile App Screen Content */}
          <View style={styles.screenContent}>
            {children}
          </View>

          {/* Bottom Home Indicator Bar */}
          <View style={styles.homeIndicatorWrapper}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      ) : (
        <View style={styles.fullWidthWrapper}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerCanvas: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 54,
    paddingBottom: 16,
    width: '100%',
    height: '100%',
  },
  floatingBar: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)',
    zIndex: 9999,
  },
  floatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34c759',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  resolutionBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  floatingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  diagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  diagButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
  },
  phoneChassis: {
    width: 414,
    backgroundColor: '#ffffff',
    borderRadius: 50,
    borderWidth: 10,
    borderColor: '#1e293b',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.65,
    shadowRadius: 40,
    elevation: 25,
    display: 'flex',
    flexDirection: 'column',
  },
  statusBar: {
    height: 42,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f2',
  },
  statusTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1f',
    letterSpacing: -0.2,
  },
  dynamicIsland: {
    width: 100,
    height: 24,
    backgroundColor: '#000000',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
    gap: 6,
  },
  cameraLens: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#1f2937',
  },
  sensorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0369a1',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenContent: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    overflow: 'hidden',
  },
  homeIndicatorWrapper: {
    height: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f0f2',
  },
  homeIndicator: {
    width: 134,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#1d1d1f',
  },
  fullWidthWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f7',
  },
});
