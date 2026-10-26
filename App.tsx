import React from 'react';
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AdsProvider } from './src/ads/AdsProvider';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ToastProvider } from './src/components/ToastProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StoreProvider } from './src/store/StoreProvider';
import { colors } from './src/theme';

const navigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary>
        <StoreProvider>
          <ToastProvider>
            <AdsProvider>
              <NavigationContainer theme={navigationTheme}>
                <RootNavigator />
              </NavigationContainer>
            </AdsProvider>
          </ToastProvider>
        </StoreProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
