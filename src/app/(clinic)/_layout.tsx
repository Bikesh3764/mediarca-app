import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ClinicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.canvasParchment },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Clinic Management Portal' }} />
      <Stack.Screen name="standee" options={{ title: 'Clinic QR Standee' }} />
    </Stack>
  );
}
