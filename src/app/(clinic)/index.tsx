import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import {
  api,
  ClinicProfile,
  ClinicDashboardData,
  ClinicReceptionistItem,
  Doctor,
  getFileUrl,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  validateClinicProfile,
  validateReceptionistCreation,
} from '@/services/adminClinicUtils';

const DEMO_CLINIC_PROFILE: ClinicProfile = {
  id: 'clinic_demo_1',
  clinicName: 'City Heart & Vascular Institute',
  address: 'Suite 402, Hill Road, Bandra West',
  city: 'Mumbai',
  state: 'Maharashtra',
  phone: '+91 98200 12345',
  checkinCode: 'CHVI',
  isVerified: true,
  verificationStatus: 'VERIFIED',
  _count: { doctors: 2 },
};

export default function ClinicManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'doctors' | 'staff'>('profile');
  const [clinic, setClinic] = useState<ClinicProfile>(DEMO_CLINIC_PROFILE);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [receptionists, setReceptionists] = useState<ClinicReceptionistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Profile Edit State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editClinicName, setEditClinicName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Add Doctor Modal State
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [doctorEmailInput, setDoctorEmailInput] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  // Add Receptionist Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const fetchClinicData = useCallback(async () => {
    try {
      const data: ClinicDashboardData = await api.getMyClinic();
      if (data?.clinic) {
        setClinic(data.clinic);
        setEditClinicName(data.clinic.clinicName || '');
        setEditAddress(data.clinic.address || '');
        setEditCity(data.clinic.city || '');
        setEditState(data.clinic.state || '');
        setEditPhone(data.clinic.phone || '');
      }
      if (data?.doctors) {
        setDoctors(data.doctors);
      }
      if (data?.incomingRequests) {
        setIncomingRequests(data.incomingRequests);
      }
      if (data?.receptionists) {
        setReceptionists(data.receptionists);
      } else {
        const staff = await api.getClinicReceptionists();
        if (Array.isArray(staff)) setReceptionists(staff);
      }
    } catch {
      // Offline / Demo Fallback
      setClinic(DEMO_CLINIC_PROFILE);
      setEditClinicName(DEMO_CLINIC_PROFILE.clinicName);
      setEditAddress(DEMO_CLINIC_PROFILE.address);
      setEditCity(DEMO_CLINIC_PROFILE.city || 'Mumbai');
      setEditState(DEMO_CLINIC_PROFILE.state || 'Maharashtra');
      setEditPhone(DEMO_CLINIC_PROFILE.phone || '+91 98200 12345');

      setDoctors([
        {
          id: 'affil_1',
          doctorId: 'doc_sarah_01',
          status: 'ACCEPTED',
          doctor: {
            id: 'doc_sarah_01',
            fullName: 'Dr. Sarah Jenkins',
            specialty: 'Cardiology',
            consultationFee: 800,
            user: { fullName: 'Dr. Sarah Jenkins', email: 'dr.sarah@mediarca.com' },
          },
        },
      ]);
      setReceptionists([
        {
          id: 'rec_1',
          userId: 'usr_rec_1',
          fullName: 'Pooja Patel',
          email: 'pooja.desk@chvi.org',
          phone: '+91 98765 43210',
          status: 'ACTIVE',
          doctorIds: ['doc_sarah_01'],
          doctors: [{ id: 'doc_sarah_01', fullName: 'Dr. Sarah Jenkins', specialty: 'Cardiology' }],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClinicData();
  }, [fetchClinicData]);

  // Upload Clinic Facility Photo / Avatar
  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop() || 'clinic.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        const fileObj = {
          uri: localUri,
          name: filename,
          type,
        };

        const res = await api.uploadAvatar(fileObj);
        if (res?.avatarUrl) {
          setClinic((prev) => ({ ...prev, avatarUrl: res.avatarUrl }));
          Alert.alert('Photo Updated', 'Clinic facility photo uploaded successfully.');
        }
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Could not upload facility photo.');
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async () => {
    setProfileError(null);
    const validation = validateClinicProfile({
      clinicName: editClinicName,
      address: editAddress,
      city: editCity,
      state: editState,
      phone: editPhone,
    });

    if (!validation.isValid) {
      setProfileError(Object.values(validation.errors)[0]);
      return;
    }

    setProfileSaving(true);
    try {
      await api.updateClinicProfile({
        clinicName: editClinicName.trim(),
        address: editAddress.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        phone: editPhone.trim(),
      });
      setClinic((prev) => ({
        ...prev,
        clinicName: editClinicName.trim(),
        address: editAddress.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        phone: editPhone.trim(),
      }));
      setShowEditProfileModal(false);
      Alert.alert('Success', 'Clinic facility profile updated.');
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update clinic profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Add Doctor to Roster
  const handleAddDoctor = async () => {
    setDoctorError(null);
    if (!doctorEmailInput.trim() || !doctorEmailInput.includes('@')) {
      setDoctorError('Please enter a valid doctor email address.');
      return;
    }
    setAddingDoctor(true);
    try {
      await api.addDoctorToClinic({ doctorEmail: doctorEmailInput.trim() });
      setShowAddDoctorModal(false);
      setDoctorEmailInput('');
      Alert.alert('Request Sent', 'Affiliation request dispatched to doctor.');
      fetchClinicData();
    } catch (err: any) {
      setDoctorError(err?.message || 'Failed to send affiliation request.');
    } finally {
      setAddingDoctor(false);
    }
  };

  // Respond to Affiliation Request
  const handleRespondDoctor = async (affiliationId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      await api.respondToDoctorAffiliation(affiliationId, action);
      Alert.alert('Updated', `Doctor affiliation ${action === 'ACCEPT' ? 'approved' : 'rejected'}.`);
      fetchClinicData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to respond to affiliation.');
    }
  };

  // Remove Doctor from Clinic
  const handleRemoveDoctor = (doctorId: string, doctorName: string) => {
    Alert.alert(
      'Remove Doctor',
      `Are you sure you want to remove ${doctorName} from your clinic roster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeDoctorFromClinic(doctorId);
              fetchClinicData();
              Alert.alert('Removed', `${doctorName} has been removed from clinic.`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to remove doctor.');
            }
          },
        },
      ]
    );
  };

  // Add Receptionist Staff
  const handleAddStaff = async () => {
    setStaffError(null);
    const validation = validateReceptionistCreation({
      fullName: staffName,
      email: staffEmail,
      password: staffPassword,
      phone: staffPhone,
    });

    if (!validation.isValid) {
      setStaffError(Object.values(validation.errors)[0]);
      return;
    }

    setAddingStaff(true);
    try {
      await api.addClinicReceptionist({
        fullName: staffName.trim(),
        email: staffEmail.trim(),
        password: staffPassword,
        phone: staffPhone.trim() ? `+91 ${staffPhone.trim()}` : undefined,
      });
      setShowAddStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffPhone('');
      Alert.alert('Staff Account Created', 'Receptionist account registered successfully.');
      fetchClinicData();
    } catch (err: any) {
      setStaffError(err?.message || 'Failed to create staff account.');
    } finally {
      setAddingStaff(false);
    }
  };

  // Remove Receptionist Staff
  const handleRemoveStaff = (staffId: string, name: string) => {
    Alert.alert(
      'Remove Staff Member',
      `Are you sure you want to deactivate ${name}'s desk account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeClinicReceptionist(staffId);
              fetchClinicData();
              Alert.alert('Deactivated', 'Receptionist desk account removed.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to remove staff.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaViewContainer
      scrollable
      refreshing={isRefreshing}
      onRefresh={() => {
        setIsRefreshing(true);
        fetchClinicData();
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.inkDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinic Portal</Text>
        <TouchableOpacity
          style={styles.standeeNavButton}
          onPress={() => router.push('/(clinic)/standee')}
          activeOpacity={0.7}
          accessibilityLabel="View QR Standee"
        >
          <Ionicons name="qr-code-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Clinic Identity & Standee Banner */}
        <View style={styles.clinicBannerCard}>
          <TouchableOpacity
            style={styles.facilityPhotoBox}
            onPress={handlePickPhoto}
            activeOpacity={0.8}
          >
            {clinic.avatarUrl ? (
              <Image
                source={{ uri: getFileUrl(clinic.avatarUrl) }}
                style={styles.facilityPhoto}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="business" size={32} color={Colors.primary} />
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={12} color={Colors.inkWhite} />
            </View>
          </TouchableOpacity>

          <View style={styles.clinicBannerTextCol}>
            <Text style={styles.clinicTitle}>{clinic.clinicName}</Text>
            <Text style={styles.clinicAddress}>
              {clinic.address}, {clinic.city}
            </Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.statusBadge,
                  clinic.verificationStatus === 'VERIFIED' || clinic.isVerified
                    ? styles.statusVerified
                    : styles.statusPending,
                ]}
              >
                <Ionicons
                  name={
                    clinic.verificationStatus === 'VERIFIED' || clinic.isVerified
                      ? 'shield-checkmark'
                      : 'time-outline'
                  }
                  size={12}
                  color={
                    clinic.verificationStatus === 'VERIFIED' || clinic.isVerified
                      ? Colors.success
                      : Colors.warning
                  }
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    clinic.verificationStatus === 'VERIFIED' || clinic.isVerified
                      ? styles.textVerified
                      : styles.textPending,
                  ]}
                >
                  {clinic.verificationStatus || (clinic.isVerified ? 'VERIFIED' : 'PENDING')}
                </Text>
              </View>
              <Text style={styles.codeText}>Code: {clinic.checkinCode || 'CHVI'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Standee CTA Bar */}
        <TouchableOpacity
          style={styles.standeeBannerCta}
          onPress={() => router.push('/(clinic)/standee')}
          activeOpacity={0.85}
        >
          <View style={styles.standeeIconCircle}>
            <Ionicons name="print-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.standeeTextCol}>
            <Text style={styles.standeeCtaTitle}>Counter QR Standee Screen</Text>
            <Text style={styles.standeeCtaSubtitle}>
              View high-res check-in QR code & share/save for counter printing
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.inkSecondary} />
        </TouchableOpacity>

        {/* Segmented Tab Navigation */}
        <View style={styles.segmentedTabRow}>
          {[
            { id: 'profile', label: 'Facility Info', icon: 'business-outline' },
            { id: 'doctors', label: `Doctors (${doctors.length})`, icon: 'medkit-outline' },
            { id: 'staff', label: `Desk Staff (${receptionists.length})`, icon: 'people-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.segmentBtn, activeTab === tab.id && styles.segmentBtnActive]}
              onPress={() => setActiveTab(tab.id as any)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.id ? Colors.primary : Colors.inkSecondary}
              />
              <Text
                style={[
                  styles.segmentBtnText,
                  activeTab === tab.id && styles.segmentBtnTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab 1: Profile View */}
        {activeTab === 'profile' ? (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Facility Details</Text>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setShowEditProfileModal(true)}
              >
                <Ionicons name="create-outline" size={16} color={Colors.primary} />
                <Text style={styles.editProfileButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Facility Name</Text>
              <Text style={styles.detailValue}>{clinic.clinicName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Street Address</Text>
              <Text style={styles.detailValue}>{clinic.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>City & State</Text>
              <Text style={styles.detailValue}>
                {clinic.city || '--'}, {clinic.state || '--'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact Phone</Text>
              <Text style={styles.detailValue}>{clinic.phone || '--'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-In Standee Code</Text>
              <Text style={[styles.detailValue, { fontWeight: '700', color: Colors.primary }]}>
                {clinic.checkinCode || 'CHVI'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Tab 2: Doctor Roster */}
        {activeTab === 'doctors' ? (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Affiliated Doctors</Text>
              <TouchableOpacity
                style={styles.actionPillButton}
                onPress={() => setShowAddDoctorModal(true)}
              >
                <Ionicons name="person-add" size={14} color={Colors.inkWhite} />
                <Text style={styles.actionPillButtonText}>Add Doctor</Text>
              </TouchableOpacity>
            </View>

            {/* Incoming Requests */}
            {incomingRequests.length > 0 ? (
              <View style={styles.incomingSection}>
                <Text style={styles.incomingHeading}>Incoming Affiliation Requests</Text>
                {incomingRequests.map((req) => (
                  <View key={req.id} style={styles.incomingReqItem}>
                    <View style={styles.incomingTextCol}>
                      <Text style={styles.doctorItemName}>
                        {req.doctor?.fullName || req.doctor?.user?.fullName || 'Doctor'}
                      </Text>
                      <Text style={styles.doctorItemSpecialty}>
                        {req.doctor?.specialty || 'General Practitioner'}
                      </Text>
                    </View>
                    <View style={styles.incomingActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleRespondDoctor(req.id, 'ACCEPT')}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleRespondDoctor(req.id, 'REJECT')}
                      >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Roster List */}
            {doctors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="medkit-outline" size={36} color={Colors.inkSecondary} />
                <Text style={styles.emptyText}>No affiliated doctors found</Text>
                <Text style={styles.emptySubtext}>Invite practicing doctors using their email.</Text>
              </View>
            ) : (
              doctors.map((item) => {
                const doc = item.doctor || {};
                const name = doc.fullName || doc.user?.fullName || 'Doctor';
                const specialty = doc.specialty || 'Specialist';
                return (
                  <View key={item.id} style={styles.doctorListItem}>
                    <View style={styles.docAvatarCircle}>
                      <Text style={styles.docAvatarInitial}>
                        {name.replace(/^Dr\.\s*/i, '')[0] || 'D'}
                      </Text>
                    </View>
                    <View style={styles.docInfoCol}>
                      <Text style={styles.doctorItemName}>{name}</Text>
                      <Text style={styles.doctorItemSpecialty}>{specialty}</Text>
                      <View style={styles.statusPillSmall}>
                        <Text style={styles.statusPillSmallText}>{item.status || 'ACCEPTED'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteIconButton}
                      onPress={() => handleRemoveDoctor(doc.id || item.doctorId, name)}
                      accessibilityLabel="Remove doctor"
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {/* Tab 3: Receptionist Staff */}
        {activeTab === 'staff' ? (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Front Desk Receptionists</Text>
              <TouchableOpacity
                style={styles.actionPillButton}
                onPress={() => setShowAddStaffModal(true)}
              >
                <Ionicons name="person-add" size={14} color={Colors.inkWhite} />
                <Text style={styles.actionPillButtonText}>Add Staff</Text>
              </TouchableOpacity>
            </View>

            {receptionists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={36} color={Colors.inkSecondary} />
                <Text style={styles.emptyText}>No desk staff accounts created</Text>
                <Text style={styles.emptySubtext}>
                  Add receptionists to manage arrivals and dispense walk-in tokens.
                </Text>
              </View>
            ) : (
              receptionists.map((staff) => (
                <View key={staff.id} style={styles.staffListItem}>
                  <View style={styles.staffAvatarCircle}>
                    <Ionicons name="person" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.staffInfoCol}>
                    <Text style={styles.staffNameText}>{staff.fullName}</Text>
                    <Text style={styles.staffEmailText}>{staff.email}</Text>
                    {staff.phone ? (
                      <Text style={styles.staffPhoneText}>{staff.phone}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteIconButton}
                    onPress={() => handleRemoveStaff(staff.id, staff.fullName)}
                    accessibilityLabel="Remove staff member"
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Edit Facility Details</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <Ionicons name="close" size={20} color={Colors.inkDark} />
              </TouchableOpacity>
            </View>

            {profileError ? (
              <View style={styles.modalErrorBanner}>
                <Text style={styles.modalErrorText}>{profileError}</Text>
              </View>
            ) : null}

            <ScrollView style={styles.modalFormScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Facility Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editClinicName}
                  onChangeText={setEditClinicName}
                  placeholder="e.g. City Heart & Vascular Institute"
                  placeholderTextColor={Colors.inkSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Street Address *</Text>
                <TextInput
                  style={styles.input}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Street / Building / Area"
                  placeholderTextColor={Colors.inkSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="City"
                  placeholderTextColor={Colors.inkSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  value={editState}
                  onChangeText={setEditState}
                  placeholder="State"
                  placeholderTextColor={Colors.inkSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Phone</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+91 98200 12345"
                  placeholderTextColor={Colors.inkSecondary}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalBtn, profileSaving && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={profileSaving}
              >
                {profileSaving ? (
                  <ActivityIndicator color={Colors.inkWhite} size="small" />
                ) : (
                  <Text style={styles.confirmModalBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Doctor Modal */}
      <Modal
        visible={showAddDoctorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddDoctorModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Affiliate Practicing Doctor</Text>
              <TouchableOpacity onPress={() => setShowAddDoctorModal(false)}>
                <Ionicons name="close" size={20} color={Colors.inkDark} />
              </TouchableOpacity>
            </View>

            {doctorError ? (
              <View style={styles.modalErrorBanner}>
                <Text style={styles.modalErrorText}>{doctorError}</Text>
              </View>
            ) : null}

            <Text style={styles.modalHelperText}>
              Enter the registered email of the doctor to send an official clinic affiliation request.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Doctor Email *</Text>
              <TextInput
                style={styles.input}
                value={doctorEmailInput}
                onChangeText={setDoctorEmailInput}
                placeholder="doctor@example.com"
                placeholderTextColor={Colors.inkSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowAddDoctorModal(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalBtn, addingDoctor && { opacity: 0.6 }]}
                onPress={handleAddDoctor}
                disabled={addingDoctor}
              >
                {addingDoctor ? (
                  <ActivityIndicator color={Colors.inkWhite} size="small" />
                ) : (
                  <Text style={styles.confirmModalBtnText}>Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Staff Modal */}
      <Modal
        visible={showAddStaffModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddStaffModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Add Desk Receptionist</Text>
              <TouchableOpacity onPress={() => setShowAddStaffModal(false)}>
                <Ionicons name="close" size={20} color={Colors.inkDark} />
              </TouchableOpacity>
            </View>

            {staffError ? (
              <View style={styles.modalErrorBanner}>
                <Text style={styles.modalErrorText}>{staffError}</Text>
              </View>
            ) : null}

            <ScrollView style={styles.modalFormScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Staff Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={staffName}
                  onChangeText={setStaffName}
                  placeholder="e.g. Pooja Patel"
                  placeholderTextColor={Colors.inkSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Login Email *</Text>
                <TextInput
                  style={styles.input}
                  value={staffEmail}
                  onChangeText={setStaffEmail}
                  placeholder="reception@clinic.org"
                  placeholderTextColor={Colors.inkSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Temporary Password (min 8 chars) *</Text>
                <TextInput
                  style={styles.input}
                  value={staffPassword}
                  onChangeText={setStaffPassword}
                  placeholder="Temporary password"
                  placeholderTextColor={Colors.inkSecondary}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone</Text>
                <TextInput
                  style={styles.input}
                  value={staffPhone}
                  onChangeText={(t) => setStaffPhone(t.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  placeholderTextColor={Colors.inkSecondary}
                  keyboardType="number-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowAddStaffModal(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalBtn, addingStaff && { opacity: 0.6 }]}
                onPress={handleAddStaff}
                disabled={addingStaff}
              >
                {addingStaff ? (
                  <ActivityIndicator color={Colors.inkWhite} size="small" />
                ) : (
                  <Text style={styles.confirmModalBtnText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaViewContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.canvasPure,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
  },
  backButton: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.canvasParchment,
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.inkDark,
    fontWeight: '600',
  },
  standeeNavButton: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
  },
  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  clinicBannerCard: {
    flexDirection: 'row',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  facilityPhotoBox: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.canvasParchment,
  },
  facilityPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    ...Typography.caption2,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicBannerTextCol: {
    flex: 1,
  },
  clinicTitle: {
    ...Typography.title3,
    fontWeight: '700',
    color: Colors.inkDark,
  },
  clinicAddress: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  statusVerified: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
  },
  statusBadgeText: {
    ...Typography.caption2,
    fontWeight: '700',
  },
  textVerified: {
    color: Colors.success,
  },
  textPending: {
    color: Colors.warning,
  },
  codeText: {
    ...Typography.caption2,
    color: Colors.inkSecondary,
    fontWeight: '500',
  },
  standeeBannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.25)',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  standeeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  standeeTextCol: {
    flex: 1,
  },
  standeeCtaTitle: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.primary,
  },
  standeeCtaSubtitle: {
    ...Typography.caption2,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  segmentedTabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(0, 102, 204, 0.12)',
  },
  segmentBtnText: {
    ...Typography.caption1,
    color: Colors.inkSecondary,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.inkDark,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editProfileButtonText: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
  },
  detailLabel: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
  },
  detailValue: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.inkDark,
    textAlign: 'right',
    maxWidth: 200,
  },
  actionPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  actionPillButtonText: {
    ...Typography.caption1,
    color: Colors.inkWhite,
    fontWeight: '600',
  },
  incomingSection: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  incomingHeading: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  incomingReqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
  },
  incomingTextCol: {
    flex: 1,
  },
  incomingActions: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  acceptButtonText: {
    ...Typography.caption2,
    color: Colors.inkWhite,
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: Colors.canvasParchment,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  rejectButtonText: {
    ...Typography.caption2,
    color: Colors.danger,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  emptyText: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.inkDark,
  },
  emptySubtext: {
    ...Typography.caption1,
    color: Colors.inkSecondary,
  },
  doctorListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
    gap: Spacing.sm,
  },
  docAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docAvatarInitial: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.primary,
  },
  docInfoCol: {
    flex: 1,
  },
  doctorItemName: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.inkDark,
  },
  doctorItemSpecialty: {
    ...Typography.caption1,
    color: Colors.inkSecondary,
  },
  statusPillSmall: {
    marginTop: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  statusPillSmallText: {
    ...Typography.caption2,
    color: Colors.success,
    fontWeight: '600',
    fontSize: 10,
  },
  staffListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
    gap: Spacing.sm,
  },
  staffAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffInfoCol: {
    flex: 1,
  },
  staffNameText: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.inkDark,
  },
  staffEmailText: {
    ...Typography.caption1,
    color: Colors.inkSecondary,
  },
  staffPhoneText: {
    ...Typography.caption2,
    color: Colors.inkSecondary,
  },
  deleteIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalHeading: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.inkDark,
  },
  modalErrorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modalErrorText: {
    ...Typography.caption1,
    color: Colors.danger,
    fontWeight: '500',
  },
  modalHelperText: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  modalFormScroll: {
    maxHeight: 320,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.inkDark,
    marginBottom: 4,
  },
  input: {
    minHeight: TouchTarget.minSize,
    borderWidth: 1,
    borderColor: Colors.borderField,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    color: Colors.inkDark,
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelModalBtn: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.canvasParchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.inkDark,
  },
  confirmModalBtn: {
    flex: 1,
    minHeight: TouchTarget.minSize,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalBtnText: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.inkWhite,
  },
});
