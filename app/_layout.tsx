import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { AlertProvider } from '@/utils/AlertProvider';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';

export const unstable_settings = {
  anchor: 'index',
};

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AlertProvider>
          <AppThemeProvider>
            <AuthProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(admin)" />
                  <Stack.Screen name="(customer)" />
                  <Stack.Screen name="(owner)" />
                  <Stack.Screen name="(courier)" />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </AuthProvider>
          </AppThemeProvider>
        </AlertProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
