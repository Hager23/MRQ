import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#f59e0b',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#0f172a' },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
