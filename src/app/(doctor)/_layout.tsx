import { Stack } from 'expo-router';

export default function DoctorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="queue" options={{ title: 'Doctor OPD Queue' }} />
      <Stack.Screen name="consultation/[id]" options={{ title: 'Consultation Room' }} />
      <Stack.Screen name="schedule" options={{ title: 'Doctor Schedule & Leaves' }} />
      <Stack.Screen name="profile" options={{ title: 'Doctor Profile' }} />
    </Stack>
  );
}
