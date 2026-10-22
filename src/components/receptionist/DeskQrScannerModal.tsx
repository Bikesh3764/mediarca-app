import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { parseTicketQrPayload } from '@/services/receptionistUtils';
import { api } from '@/services/api';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';

export interface DeskQrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess?: (appointmentId: string) => void | Promise<void>;
}

export const DeskQrScannerModal: React.FC<DeskQrScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ patientName?: string; token?: number } | null>(null);

  // Animated scanning line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setIsVerifying(false);
      setErrorMessage(null);
      setSuccessInfo(null);
      setManualCode('');

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 200,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnim.setValue(0);
      setTorchOn(false);
    }
  }, [visible, scanLineAnim]);

  const processAppointmentCheckIn = async (appointmentId: string) => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      if (onScanSuccess) {
        await onScanSuccess(appointmentId);
      } else {
        const res = await api.checkInAppointmentDirect(appointmentId, true);
        const appt = res?.data || res;
        setSuccessInfo({
          patientName: appt?.patientName || appt?.patient?.user?.fullName || 'Patient',
          token: appt?.queueNumber,
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setErrorMessage(err?.message || 'Check-in failed. Please verify the ticket.');
      setTimeout(() => {
        setScanned(false);
        setIsVerifying(false);
      }, 2000);
    }
  };

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || isVerifying) return;
      setScanned(true);
      setErrorMessage(null);

      const parsed = parseTicketQrPayload(data);
      if (!parsed || !parsed.appointmentId) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setErrorMessage('Invalid ticket QR. Please scan a patient mobile ticket.');
        setTimeout(() => {
          setScanned(false);
        }, 1500);
        return;
      }

      await processAppointmentCheckIn(parsed.appointmentId);
    },
    [scanned, isVerifying]
  );

  const handleManualSubmit = async () => {
    const clean = manualCode.trim();
    if (!clean) {
      setErrorMessage('Please enter an appointment or ticket ID');
      return;
    }
    const parsed = parseTicketQrPayload(clean) || { appointmentId: clean };
    await processAppointmentCheckIn(parsed.appointmentId);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            accessibilityLabel="Close Scanner"
          >
            <Ionicons name="close" size={24} color={Colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Counter Desk Scanner</Text>
            <Text style={styles.headerSubtitle}>Scan Patient Mobile Ticket</Text>
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setTorchOn((prev) => !prev)}
            accessibilityLabel="Toggle Torch"
          >
            <Ionicons
              name={torchOn ? 'flash' : 'flash-off'}
              size={20}
              color={torchOn ? Colors.warning : Colors.ink}
            />
          </TouchableOpacity>
        </View>

        {/* Content Viewfinder or Manual Mode */}
        {!showManualInput ? (
          <View style={styles.scannerWrapper}>
            {!permission ? (
              <View style={styles.permissionBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.permissionText}>Checking camera hardware...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.permissionBox}>
                <Ionicons name="camera-outline" size={48} color={Colors.inkMuted48} />
                <Text style={styles.permissionTitle}>Camera Access Required</Text>
                <Text style={styles.permissionText}>
                  MediArca needs camera access to scan patient ticket QR codes directly at the counter.
                </Text>
                <TouchableOpacity
                  style={styles.permissionBtn}
                  onPress={requestPermission}
                  activeOpacity={0.85}
                >
                  <Text style={styles.permissionBtnText}>Enable Camera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraFrame}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  enableTorch={torchOn}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                />

                {/* Mask Overlay */}
                <View style={styles.overlayMask}>
                  {/* Targeting Box */}
                  <View style={styles.targetBox}>
                    {/* 4 Corner Markers */}
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />

                    {/* Animated Scanning Line */}
                    <Animated.View
                      style={[
                        styles.scanLine,
                        { transform: [{ translateY: scanLineAnim }] },
                      ]}
                    />

                    {isVerifying && (
                      <View style={styles.verifyingOverlay}>
                        <ActivityIndicator size="large" color={Colors.inkWhite} />
                        <Text style={styles.verifyingText}>Verifying ticket...</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Success Banner */}
            {successInfo && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.successText}>
                  Checked in {successInfo.patientName} (Token #{successInfo.token})!
                </Text>
              </View>
            )}

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Helper Caption */}
            <Text style={styles.guideText}>
              Point camera at the QR code displayed on the patient's phone screen.
            </Text>
          </View>
        ) : (
          /* Manual Input Mode */
          <View style={styles.manualInputWrapper}>
            <View style={styles.manualCard}>
              <Text style={styles.manualTitle}>Manual Ticket Search</Text>
              <Text style={styles.manualSubtitle}>
                Enter the patient's Appointment ID or Ticket ID if the phone screen is unreadable.
              </Text>

              <TextInput
                style={styles.manualInput}
                placeholder="e.g. 550e8400-e29b-41d4-a716... or appt_xxx"
                placeholderTextColor={Colors.inkMuted48}
                value={manualCode}
                onChangeText={(t) => {
                  setManualCode(t);
                  setErrorMessage(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.manualSubmitBtn}
                onPress={handleManualSubmit}
                disabled={isVerifying}
                activeOpacity={0.85}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color={Colors.inkWhite} />
                ) : (
                  <Text style={styles.manualSubmitBtnText}>Verify & Check In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer Toggle Mode */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.toggleModeBtn}
            onPress={() => {
              setShowManualInput((prev) => !prev);
              setErrorMessage(null);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showManualInput ? 'camera' : 'keypad'}
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.toggleModeText}>
              {showManualInput ? 'Switch to Camera Scanner' : 'Enter ID Manually'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasParchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.canvasPure,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  headerBtn: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.headline,
    fontWeight: '700',
    color: Colors.ink,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.inkMuted48,
    marginTop: 1,
  },
  scannerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  cameraFrame: {
    width: 280,
    height: 280,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.ink,
  },
  overlayMask: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBox: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  verifyingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkWhite,
    marginTop: Spacing.sm,
  },
  guideText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.inkMuted80,
    textAlign: 'center',
    marginTop: Spacing.md,
    maxWidth: 280,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eafaf1',
    borderWidth: 1,
    borderColor: '#c3e6cb',
    borderRadius: BorderRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    marginTop: Spacing.md,
  },
  successText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.success,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#feeceb',
    borderWidth: 1,
    borderColor: '#f5c6cb',
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    marginTop: Spacing.sm,
    maxWidth: 280,
  },
  errorText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.danger,
    fontWeight: '500',
    flex: 1,
  },
  permissionBox: {
    alignItems: 'center',
    padding: Spacing.lg,
    maxWidth: 300,
  },
  permissionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  permissionText: {
    fontSize: Typography.fontSize.body,
    color: Colors.inkMuted80,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: TouchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
  manualInputWrapper: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  manualCard: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.lg,
    ...Shadows.subtle,
  },
  manualTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '700',
    color: Colors.ink,
  },
  manualSubtitle: {
    fontSize: Typography.fontSize.subheadline,
    color: Colors.inkMuted48,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  manualInput: {
    minHeight: TouchTarget.minHeight,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.body,
    color: Colors.ink,
    backgroundColor: Colors.canvasParchment,
    marginBottom: Spacing.sm,
  },
  manualSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    minHeight: TouchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  manualSubmitBtnText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.canvasPure,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  toggleModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
    gap: 8,
  },
  toggleModeText: {
    fontSize: Typography.fontSize.subheadline,
    fontWeight: '600',
    color: Colors.primary,
  },
});
