import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaViewContainer } from '@/components/common/SafeAreaViewContainer';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget, Shadows } from '@/constants/theme';
import {
  api,
  Doctor,
  ClinicProfile,
  ContactMessageItem,
} from '@/services/api';
import {
  filterDoctorsByStatus,
  filterClinicsByStatus,
  filterMessagesByStatus,
} from '@/services/adminClinicUtils';

export default function AdminGovernanceScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'doctors' | 'clinics' | 'messages'>('doctors');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState<{
    totalDoctors: number;
    pendingDoctors: number;
    totalClinics: number;
    pendingClinics: number;
    totalMessages: number;
  }>({
    totalDoctors: 0,
    pendingDoctors: 0,
    totalClinics: 0,
    pendingClinics: 0,
    totalMessages: 0,
  });

  // Doctor Verification State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorStatusFilter, setDoctorStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'>('ALL');
  const [doctorSearch, setDoctorSearch] = useState('');

  // Clinic Verification State
  const [clinics, setClinics] = useState<ClinicProfile[]>([]);
  const [clinicStatusFilter, setClinicStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'>('ALL');
  const [clinicSearch, setClinicSearch] = useState('');

  // Support Inquiries State
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [messageFilter, setMessageFilter] = useState<'ALL' | 'NEW' | 'READ'>('ALL');
  const [messageSearch, setMessageSearch] = useState('');

  // Action in-flight IDs
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      // 1. Fetch Stats
      try {
        const s = await api.getAdminStats();
        if (s) {
          setStats({
            totalDoctors: s.totalDoctors || 0,
            pendingDoctors: s.pendingDoctors || 0,
            totalClinics: s.totalClinics || 0,
            pendingClinics: s.pendingClinics || 0,
            totalMessages: 0,
          });
        }
      } catch {
        // Non-blocking stats
      }

      // 2. Fetch Doctors
      try {
        const docs = await api.getAdminDoctors({ limit: 50 });
        if (Array.isArray(docs)) setDoctors(docs);
      } catch {
        const fallbackDocs = await api.getDoctors();
        if (Array.isArray(fallbackDocs)) setDoctors(fallbackDocs);
      }

      // 3. Fetch Clinics
      try {
        const cls = await api.getAdminClinics({ limit: 50 });
        if (Array.isArray(cls)) setClinics(cls);
      } catch {
        const fallbackCls = await api.getPublicClinics();
        if (Array.isArray(fallbackCls)) setClinics(fallbackCls);
      }

      // 4. Fetch Contact Messages
      try {
        const msgs = await api.getAdminContactMessages();
        if (Array.isArray(msgs)) {
          setMessages(msgs);
          setStats((prev) => ({ ...prev, totalMessages: msgs.length }));
        }
      } catch {
        setMessages([
          {
            id: 'msg_demo_1',
            fullName: 'Dr. Ramesh Gupta',
            email: 'ramesh.g@delhiclinic.in',
            phone: '+91 98110 99887',
            subject: 'Doctor Medical Council Verification Inquiry',
            message: 'Uploaded our Delhi Medical Council registration certificates. Kindly review our clinic affiliation request.',
            status: 'NEW',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'msg_demo_2',
            fullName: 'Ananya Verma',
            email: 'ananya.v@gmail.com',
            phone: '+91 98200 44332',
            subject: 'OPD Queue Check-In Question',
            message: 'App is working great for token passes! Just wanted to clarify if we can check in 10 minutes prior to shift start.',
            status: 'READ',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Verify Doctor Action
  const handleVerifyDoctor = async (
    doctorId: string,
    action: 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  ) => {
    setActionId(doctorId);
    try {
      await api.verifyDoctor(doctorId, action);
      setDoctors((prev) =>
        prev.map((doc) =>
          doc.id === doctorId
            ? {
                ...doc,
                isVerified: action === 'VERIFIED',
                verificationStatus: action,
              }
            : doc
        )
      );
      Alert.alert('Status Updated', `Doctor credential status changed to ${action}.`);
    } catch (err: any) {
      Alert.alert('Action Failed', err?.message || 'Could not update doctor verification status.');
    } finally {
      setActionId(null);
    }
  };

  // Verify Clinic Action
  const handleVerifyClinic = async (
    clinicId: string,
    action: 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  ) => {
    setActionId(clinicId);
    try {
      await api.verifyClinic(clinicId, action);
      setClinics((prev) =>
        prev.map((c) =>
          c.id === clinicId
            ? {
                ...c,
                isVerified: action === 'VERIFIED',
                verificationStatus: action,
              }
            : c
        )
      );
      Alert.alert('Status Updated', `Clinic establishment license status changed to ${action}.`);
    } catch (err: any) {
      Alert.alert('Action Failed', err?.message || 'Could not update clinic verification status.');
    } finally {
      setActionId(null);
    }
  };

  // Mark Message Read
  const handleMarkMessageRead = async (messageId: string) => {
    try {
      await api.markContactMessageRead(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'READ' } : m))
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not mark message as read.');
    }
  };

  // Delete Message
  const handleDeleteMessage = (messageId: string) => {
    Alert.alert('Delete Inquiry', 'Are you sure you want to delete this message record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteContactMessage(messageId);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete message.');
          }
        },
      },
    ]);
  };

  // Filtered Lists
  const filteredDoctors = filterDoctorsByStatus(doctors, doctorStatusFilter, doctorSearch);
  const filteredClinics = filterClinicsByStatus(clinics, clinicStatusFilter, clinicSearch);
  const filteredMessages = filterMessagesByStatus(messages, messageFilter, messageSearch);

  return (
    <SafeAreaViewContainer
      scrollable
      refreshing={isRefreshing}
      onRefresh={() => {
        setIsRefreshing(true);
        fetchAdminData();
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
        <Text style={styles.headerTitle}>Admin Governance</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.contentContainer}>
        {/* Governance Telemetry Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{doctors.length}</Text>
            <Text style={styles.metricLbl}>Doctors</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>
                {doctors.filter((d) => !d.isVerified || d.verificationStatus === 'PENDING').length} Pending
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{clinics.length}</Text>
            <Text style={styles.metricLbl}>Clinics</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>
                {clinics.filter((c) => !c.isVerified || c.verificationStatus === 'PENDING').length} Pending
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{messages.length}</Text>
            <Text style={styles.metricLbl}>Inquiries</Text>
            <View style={[styles.pendingBadge, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <Text style={[styles.pendingBadgeText, { color: Colors.primary }]}>
                {messages.filter((m) => m.status === 'NEW').length} New
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          {[
            { id: 'doctors', label: 'Doctor Licensure', icon: 'shield-checkmark-outline' },
            { id: 'clinics', label: 'Clinic Licenses', icon: 'business-outline' },
            { id: 'messages', label: 'Support Inquiries', icon: 'mail-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id as any)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.id ? Colors.primary : Colors.inkSecondary}
              />
              <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TAB 1: Doctor Verification Queue */}
        {activeTab === 'doctors' ? (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Doctor Medical Council Verification</Text>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterChipRow}>
              {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, doctorStatusFilter === st && styles.filterChipActive]}
                  onPress={() => setDoctorStatusFilter(st)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      doctorStatusFilter === st && styles.filterChipTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={Colors.inkSecondary} />
              <TextInput
                style={styles.searchInput}
                value={doctorSearch}
                onChangeText={setDoctorSearch}
                placeholder="Search by doctor name or specialty..."
                placeholderTextColor={Colors.inkSecondary}
              />
            </View>

            {/* Doctors List */}
            {filteredDoctors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-outline" size={36} color={Colors.inkSecondary} />
                <Text style={styles.emptyText}>No doctors matching current filter</Text>
              </View>
            ) : (
              filteredDoctors.map((doc) => {
                const name = doc.user?.fullName || 'Dr. Specialist';
                const status = doc.verificationStatus || (doc.isVerified ? 'VERIFIED' : 'PENDING');
                const isOperating = actionId === doc.id;

                return (
                  <View key={doc.id} style={styles.itemCard}>
                    <View style={styles.itemHeaderRow}>
                      <View style={styles.itemTitleCol}>
                        <Text style={styles.itemName}>{name}</Text>
                        <Text style={styles.itemSub}>{doc.specialty} • {doc.qualifications || 'MD'}</Text>
                        <Text style={styles.itemDetailText}>{doc.user?.email || ''}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          status === 'VERIFIED'
                            ? styles.statusVerified
                            : status === 'PENDING'
                            ? styles.statusPending
                            : styles.statusRejected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            status === 'VERIFIED'
                              ? styles.textVerified
                              : status === 'PENDING'
                              ? styles.textPending
                              : styles.textRejected,
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      {isOperating ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <>
                          {status !== 'VERIFIED' ? (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.approveBtn]}
                              onPress={() => handleVerifyDoctor(doc.id, 'VERIFIED')}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="checkmark-circle" size={14} color={Colors.inkWhite} />
                              <Text style={styles.actionBtnText}>Approve</Text>
                            </TouchableOpacity>
                          ) : null}

                          {status !== 'REJECTED' ? (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.rejectBtn]}
                              onPress={() => handleVerifyDoctor(doc.id, 'REJECTED')}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="close-circle" size={14} color={Colors.danger} />
                              <Text style={[styles.actionBtnText, { color: Colors.danger }]}>
                                Reject
                              </Text>
                            </TouchableOpacity>
                          ) : null}

                          {status !== 'SUSPENDED' && status === 'VERIFIED' ? (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.suspendBtn]}
                              onPress={() => handleVerifyDoctor(doc.id, 'SUSPENDED')}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="ban" size={14} color={Colors.warning} />
                              <Text style={[styles.actionBtnText, { color: Colors.warning }]}>
                                Suspend
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {/* TAB 2: Clinic Verification Queue */}
        {activeTab === 'clinics' ? (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Clinic Establishment License Verification</Text>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterChipRow}>
              {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, clinicStatusFilter === st && styles.filterChipActive]}
                  onPress={() => setClinicStatusFilter(st)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      clinicStatusFilter === st && styles.filterChipTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={Colors.inkSecondary} />
              <TextInput
                style={styles.searchInput}
                value={clinicSearch}
                onChangeText={setClinicSearch}
                placeholder="Search by clinic name or city..."
                placeholderTextColor={Colors.inkSecondary}
              />
            </View>

            {/* Clinics List */}
            {filteredClinics.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={36} color={Colors.inkSecondary} />
                <Text style={styles.emptyText}>No clinics matching current filter</Text>
              </View>
            ) : (
              filteredClinics.map((c) => {
                const status = c.verificationStatus || (c.isVerified ? 'VERIFIED' : 'PENDING');
                const isOperating = actionId === c.id;

                return (
                  <View key={c.id} style={styles.itemCard}>
                    <View style={styles.itemHeaderRow}>
                      <View style={styles.itemTitleCol}>
                        <Text style={styles.itemName}>{c.clinicName}</Text>
                        <Text style={styles.itemSub}>{c.address}, {c.city || ''}</Text>
                        <Text style={styles.itemDetailText}>{c.phone || '--'}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          status === 'VERIFIED'
                            ? styles.statusVerified
                            : status === 'PENDING'
                            ? styles.statusPending
                            : styles.statusRejected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            status === 'VERIFIED'
                              ? styles.textVerified
                              : status === 'PENDING'
                              ? styles.textPending
                              : styles.textRejected,
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      {isOperating ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <>
                          {status !== 'VERIFIED' ? (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.approveBtn]}
                              onPress={() => handleVerifyClinic(c.id, 'VERIFIED')}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="checkmark-circle" size={14} color={Colors.inkWhite} />
                              <Text style={styles.actionBtnText}>Approve License</Text>
                            </TouchableOpacity>
                          ) : null}

                          {status !== 'REJECTED' ? (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.rejectBtn]}
                              onPress={() => handleVerifyClinic(c.id, 'REJECTED')}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="close-circle" size={14} color={Colors.danger} />
                              <Text style={[styles.actionBtnText, { color: Colors.danger }]}>
                                Reject
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {/* TAB 3: Support Inquiries */}
        {activeTab === 'messages' ? (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Platform Support & Feedback</Text>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterChipRow}>
              {(['ALL', 'NEW', 'READ'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, messageFilter === st && styles.filterChipActive]}
                  onPress={() => setMessageFilter(st)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      messageFilter === st && styles.filterChipTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={Colors.inkSecondary} />
              <TextInput
                style={styles.searchInput}
                value={messageSearch}
                onChangeText={setMessageSearch}
                placeholder="Search inquiries by sender, email, or subject..."
                placeholderTextColor={Colors.inkSecondary}
              />
            </View>

            {/* Messages List */}
            {filteredMessages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="mail-open-outline" size={36} color={Colors.inkSecondary} />
                <Text style={styles.emptyText}>No contact messages found</Text>
              </View>
            ) : (
              filteredMessages.map((msg) => (
                <View key={msg.id} style={styles.itemCard}>
                  <View style={styles.itemHeaderRow}>
                    <View style={styles.itemTitleCol}>
                      <Text style={styles.itemName}>{msg.subject}</Text>
                      <Text style={styles.itemSub}>{msg.fullName} • {msg.email}</Text>
                      {msg.phone ? (
                        <Text style={styles.itemDetailText}>{msg.phone}</Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        msg.status === 'NEW' ? styles.statusPending : styles.statusVerified,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          msg.status === 'NEW' ? styles.textPending : styles.textVerified,
                        ]}
                      >
                        {msg.status || 'NEW'}
                      </Text>
                    </View>
                  </View>

                  {/* Message Body */}
                  <View style={styles.messageContentBox}>
                    <Text style={styles.messageBodyText}>{msg.message}</Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    {msg.status === 'NEW' ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleMarkMessageRead(msg.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark" size={14} color={Colors.inkWhite} />
                        <Text style={styles.actionBtnText}>Mark as Read</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleDeleteMessage(msg.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                      <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>
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
  headerSpacer: {
    width: TouchTarget.minSize,
  },
  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  metricVal: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.inkDark,
  },
  metricLbl: {
    ...Typography.caption2,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  pendingBadge: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
  },
  pendingBadgeText: {
    ...Typography.caption2,
    color: Colors.warning,
    fontWeight: '700',
    fontSize: 10,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(0, 102, 204, 0.12)',
  },
  tabBtnText: {
    ...Typography.caption1,
    color: Colors.inkSecondary,
    fontWeight: '600',
  },
  tabBtnTextActive: {
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
  sectionHeaderRow: {
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.inkDark,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.canvasParchment,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption2,
    color: Colors.inkDark,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.inkWhite,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget.minSize,
    borderWidth: 1,
    borderColor: Colors.borderField,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...Typography.footnote,
    color: Colors.inkDark,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  emptyText: {
    ...Typography.footnote,
    color: Colors.inkSecondary,
  },
  itemCard: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  itemTitleCol: {
    flex: 1,
  },
  itemName: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.inkDark,
  },
  itemSub: {
    ...Typography.caption1,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  itemDetailText: {
    ...Typography.caption2,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  statusVerified: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  statusRejected: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
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
  textRejected: {
    color: Colors.danger,
  },
  messageContentBox: {
    backgroundColor: Colors.canvasPure,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  messageBodyText: {
    ...Typography.footnote,
    color: Colors.inkDark,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  approveBtn: {
    backgroundColor: Colors.success,
  },
  rejectBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  suspendBtn: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  actionBtnText: {
    ...Typography.caption1,
    color: Colors.inkWhite,
    fontWeight: '700',
  },
});
