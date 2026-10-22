import { Stack } from 'expo-router';

export default function ReceptionistLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="desk" options={{ title: 'Clinical Desk' }} />
      <Stack.Screen name="approvals" options={{ title: 'Online Approvals Queue' }} />
      <Stack.Screen name="walkin" options={{ title: 'Walk-In Token Dispenser' }} />
    </Stack>
  );
}
