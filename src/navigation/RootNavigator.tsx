import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TabBar } from './TabBar';
import { HistoryScreen } from '../screens/HistoryScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { ProScreen } from '../screens/ProScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { MainTabParamList, RootStackParamList } from './types';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
    >
      <Tab.Screen name="ScanTab" component={ScanScreen} />
      <Tab.Screen name="CreateTab" component={CreateScreen} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen
        name="Pro"
        component={ProScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
