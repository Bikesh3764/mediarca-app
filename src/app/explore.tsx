import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Doctor, api } from '@/services/api';
import { SpecialtyPillCarousel } from '@/components/discovery/SpecialtyPillCarousel';
import { DoctorCard } from '@/components/discovery/DoctorCard';
import {
  Colors,
  Spacing,
  BorderRadius,
  TouchTarget,
  Shadows,
} from '@/constants/theme';

export default function DoctorDiscoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounce search input (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load doctors from live production backend
  const loadDoctors = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await api.getDoctors();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load doctors from live server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // Client-side instant filtering across Name, Specialty, Clinic Name, and City
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // 1. Specialty Filter
      if (selectedSpecialty && selectedSpecialty !== 'All') {
        const matchesSpec = doc.specialty?.toLowerCase().includes(selectedSpecialty.toLowerCase());
        if (!matchesSpec) return false;
      }

      // 2. Debounced Search Query across Name, Specialty, Clinic Name, City
      if (debouncedQuery) {
        const fullName = (doc.user?.fullName || '').toLowerCase();
        const specialty = (doc.specialty || '').toLowerCase();
        const address = (doc.clinicAddress || '').toLowerCase();

        const clinicNames = (doc.clinics || [])
          .map((c) => (c.clinic?.clinicName || '').toLowerCase())
          .join(' ');
        const clinicCities = (doc.clinics || [])
          .map((c) => (c.clinic?.city || '').toLowerCase())
          .join(' ');

        const matches =
          fullName.includes(debouncedQuery) ||
          specialty.includes(debouncedQuery) ||
          clinicNames.includes(debouncedQuery) ||
          clinicCities.includes(debouncedQuery) ||
          address.includes(debouncedQuery);

        if (!matches) return false;
      }

      return true;
    });
  }, [doctors, debouncedQuery, selectedSpecialty]);

  const handleDoctorPress = (doctor: Doctor) => {
    router.push({
      pathname: '/doctors/[id]',
      params: { id: doctor.id },
    });
  };

  const handleBookPress = (doctor: Doctor) => {
    router.push({
      pathname: '/book/[id]',
      params: { id: doctor.id },
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedSpecialty('All');
  };

  const hasActiveFilters = searchQuery.length > 0 || selectedSpecialty !== 'All';

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Find Doctors</Text>
          <Text style={styles.headerSubtitle}>
            Book instant queue tokens at verified clinics
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshIconButton}
          onPress={() => loadDoctors(true)}
          disabled={refreshing || loading}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Instant Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.inkMuted48} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctor, specialty, clinic, or city..."
            placeholderTextColor={Colors.inkMuted48}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.inkMuted48} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Specialty Carousel */}
      <SpecialtyPillCarousel
        selectedSpecialty={selectedSpecialty}
        onSelectSpecialty={setSelectedSpecialty}
      />

      {/* Active Filter Bar & Results Count */}
      <View style={styles.metaBar}>
        <Text style={styles.metaCountText}>
          {loading
            ? 'Searching doctors...'
            : `${filteredDoctors.length} ${
                filteredDoctors.length === 1 ? 'doctor' : 'doctors'
              } available`}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={handleResetFilters}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
            <Ionicons name="close" size={14} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading doctors catalog...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={styles.errorTitle}>Failed to Load Doctors</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadDoctors()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={handleDoctorPress}
              onBookPress={handleBookPress}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadDoctors(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search" size={32} color={Colors.inkMuted48} />
              </View>
              <Text style={styles.emptyTitle}>No Doctors Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No doctors matched "${searchQuery}". Try adjusting your specialty or search term.`
                  : 'No doctors are available under this specialty.'}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.emptyResetButton}
                  onPress={handleResetFilters}
                >
                  <Text style={styles.emptyResetText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasParchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted80,
    marginTop: 2,
  },
  refreshIconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  searchBarWrapper: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TouchTarget.minSize,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    gap: 8,
    ...Shadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.ink,
    height: '100%',
    padding: 0,
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  metaCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.inkMuted80,
    marginTop: Spacing.three,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: Spacing.three,
  },
  errorSubtitle: {
    fontSize: 13,
    color: Colors.inkMuted80,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.four,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: Spacing.six,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.ink,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.inkMuted80,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyResetButton: {
    marginTop: Spacing.four,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  emptyResetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
