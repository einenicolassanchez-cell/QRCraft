import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type MainTabParamList = {
  ScanTab: undefined;
  CreateTab: undefined;
  HistoryTab: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Settings: undefined;
  Legal: { type: 'privacy' | 'terms' };
  Pro: undefined;
};

export type AppTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type AppStackNavigation = NativeStackNavigationProp<RootStackParamList>;
