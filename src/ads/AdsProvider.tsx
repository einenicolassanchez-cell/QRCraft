import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useStore } from '../store/StoreProvider';
import { colors, gradients, radius, spacing } from '../theme';
import { getAdUnitId, getAdsSdk, type AdsSdk } from './sdk';

interface AdsValue {
  showInterstitial: () => Promise<void>;
  showRewarded: () => Promise<boolean>;
}

const AdsContext = createContext<AdsValue | null>(null);

type MockState =
  | { kind: 'interstitial'; seconds: number }
  | { kind: 'rewarded'; seconds: number }
  | null;

function showNativeInterstitial(sdk: AdsSdk): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanups: Array<() => void> = [];
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      cleanups.forEach((cleanup) => cleanup());
      resolve();
    };
    timeout = setTimeout(finish, 15000);

    try {
      const ad = sdk.InterstitialAd.createForAdRequest(
        getAdUnitId('interstitial'),
        { requestNonPersonalizedAdsOnly: true },
      );
      cleanups.push(
        ad.addAdEventListener(sdk.AdEventType.LOADED, () => {
          try {
            ad.show();
          } catch {
            finish();
          }
        }),
        ad.addAdEventListener(sdk.AdEventType.CLOSED, finish),
        ad.addAdEventListener(sdk.AdEventType.ERROR, finish),
      );
      ad.load();
    } catch {
      finish();
    }
  });
}

function showNativeRewarded(sdk: AdsSdk): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    let earned = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanups: Array<() => void> = [];
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      cleanups.forEach((cleanup) => cleanup());
      resolve(value);
    };
    timeout = setTimeout(() => finish(false), 15000);

    try {
      const ad = sdk.RewardedAd.createForAdRequest(getAdUnitId('rewarded'), {
        requestNonPersonalizedAdsOnly: true,
      });
      cleanups.push(
        ad.addAdEventListener(sdk.RewardedAdEventType.LOADED, () => {
          try {
            ad.show();
          } catch {
            finish(false);
          }
        }),
        ad.addAdEventListener(sdk.RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        }),
        ad.addAdEventListener(sdk.AdEventType.CLOSED, () => finish(earned)),
        ad.addAdEventListener(sdk.AdEventType.ERROR, () => finish(false)),
      );
      ad.load();
    } catch {
      finish(false);
    }
  });
}

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useStore();
  const [mock, setMock] = useState<MockState>(null);
  const [loadingNative, setLoadingNative] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const sdk = useMemo(() => getAdsSdk(), []);

  useEffect(() => {
    if (!sdk) return;
    sdk
      .default()
      .initialize()
      .catch(() => {
        // Ads are never allowed to break the app.
      });
  }, [sdk]);

  useEffect(() => {
    if (!mock || mock.seconds <= 0) return;
    const timer = setTimeout(() => {
      setMock((current) =>
        current ? { ...current, seconds: Math.max(0, current.seconds - 1) } : current,
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [mock]);

  const finishMock = useCallback((value: boolean) => {
    setMock(null);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(value);
  }, []);

  const runMock = useCallback(
    (kind: 'interstitial' | 'rewarded') =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setMock({ kind, seconds: kind === 'rewarded' ? 5 : 3 });
      }),
    [],
  );

  const showInterstitial = useCallback(async () => {
    if (settings.pro) return;
    if (!sdk) {
      await runMock('interstitial');
      return;
    }
    setLoadingNative(true);
    try {
      await showNativeInterstitial(sdk);
    } finally {
      setLoadingNative(false);
    }
  }, [runMock, sdk, settings.pro]);

  const showRewarded = useCallback(async () => {
    if (settings.pro) return true;
    if (!sdk) {
      return runMock('rewarded');
    }
    setLoadingNative(true);
    try {
      return await showNativeRewarded(sdk);
    } finally {
      setLoadingNative(false);
    }
  }, [runMock, sdk, settings.pro]);

  const value = useMemo(
    () => ({ showInterstitial, showRewarded }),
    [showInterstitial, showRewarded],
  );

  const isRewarded = mock?.kind === 'rewarded';
  const canFinish = mock ? mock.seconds <= 0 : false;

  return (
    <AdsContext.Provider value={value}>
      {children}

      <Modal
        visible={loadingNative}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => undefined}
      >
        <View style={styles.overlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryBright} size="large" />
            <Text style={styles.loadingTitle}>Cargando anuncio…</Text>
            <Text style={styles.loadingText}>
              Estamos preparando un anuncio relevante para ti.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!mock}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (canFinish && !isRewarded) finishMock(true);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.mockCard}>
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mockHeader}
            >
              <View style={styles.sponsorRow}>
                <Feather name="zap" size={13} color={colors.white} />
                <Text style={styles.sponsor}>PATROCINADO · ADMOB</Text>
              </View>
              <Text style={styles.mockTitle}>
                {isRewarded ? 'Anuncio bonificado' : 'Anuncio'}
              </Text>
              <Text style={styles.mockSubtitle}>
                {isRewarded
                  ? 'Mira el anuncio para desbloquear la exportación HD'
                  : 'Tu QR está listo. Este espacio mantiene QRCraft gratis.'}
              </Text>
            </LinearGradient>

            <View style={styles.mockBody}>
              <View style={styles.illustration}>
                <Feather
                  name={isRewarded ? 'award' : 'tv'}
                  size={34}
                  color={colors.primaryBright}
                />
              </View>
              <Text style={styles.mockHint}>
                {canFinish
                  ? isRewarded
                    ? '¡Listo! Reclama tu recompensa.'
                    : 'Ya puedes cerrar este anuncio.'
                  : `Anuncio de prueba · ${mock?.seconds ?? 0}s`}
              </Text>

              {isRewarded ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={!canFinish}
                  onPress={() => finishMock(true)}
                  style={({ pressed }) => [
                    styles.mockAction,
                    !canFinish && styles.mockActionDisabled,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Feather name="unlock" size={16} color={colors.backgroundDeep} />
                  <Text style={styles.mockActionLabel}>
                    {canFinish ? 'Reclamar recompensa' : 'Espera un momento…'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={!canFinish}
                  onPress={() => finishMock(true)}
                  style={({ pressed }) => [
                    styles.mockAction,
                    !canFinish && styles.mockActionDisabled,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.mockActionLabel}>
                    {canFinish ? 'Continuar' : `Espera ${mock?.seconds ?? 0}s`}
                  </Text>
                </Pressable>
              )}

              {isRewarded && canFinish ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => finishMock(false)}
                  hitSlop={8}
                  style={styles.skip}
                >
                  <Text style={styles.skipText}>Ahora no</Text>
                </Pressable>
              ) : null}

              <Text style={styles.disclaimer}>
                Anuncio simulado en Expo Go. Con el SDK nativo se muestra un
                anuncio real de AdMob.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </AdsContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdsContext);
  if (!context) throw new Error('useAds must be used inside AdsProvider');
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 32,
    paddingHorizontal: 30,
    width: '100%',
    maxWidth: 330,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  loadingText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
  mockCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  mockHeader: {
    padding: spacing.xl,
    gap: 7,
  },
  sponsorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sponsor: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.86)',
  },
  mockTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.white,
  },
  mockSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
  },
  mockBody: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  illustration: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockHint: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  mockAction: {
    width: '100%',
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mockActionDisabled: {
    backgroundColor: colors.surfaceRaised,
  },
  mockActionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.backgroundDeep,
  },
  skip: {
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textFaint,
  },
  disclaimer: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
