import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5ea',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingBottom: Platform.OS === 'ios' ? 26 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
      }}
    >
      {/* 1. Explore Tab: Doctor Search & Booking */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={22}
              color={String(color)}
            />
          ),
        }}
      />

      {/* 2. My Passes Tab: Live Queue Pass & Ticket */}
      <Tabs.Screen
        name="passes"
        options={{
          title: 'My Passes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={22}
              color={String(color)}
            />
          ),
        }}
      />

      {/* 3. Doctor OPD Queue Tab */}
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Doctor OPD',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'medkit' : 'medkit-outline'}
              size={22}
              color={String(color)}
            />
          ),
        }}
      />

      {/* 4. Receptionist Front Desk Tab */}
      <Tabs.Screen
        name="desk"
        options={{
          title: 'Front Desk',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              size={22}
              color={String(color)}
            />
          ),
        }}
      />

      {/* 5. Patient Profile & Legal Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={String(color)}
            />
          ),
        }}
      />

      {/* Hidden Auxiliary Screens */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="diagnostics" options={{ href: null }} />
      <Tabs.Screen name="approvals" options={{ href: null }} />
      <Tabs.Screen name="walkin" options={{ href: null }} />
      <Tabs.Screen name="standee" options={{ href: null }} />
      <Tabs.Screen name="book/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="doctors/[id]" options={{ href: null }} />
      <Tabs.Screen name="doctors/index" options={{ href: null }} />
      <Tabs.Screen name="doctor/queue" options={{ href: null }} />
      <Tabs.Screen name="doctor/schedule" options={{ href: null }} />
      <Tabs.Screen name="doctor/profile" options={{ href: null }} />
      <Tabs.Screen name="doctor/consultation/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="(admin)" options={{ href: null }} />
      <Tabs.Screen name="(clinic)" options={{ href: null }} />
      <Tabs.Screen name="(doctor)" options={{ href: null }} />
      <Tabs.Screen name="(patient)" options={{ href: null }} />
      <Tabs.Screen name="(receptionist)" options={{ href: null }} />
      <Tabs.Screen name="(auth)" options={{ href: null }} />
      <Tabs.Screen name="legal" options={{ href: null }} />
      <Tabs.Screen name="(tabs)" options={{ href: null }} />
    </Tabs>
  );
}
