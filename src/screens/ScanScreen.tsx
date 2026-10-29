import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  CameraView,
  scanFromURLAsync,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';

import { Brand } from '../components/Brand';
import { Button, IconButton } from '../components/Buttons';
import { Logo } from '../components/Logo';
import { ScanResultModal } from '../components/ScanResultModal';
import { useToast } from '../components/ToastProvider';
import type { AppTabNavigation } from '../navigation/types';
import { successFeedback, errorFeedback } from '../services/feedback';
import { useStore } from '../store/StoreProvider';
import { colors, gradients, radius, spacing } from '../theme';
import type { ParsedCode, ScanSource } from '../types';
import { createHistoryTitle, parseScannedCode } from '../utils/qr';
import { analyzeUrlSafety } from '../utils/urlSafety';

export function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<AppTabNavigation>();
  const isFocused = useIsFocused();
  const { settings, addEntry } = useStore();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scanningImage, setScanningImage] = useState(false);
  const [result, setResult] = useState<ParsedCode | null>(null);
  const [resultCreatedAt, setResultCreatedAt] = useState<string | undefined>();
  const [cameraReady, setCameraReady] = useState(false);
  const lockedRef = useRef(false);
  const lastScanRef = useRef<{ raw: string; at: number } | null>(null);
  const laser = useRef(new Animated.Value(0)).current;
  const beep = useAudioPlayer(require('../../assets/beep.wav'));

  const frameSize = Math.min(width * 0.7, 288);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {
      // Silent mode configuration is best-effort.
    });
  }, []);

  useEffect(() => {
    if (isFocused) return;
    setTorch(false);
    setPaused(false);
    setResult(null);
    lockedRef.current = false;
  }, [isFocused]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(laser, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(laser, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [laser]);

  const playSuccessFeedback = useCallback(() => {
    if (settings.vibration) {
      void successFeedback(true);
    }
    if (settings.sound) {
      beep
        .seekTo(0)
        .then(() => beep.play())
        .catch(() => {
          // Audio feedback is optional.
        });
    }
  }, [beep, settings.sound, settings.vibration]);

  const openUrlIfNeeded = useCallback(
    (parsed: ParsedCode) => {
      if (!settings.autoOpenUrls) return;
      if (parsed.category !== 'url' && parsed.category !== 'whatsapp') return;
      const url = parsed.metadata.url;
      if (!url) return;
      if (analyzeUrlSafety(url).level !== 'clear') {
        showToast(
          'QR Guardián pausó la apertura automática; revisa el aviso antes de continuar.',
          'info',
        );
        return;
      }
      setTimeout(() => {
        Linking.openURL(url).catch(() => {
          showToast('No se pudo abrir el enlace automáticamente.', 'error');
        });
      }, 550);
    },
    [settings.autoOpenUrls, showToast],
  );

  const handleScan = useCallback(
    (raw: string, source: ScanSource) => {
      if (lockedRef.current) return;
      const value = raw.trim();
      if (!value) return;

      const now = Date.now();
      if (
        lastScanRef.current &&
        lastScanRef.current.raw === value &&
        now - lastScanRef.current.at < 1500
      ) {
        return;
      }

      lockedRef.current = true;
      lastScanRef.current = { raw: value, at: now };
      setPaused(true);

      const parsed = parseScannedCode(value);
      const createdAt = new Date().toISOString();
      setResult(parsed);
      setResultCreatedAt(createdAt);
      addEntry({
        kind: 'scanned',
        category: parsed.category,
        title: createHistoryTitle(parsed, source),
        raw: parsed.raw,
        source,
        createdAt,
      });
      playSuccessFeedback();
      openUrlIfNeeded(parsed);
    },
    [addEntry, openUrlIfNeeded, playSuccessFeedback],
  );

  const handleBarcode = useCallback(
    (scan: BarcodeScanningResult) => {
      if (scan.data) handleScan(scan.data, 'camera');
    },
    [handleScan],
  );

  const closeResult = useCallback(() => {
    setResult(null);
    setTimeout(() => {
      lockedRef.current = false;
      setPaused(false);
    }, 350);
  }, []);

  const pickImage = useCallback(async () => {
    if (scanningImage) return;
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Acceso a tus fotos',
        'Necesitamos permiso para elegir una imagen de tu galería. También puedes activarlo en los ajustes del sistema.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: false,
    });
    if (picked.canceled || !picked.assets[0]) return;

    setScanningImage(true);
    try {
      const codes = await scanFromURLAsync(picked.assets[0].uri, ['qr']);
      if (codes[0]?.data) {
        handleScan(codes[0].data, 'gallery');
      } else {
        void errorFeedback(settings.vibration);
        Alert.alert(
          'No encontramos un QR',
          'Prueba con una imagen más nítida, sin recortes y con el código completamente visible.',
        );
      }
    } catch {
      void errorFeedback(settings.vibration);
      Alert.alert(
        'No pudimos leer la imagen',
        'El formato de esta imagen no es compatible o el código QR está dañado.',
      );
    } finally {
      setScanningImage(false);
    }
  }, [handleScan, scanningImage, settings.vibration]);

  const toggleTorch = () => {
    setTorch((current) => !current);
  };

  const flipCamera = () => {
    setTorch(false);
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const openSettings = () => navigation.navigate('Settings');

  if (!permission) {
    return (
      <View style={styles.permissionScreen}>
        <ActivityIndicator color={colors.primaryBright} />
        <Text style={styles.permissionHint}>Preparando la cámara…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Logo size={78} />
        <Text style={styles.permissionTitle}>Activa la cámara</Text>
        <Text style={styles.permissionText}>
          Usamos la cámara solo para leer códigos QR. Nada de lo que enfocas se
          guarda ni se envía.
        </Text>
        <Button
          label="Permitir cámara"
          icon="camera"
          onPress={() => {
            if (permission.canAskAgain) {
              void requestPermission();
            } else {
              void Linking.openSettings();
            }
          }}
          size="lg"
          style={styles.permissionButton}
        />
        <Button
          label="Importar desde galería"
          icon="image"
          variant="secondary"
          onPress={pickImage}
          loading={scanningImage}
          style={styles.permissionButton}
        />
        <Button
          label="Ahora no"
          variant="ghost"
          onPress={openSettings}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  const laserTranslate = laser.interpolate({
    inputRange: [0, 1],
    outputRange: [10, frameSize - 14],
  });

  return (
    <View style={styles.root}>
      {isFocused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onCameraReady={() => setCameraReady(true)}
          onBarcodeScanned={paused ? undefined : handleBarcode}
          onMountError={() => {
            showToast(
              'La cámara no pudo iniciarse. Puedes importar una imagen.',
              'error',
            );
          }}
        />
      ) : null}

      <LinearGradient
        colors={gradients.cameraTop}
        locations={[0, 0.55, 1]}
        style={styles.topGradient}
        pointerEvents="box-none"
      >
        <View style={[styles.topRow, { paddingTop: insets.top + 8 }]}>
          <Brand size={36} subtitle="Escáner inteligente" />
          <IconButton
            icon="settings"
            label="Ajustes"
            onPress={openSettings}
            variant="glass"
          />
        </View>
      </LinearGradient>

      <View style={styles.center} pointerEvents="box-none">
        <View
          style={[
            styles.frame,
            { width: frameSize, height: frameSize },
          ]}
        >
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
          {cameraReady ? (
            <Animated.View
              style={[
                styles.laser,
                { transform: [{ translateY: laserTranslate }] },
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(16,185,129,0)',
                  'rgba(16,185,129,0.9)',
                  'rgba(16,185,129,0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.laserGradient}
              />
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.instructionPill}>
          <View style={styles.liveDot} />
          <Text style={styles.instruction}>
            {paused ? 'Código detectado' : 'Apunta al código QR'}
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={gradients.cameraBottom}
        locations={[0, 0.5, 1]}
        style={styles.bottomGradient}
        pointerEvents="box-none"
      >
        <View style={styles.controls}>
          <ControlButton
            icon={torch ? 'zap' : 'zap-off'}
            label={torch ? 'Linterna on' : 'Linterna'}
            active={torch}
            onPress={toggleTorch}
          />
          <ControlButton
            icon="image"
            label="Galería"
            onPress={pickImage}
            loading={scanningImage}
          />
          <ControlButton
            icon="refresh-cw"
            label="Girar"
            onPress={flipCamera}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir al historial"
          onPress={() => navigation.navigate('HistoryTab')}
          style={({ pressed }) => [
            styles.historyHint,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="clock" size={13} color={colors.textMuted} />
          <Text style={styles.historyHintText}>
            Tus escaneos se guardan automáticamente
          </Text>
          <Feather name="chevron-right" size={13} color={colors.textFaint} />
        </Pressable>
        <Text style={styles.platformHint}>
          {Platform.OS === 'ios'
            ? 'iOS · Escaneo en el dispositivo'
            : 'Android · Escaneo en el dispositivo'}
        </Text>
      </LinearGradient>

      <ScanResultModal
        visible={!!result}
        parsed={result}
        createdAt={resultCreatedAt}
        onClose={closeResult}
      />
    </View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  active = false,
  loading = false,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.control, { opacity: pressed ? 0.72 : 1 }]}
    >
      <View style={[styles.controlCircle, active && styles.controlCircleActive]}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Feather
            name={icon}
            size={21}
            color={active ? colors.accent : colors.text}
          />
        )}
      </View>
      <Text style={[styles.controlLabel, active && styles.controlLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  permissionTitle: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.text,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 330,
    marginBottom: 8,
  },
  permissionHint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  permissionButton: {
    width: '100%',
    maxWidth: 340,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 46,
    paddingHorizontal: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  frame: {
    borderRadius: radius.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: colors.accent,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 24,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 24,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 24,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 24,
  },
  laser: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  laserGradient: {
    flex: 1,
    borderRadius: 1,
  },
  instructionPill: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(2, 6, 23, 0.58)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(248,250,252,0.16)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  instruction: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: colors.text,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 34,
  },
  control: {
    alignItems: 'center',
    gap: 7,
    minWidth: 70,
  },
  controlCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCircleActive: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderColor: colors.accent,
  },
  controlLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  controlLabelActive: {
    color: colors.accent,
  },
  historyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  historyHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  platformHint: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: colors.textFaint,
    textTransform: 'uppercase',
  },
});
