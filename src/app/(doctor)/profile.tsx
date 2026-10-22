import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Header } from '@/components/common/Header';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import {
  api,
  getFileUrl,
  DoctorAffiliationsData,
  DoctorAffiliationClinic,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { user, updateUser, refreshUser, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [specialty, setSpecialty] = useState(user?.doctorProfile?.specialty || 'General Medicine');
  const [qualifications, setQualifications] = useState(user?.doctorProfile?.qualifications || 'MBBS');
  const [experienceYears, setExperienceYears] = useState(String(user?.doctorProfile?.experienceYears || '5'));
  const [bio, setBio] = useState(user?.doctorProfile?.bio || '');
  const [regNumber, setRegNumber] = useState((user?.doctorProfile as any)?.registrationNumber || '');

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const [affiliations, setAffiliations] = useState<DoctorAffiliationsData | null>(null);
  const [loadingAffiliations, setLoadingAffiliations] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [respondingAffId, setRespondingAffId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentAvatarUrl = avatarUri || getFileUrl((user?.doctorProfile as any)?.avatarUrl || user?.avatarUrl);

  const loadAffiliations = useCallback(async () => {
    setLoadingAffiliations(true);
    try {
      const data = await api.getDoctorAffiliations();
      setAffiliations(data);
    } catch (err: any) {
      console.warn('Could not load doctor affiliations:', err);
    } finally {
      setLoadingAffiliations(false);
    }
  }, []);

  useEffect(() => {
    loadAffiliations();
  }, [loadAffiliations]);

  // Handle Photo Picker & Cloudflare R2 Upload
  const handlePickAvatar = async () => {
    setErrorMsg(null);
    setUploadFeedback(null);

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Access Required',
          'Please allow camera roll access in settings to upload your medical profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Automatic compression
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const picked = result.assets[0];
      setAvatarUri(picked.uri);
      setAvatarUploading(true);
      setUploadFeedback('Compressing & uploading to Cloudflare R2...');

      const uploadPayload = {
        uri: picked.uri,
        name: 'avatar.jpg',
        type: picked.mimeType || 'image/jpeg',
      };

      const res = await api.uploadAvatar(uploadPayload);
      if (res && res.user) {
        updateUser(res.user);
        setUploadFeedback('Avatar uploaded to Cloudflare R2.');
        setSuccessMsg('Profile photo updated.');
        if (refreshUser) await refreshUser();
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload photo to storage.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Profile Save
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updatedUser = await api.updateDoctorProfile({
        fullName: fullName.trim(),
        specialty: specialty.trim(),
        qualifications: qualifications.trim(),
        experienceYears: parseInt(experienceYears, 10) || 5,
        bio: bio.trim(),
      });

      if (updatedUser) {
        updateUser(updatedUser);
        setSuccessMsg('Profile details saved.');
        if (refreshUser) await refreshUser();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save doctor profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Incoming Clinic Affiliation Response (Accept / Reject)
  const handleRespondToAffiliation = async (affiliationId: string, action: 'ACCEPT' | 'REJECT') => {
    setRespondingAffId(affiliationId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.respondToClinicAffiliation(affiliationId, action);
      setSuccessMsg(res?.message || `Clinic request ${action.toLowerCase()}ed.`);
      await loadAffiliations();
      if (refreshUser) await refreshUser();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      Alert.alert('Response Failed', err?.message || 'Unable to update clinic affiliation.');
    } finally {
      setRespondingAffId(null);
    }
  };

  const incomingRequests = affiliations?.incomingRequests || [];
  const activeClinics = affiliations?.clinics || [];

  return (
    <SafeAreaViewContainer>
      <Header
        title="Doctor Profile"
        subtitle="Credentials & Clinic Affiliations"
        showBack
        rightElement={
          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={handleSaveProfile}
            disabled={savingProfile}
            activeOpacity={0.8}
          >
            {savingProfile ? (
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

        {/* 1. Cloudflare R2 Avatar Upload Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              {currentAvatarUrl ? (
                <Image source={{ uri: currentAvatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {fullName ? fullName[0].toUpperCase() : 'D'}
                  </Text>
                </View>
              )}

              {avatarUploading ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={Colors.inkWhite} size="small" />
                </View>
              ) : null}
            </View>

            <View style={styles.avatarInfoCol}>
              <Text style={styles.doctorNameHeading}>{fullName || 'Dr. Doctor'}</Text>
              <Text style={styles.doctorSubHeading}>{specialty} • {qualifications}</Text>

              <TouchableOpacity
                style={styles.uploadPhotoBtn}
                onPress={handlePickAvatar}
                disabled={avatarUploading}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                <Text style={styles.uploadPhotoBtnText}>Update Photo (R2)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {uploadFeedback ? (
            <Text style={styles.uploadFeedbackText}>{uploadFeedback}</Text>
          ) : null}
        </View>

        {/* 2. Medical Credentials & Bio Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Professional Details</Text>
          <Text style={styles.cardSubtitle}>
            Displayed on patient discovery cards and consultation receipts
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Full Legal Name</Text>
            <TextInput
              style={styles.formInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Dr. Sarah Jenkins"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Medical Specialty</Text>
            <TextInput
              style={styles.formInput}
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="Cardiology, General Medicine"
            />
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Qualifications</Text>
              <TextInput
                style={styles.formInput}
                value={qualifications}
                onChangeText={setQualifications}
                placeholder="MBBS, MD"
              />
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Experience (Years)</Text>
              <TextInput
                style={styles.formInput}
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="number-pad"
                placeholder="10"
              />
            </View>
          </View>

          {regNumber ? (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>State Medical Council Registration</Text>
              <View style={styles.regNumberBox}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.successDark} />
                <Text style={styles.regNumberText}>{regNumber}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Professional Bio & Clinical Focus</Text>
            <TextInput
              style={styles.bioTextArea}
              value={bio}
              onChangeText={setBio}
              placeholder="Consultant physician specializing in diagnostic cardiology and preventive care..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* 3. Incoming Clinic Affiliation Requests (Accept / Reject) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Incoming Clinic Requests</Text>
            {incomingRequests.length > 0 ? (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{incomingRequests.length} pending</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardSubtitle}>
            Clinics requesting to host your OPD consultation chambers
          </Text>

          {loadingAffiliations ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.loaderSpacing} />
          ) : incomingRequests.length > 0 ? (
            <View style={styles.requestsList}>
              {incomingRequests.map((req: any) => (
                <View key={req.id || req.clinicId} style={styles.requestItemCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.clinicIconCircle}>
                      <Ionicons name="business" size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.requestMetaCol}>
                      <Text style={styles.clinicReqName}>{req.clinicName || 'Apex Healthcare'}</Text>
                      {req.clinicAddress ? (
                        <Text style={styles.clinicReqAddress}>{req.clinicAddress}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.requestActionRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleRespondToAffiliation(req.id || req.clinicId, 'REJECT')}
                      disabled={respondingAffId === (req.id || req.clinicId)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={16} color={Colors.danger} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleRespondToAffiliation(req.id || req.clinicId, 'ACCEPT')}
                      disabled={respondingAffId === (req.id || req.clinicId)}
                      activeOpacity={0.8}
                    >
                      {respondingAffId === (req.id || req.clinicId) ? (
                        <ActivityIndicator size="small" color={Colors.inkWhite} />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color={Colors.inkWhite} />
                          <Text style={styles.acceptBtnText}>Accept Affiliation</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyRequestsText}>
              No incoming clinic affiliation requests at this time.
            </Text>
          )}
        </View>

        {/* 4. Active Affiliated Clinics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Affiliated Clinics</Text>
          <Text style={styles.cardSubtitle}>
            Venues where your live queue passes and tokens are active
          </Text>

          {activeClinics.length > 0 ? (
            <View style={styles.clinicsList}>
              {activeClinics.map((clinic) => (
                <View key={clinic.clinicId} style={styles.activeClinicItem}>
                  <View style={styles.clinicIconCircle}>
                    <Ionicons name="medical" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.clinicTextCol}>
                    <Text style={styles.activeClinicName}>{clinic.clinicName}</Text>
                    {(clinic as any).clinicAddress ? (
                      <Text style={styles.activeClinicAddress}>{(clinic as any).clinicAddress}</Text>
                    ) : null}
                    {(clinic as any).clinicPhone ? (
                      <Text style={styles.activeClinicPhone}>📞 {(clinic as any).clinicPhone}</Text>
                    ) : null}
                  </View>

                  <View style={styles.activePill}>
                    <View style={styles.greenPresenceDot} />
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyRequestsText}>
              Not currently affiliated with any external clinics. Practicing from private cabin.
            </Text>
          )}
        </View>

        {/* 5. Account & Session Actions */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.signOutBtnText}>Sign Out from Doctor Console</Text>
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
  card: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.hairline,
    ...Shadows.card,
    gap: Spacing.two,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.headline,
    color: Colors.ink,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.inkMuted48,
    marginBottom: Spacing.one,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: Colors.canvasParchment,
    borderWidth: 1.5,
    borderColor: Colors.hairline,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    ...Typography.title1,
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInfoCol: {
    flex: 1,
    gap: 4,
  },
  doctorNameHeading: {
    ...Typography.headline,
    color: Colors.ink,
    fontWeight: '700',
  },
  doctorSubHeading: {
    ...Typography.caption,
    color: Colors.inkMuted48,
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.hairline,
    marginTop: 4,
  },
  uploadPhotoBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadFeedbackText: {
    ...Typography.caption,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  formGroup: {
    gap: 4,
    marginTop: 4,
  },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  formInput: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.three,
    ...Typography.body,
    color: Colors.ink,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  gridCol: {
    flex: 1,
    gap: 4,
  },
  regNumberBox: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#c2f0d4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  regNumberText: {
    ...Typography.bodyBold,
    color: Colors.successDark,
  },
  bioTextArea: {
    minHeight: 80,
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: Spacing.three,
    ...Typography.body,
    color: Colors.ink,
  },
  pendingBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.warningDark,
  },
  loaderSpacing: {
    paddingVertical: Spacing.four,
  },
  requestsList: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  requestItemCard: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.hairline,
    gap: Spacing.three,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  clinicIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestMetaCol: {
    flex: 1,
  },
  clinicReqName: {
    ...Typography.subheadline,
    fontWeight: '700',
    color: Colors.ink,
  },
  clinicReqAddress: {
    ...Typography.caption,
    color: Colors.inkMuted48,
  },
  requestActionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rejectBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rejectBtnText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.danger,
  },
  acceptBtn: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  acceptBtnText: {
    ...Typography.footnote,
    fontWeight: '700',
    color: Colors.inkWhite,
  },
  emptyRequestsText: {
    ...Typography.footnote,
    color: Colors.inkMuted48,
    fontStyle: 'italic',
    paddingVertical: Spacing.two,
  },
  clinicsList: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  activeClinicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.hairline,
    gap: Spacing.two,
  },
  clinicTextCol: {
    flex: 1,
    gap: 2,
  },
  activeClinicName: {
    ...Typography.subheadline,
    fontWeight: '700',
    color: Colors.ink,
  },
  activeClinicAddress: {
    ...Typography.caption,
    color: Colors.inkMuted48,
  },
  activeClinicPhone: {
    ...Typography.caption,
    color: Colors.inkMuted80,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  greenPresenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
  },
  signOutBtn: {
    minHeight: TouchTarget.minHeight,
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  signOutBtnText: {
    ...Typography.bodyBold,
    color: Colors.danger,
  },
});
