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
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { parseQrPayload } from '@/services/queueUtils';
import { api } from '@/services/api';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';

export interface CameraQrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess?: (payload: { clinicId: string; code: string }) => void | Promise<void>;
  defaultClinicId?: string;
  appointmentId?: string;
}

export const CameraQrScannerModal: React.FC<CameraQrScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
  defaultClinicId,
  appointmentId,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animated scanning line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setIsVerifying(false);
      setErrorMessage(null);
      setManualCode('');

      // Start looping scan line animation
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

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || isVerifying) return;
      setScanned(true);
      setIsVerifying(true);
      setErrorMessage(null);

      try {
        const parsed = parseQrPayload(data);
        if (!parsed || !parsed.clinicId) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          setErrorMessage('Invalid QR standee. Please scan an official MediArca clinic QR.');
          setTimeout(() => {
            setScanned(false);
            setIsVerifying(false);
          }, 1500);
          return;
        }

        if (onScanSuccess) {
          await onScanSuccess(parsed);
        } else {
          await api.checkInWithQR({
            clinicId: parsed.clinicId,
            code: parsed.code,
            appointmentId,
          });
        }

        // Tactile Haptic Vibration on confirmed verification
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        // Brief delay for tactile feedback before closing
        setTimeout(() => {
          onClose();
        }, 500);
      } catch (err: any) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setErrorMessage(err?.message || 'Check-in failed. Please try again or inform reception.');
        setTimeout(() => {
          setScanned(false);
          setIsVerifying(false);
        }, 2000);
      }
    },
    [scanned, isVerifying, onScanSuccess, appointmentId, onClose]
  );

  const handleManualSubmit = async () => {
    const code = manualCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid check-in code (at least 4 characters).');
      return;
    }

    const clinicId = defaultClinicId || '';
    if (!clinicId) {
      setErrorMessage('Missing clinic facility ID. Please scan the clinic desk QR standee using your camera.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      if (onScanSuccess) {
        await onScanSuccess({ clinicId, code });
      } else {
        await api.checkInWithQR({
          clinicId,
          code,
          appointmentId,
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setErrorMessage(err?.message || 'Failed to verify check-in code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.modalTitle}>Scan Clinic QR</Text>
              <Text style={styles.modalSubtitle}>
                Aim at front desk standee to confirm arrival
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={Colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Body: Camera Viewfinder OR Permission Request OR Manual Input */}
          {showManualInput ? (
            <View style={styles.manualContainer}>
              <Ionicons name="keypad-outline" size={40} color={Colors.primary} style={styles.manualIcon} />
              <Text style={styles.manualTitle}>Enter Check-in Code</Text>
              <Text style={styles.manualDesc}>
                Enter the 6-character code printed below the clinic desk QR standee.
              </Text>

              <TextInput
                style={styles.manualInput}
                value={manualCode}
                onChangeText={(t) => setManualCode(t.toUpperCase())}
                placeholder="e.g. MC-8921"
                placeholderTextColor={Colors.inkMuted48}
                autoCapitalize="characters"
                maxLength={10}
                autoFocus
              />

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleManualSubmit}
                disabled={isVerifying}
                activeOpacity={0.85}
              >
                {isVerifying ? (
                  <ActivityIndicator color={Colors.inkWhite} size="small" />
                ) : (
                  <Text style={styles.primaryActionText}>Verify & Check In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textOnlyButton}
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.textOnlyButtonText}>Switch Back to Camera</Text>
              </TouchableOpacity>
            </View>
          ) : !permission ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.statusBoxText}>Checking camera access...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionContainer}>
              <Ionicons name="camera-outline" size={48} color={Colors.inkMuted80} style={styles.permissionIcon} />
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionSubtitle}>
                MediArca requires camera access to scan reception desk QR codes and mark your presence.
              </Text>

              {permission.canAskAgain ? (
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={requestPermission}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryActionText}>Grant Camera Access</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleOpenSettings}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryActionText}>Open Device Settings</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.textOnlyButton}
                onPress={() => setShowManualInput(true)}
              >
                <Text style={styles.textOnlyButtonText}>Enter Code Manually</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraWrapper}>
              {/* Native Hardware Viewfinder */}
              <CameraView
                style={styles.cameraView}
                facing="back"
                enableTorch={torchOn}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />

              {/* Torch Button */}
              <TouchableOpacity
                style={[styles.torchButton, torchOn && styles.torchButtonActive]}
                onPress={() => setTorchOn((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={torchOn ? 'flash' : 'flash-outline'}
                  size={20}
                  color={torchOn ? Colors.ink : Colors.inkWhite}
                />
              </TouchableOpacity>

              {/* Viewfinder Target Frame */}
              <View style={styles.targetFrame}>
                {/* 4 Corner Markers */}
                <View style={[styles.cornerMarker, styles.cornerTL]} />
                <View style={[styles.cornerMarker, styles.cornerTR]} />
                <View style={[styles.cornerMarker, styles.cornerBL]} />
                <View style={[styles.cornerMarker, styles.cornerBR]} />

                {/* Animated Laser Scanning Line */}
                {!scanned && (
                  <Animated.View
                    style={[
                      styles.scanLaser,
                      {
                        transform: [{ translateY: scanLineAnim }],
                      },
                    ]}
                  />
                )}

                {/* Scanning / Success Feedback Overlay */}
                {isVerifying && (
                  <View style={styles.feedbackOverlay}>
                    <ActivityIndicator color={Colors.inkWhite} size="large" />
                    <Text style={styles.feedbackText}>Confirming Arrival...</Text>
                  </View>
                )}
              </View>

              {/* Bottom Camera Toolbar */}
              <View style={styles.cameraFooter}>
                <TouchableOpacity
                  style={styles.manualFallbackPill}
                  onPress={() => setShowManualInput(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="keypad-outline" size={16} color={Colors.inkWhite} />
                  <Text style={styles.manualFallbackText}>Enter Code Manually</Text>
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <View style={styles.cameraErrorBanner}>
                  <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                  <Text style={styles.cameraErrorText} numberOfLines={2}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Security Notice */}
          <View style={styles.modalFooter}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
            <Text style={styles.footerNoteText}>
              Physical clinic verification · Instant token activation
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    ...Shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  headerTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    ...Typography.title2,
    color: Colors.ink,
  },
  modalSubtitle: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraWrapper: {
    width: '100%',
    height: 320,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  torchButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  torchButtonActive: {
    backgroundColor: Colors.inkWhite,
  },
  targetFrame: {
    width: 210,
    height: 210,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  scanLaser: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: 2.5,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 102, 204, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  feedbackText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
    marginTop: Spacing.two,
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
  },
  manualFallbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  manualFallbackText: {
    ...Typography.captionBold,
    color: Colors.inkWhite,
    fontSize: 12,
  },
  cameraErrorBanner: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 64,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 10,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cameraErrorText: {
    ...Typography.caption,
    color: Colors.danger,
    flex: 1,
  },
  permissionContainer: {
    padding: Spacing.four,
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.card,
  },
  permissionIcon: {
    marginBottom: Spacing.two,
  },
  permissionTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionSubtitle: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  statusBox: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusBoxText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
  },
  manualContainer: {
    padding: Spacing.four,
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.card,
  },
  manualIcon: {
    marginBottom: Spacing.two,
  },
  manualTitle: {
    ...Typography.bodyBold,
    color: Colors.ink,
    fontSize: 16,
    marginBottom: 4,
  },
  manualDesc: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  manualInput: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    ...Typography.title2,
    color: Colors.ink,
    letterSpacing: 3,
    marginBottom: Spacing.three,
  },
  primaryActionButton: {
    width: '100%',
    height: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    ...Shadows.card,
  },
  primaryActionText: {
    ...Typography.bodyBold,
    color: Colors.inkWhite,
  },
  textOnlyButton: {
    marginTop: Spacing.three,
    paddingVertical: 8,
  },
  textOnlyButtonText: {
    ...Typography.captionBold,
    color: Colors.primary,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.four,
  },
  footerNoteText: {
    ...Typography.caption,
    color: Colors.inkMuted80,
    fontSize: 11,
  },
});
