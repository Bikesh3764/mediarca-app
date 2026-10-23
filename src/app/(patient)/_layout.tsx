import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function PatientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.canvasParchment },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile" options={{ title: 'Patient Profile & Settings' }} />
    </Stack>
  );
}
