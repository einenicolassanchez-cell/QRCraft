import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { AdKind } from '../types';

export type AdsSdk = typeof import('react-native-google-mobile-ads');

const TEST_UNIT_IDS: Record<AdKind, { android: string; ios: string }> = {
  banner: {
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
  },
  interstitial: {
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
  },
  rewarded: {
    android: 'ca-app-pub-3940256099942544/5224354917',
    ios: 'ca-app-pub-3940256099942544/1712485313',
  },
};

let cachedSdk: AdsSdk | null | undefined;

/**
 * Loads the native AdMob SDK only in development/production builds.
 * Expo Go does not contain the native module, so the app gracefully falls back
 * to a simulated ad unit instead of crashing.
 */
export function getAdsSdk(): AdsSdk | null {
  if (cachedSdk !== undefined) return cachedSdk;

  if (Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient') {
    cachedSdk = null;
    return cachedSdk;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedSdk = require('react-native-google-mobile-ads') as AdsSdk;
  } catch {
    cachedSdk = null;
  }
  return cachedSdk;
}

interface AdMobExtra {
  banner?: string;
  interstitial?: string;
  rewarded?: string;
}

export function getAdUnitId(kind: AdKind): string {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const extra = Constants.expoConfig?.extra as
    | { admob?: Record<string, AdMobExtra | undefined> }
    | undefined;
  const configured = extra?.admob?.[platform]?.[kind];
  return configured || TEST_UNIT_IDS[kind][platform];
}

export function canUseNativeAds() {
  return getAdsSdk() !== null;
}
