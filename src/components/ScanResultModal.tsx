import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from './ToastProvider';
import { Button, IconButton } from './Buttons';
import { useStore } from '../store/StoreProvider';
import { colors, radius, spacing } from '../theme';
import type { ParsedCode } from '../types';
import { SCAN_CATEGORY_META } from '../utils/qr';
import { formatDateTime } from '../utils/date';
import { shareText } from '../services/qrExport';

interface ScanResultModalProps {
  visible: boolean;
  parsed: ParsedCode | null;
  createdAt?: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function ScanResultModal({
  visible,
  parsed,
  createdAt,
  onClose,
  onDelete,
}: ScanResultModalProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { settings } = useStore();
  const [revealPassword, setRevealPassword] = useState(false);

  useEffect(() => {
    if (!visible) setRevealPassword(false);
  }, [visible]);

  if (!parsed) return null;
  const meta = SCAN_CATEGORY_META[parsed.category];
  const wifiPassword = parsed.metadata.password ?? '';
  const isWifi = parsed.category === 'wifi';
  const isText = parsed.category === 'text';
  const canCopy = Boolean(parsed.raw);

  const copy = async (value: string, message = 'Copiado al portapapeles') => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    showToast(message);
  };

  const share = async () => {
    try {
      await shareText(parsed.raw, parsed.title);
    } catch {
      showToast('No se pudo compartir el contenido.', 'error');
    }
  };

  const connectWifi = async () => {
    if (wifiPassword) {
      await Clipboard.setStringAsync(wifiPassword);
    }
    if (Platform.OS === 'android') {
      try {
        await Linking.sendIntent('android.settings.WIFI_SETTINGS');
        showToast('Clave copiada. Elige la red para conectarte.');
        return;
      } catch {
        // Fall through to the guidance alert.
      }
    }
    Alert.alert(
      'Conectar a la red Wi-Fi',
      `La contraseña de "${parsed.metadata.ssid ?? 'la red'}" ya está copiada. Por seguridad, ${Platform.OS === 'ios' ? 'iOS' : 'Android'} requiere que confirmes la conexión desde Ajustes > Wi-Fi.`,
      [{ text: 'Entendido' }],
    );
  };

  const handlePrimary = async () => {
    switch (parsed.actionKind) {
      case 'url':
      case 'whatsapp': {
        const url = parsed.metadata.url;
        if (!url) return;
        try {
          await Linking.openURL(url);
        } catch {
          showToast('No se pudo abrir el enlace.', 'error');
        }
        return;
      }
      case 'email': {
        const email = parsed.metadata.email ?? '';
        try {
          await Linking.openURL(`mailto:${email}`);
        } catch {
          await copy(email, 'Correo copiado');
        }
        return;
      }
      case 'phone': {
        const phone = parsed.metadata.phone ?? '';
        try {
          await Linking.openURL(`tel:${phone}`);
        } catch {
          await copy(phone, 'Teléfono copiado');
        }
        return;
      }
      case 'sms': {
        const phone = parsed.metadata.phone ?? '';
        const message = parsed.metadata.message ?? '';
        const body = encodeURIComponent(message);
        const url = Platform.OS === 'ios'
          ? `sms:${phone}${message ? `&body=${body}` : ''}`
          : `sms:${phone}${message ? `?body=${body}` : ''}`;
        try {
          await Linking.openURL(url);
        } catch {
          showToast('No se pudo abrir la app de mensajes.', 'error');
        }
        return;
      }
      case 'geo': {
        const coordinates = parsed.metadata.coordinates ?? '';
        try {
          await Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`,
          );
        } catch {
          showToast('No se pudo abrir el mapa.', 'error');
        }
        return;
      }
      case 'wifi':
        await connectWifi();
        return;
      case 'contact':
        await share();
        return;
      default:
        await copy(parsed.raw);
    }
  };

  const primaryIcon: React.ComponentProps<typeof Feather>['name'] =
    parsed.actionKind === 'wifi'
      ? 'wifi'
      : parsed.actionKind === 'contact'
        ? 'share-2'
        : parsed.actionKind === 'text'
          ? 'copy'
          : 'external-link';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar resultado"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={[styles.typeIcon, { backgroundColor: `${meta.color}22` }]}>
              <Feather
                name={meta.icon as React.ComponentProps<typeof Feather>['name']}
                size={22}
                color={meta.color}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.typeLabel}>{meta.label.toUpperCase()}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {parsed.title}
              </Text>
            </View>
            <IconButton
              icon="x"
              label="Cerrar"
              onPress={onClose}
              size={36}
              variant="plain"
            />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailCard}>
              {parsed.fields.map((field, index) => {
                const isPassword = isWifi && field.label === 'Contraseña';
                const value =
                  isPassword && !revealPassword
                    ? '•'.repeat(Math.max(6, field.value.length))
                    : field.value;
                return (
                  <View
                    key={`${field.label}-${index}`}
                    style={[
                      styles.detailRow,
                      index > 0 && styles.detailRowBorder,
                    ]}
                  >
                    <Text style={styles.detailLabel}>{field.label}</Text>
                    <View style={styles.detailValueRow}>
                      <Text
                        style={styles.detailValue}
                        selectable={!isPassword}
                        numberOfLines={isPassword ? 1 : 4}
                      >
                        {value}
                      </Text>
                      {isPassword ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            revealPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                          }
                          onPress={() => setRevealPassword((current) => !current)}
                          hitSlop={8}
                        >
                          <Feather
                            name={revealPassword ? 'eye-off' : 'eye'}
                            size={15}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>

            {createdAt ? (
              <View style={styles.metaRow}>
                <Feather name="clock" size={12} color={colors.textFaint} />
                <Text style={styles.metaText}>{formatDateTime(createdAt)}</Text>
              </View>
            ) : null}

            {isWifi ? (
              <View style={styles.note}>
                <Feather name="info" size={14} color={colors.primaryBright} />
                <Text style={styles.noteText}>
                  {Platform.OS === 'android'
                    ? 'Android 10+ pide confirmar la conexión. Copiamos la clave por ti para que solo elijas la red.'
                    : 'iOS no permite conexiones automáticas desde apps. Copia la clave y elige la red en Ajustes > Wi-Fi.'}
                </Text>
              </View>
            ) : null}

            {parsed.category === 'url' || parsed.category === 'whatsapp' ? (
              <View style={styles.note}>
                <Feather name="shield" size={14} color={colors.accent} />
                <Text style={styles.noteText}>
                  Revisa siempre el destino antes de abrir enlaces escaneados.
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              label={
                isWifi
                  ? 'Conectar a la red'
                  : parsed.actionKind === 'contact'
                    ? 'Compartir contacto'
                    : parsed.actionKind === 'text'
                      ? 'Copiar texto'
                      : parsed.actionLabel
              }
              icon={primaryIcon}
              onPress={handlePrimary}
              variant={isWifi ? 'success' : 'primary'}
              size="lg"
            />
            <View style={styles.secondaryRow}>
              {!isText ? (
                <Button
                  label="Copiar"
                  icon="copy"
                  variant="secondary"
                  onPress={() => copy(parsed.raw)}
                  style={styles.flex}
                  disabled={!canCopy}
                />
              ) : null}
              <Button
                label="Compartir"
                icon="share-2"
                variant="secondary"
                onPress={share}
                style={styles.flex}
                disabled={!canCopy}
              />
              {onDelete ? (
                <Button
                  label="Borrar"
                  icon="trash-2"
                  variant="danger"
                  onPress={() => {
                    Alert.alert(
                      'Eliminar del historial',
                      'Este elemento se borrará de tu historial local.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: onDelete,
                        },
                      ],
                    );
                  }}
                  style={styles.deleteButton}
                />
              ) : null}
            </View>
            {settings.autoOpenUrls &&
            (parsed.category === 'url' || parsed.category === 'whatsapp') ? (
              <Text style={styles.autoOpenHint}>
                Apertura automática de enlaces activada
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingTop: 8,
    maxHeight: '90%',
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  typeLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.textFaint,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: 12,
    paddingBottom: 4,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  detailRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    gap: 4,
  },
  detailRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textFaint,
    textTransform: 'uppercase',
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailValue: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 11.5,
    color: colors.textFaint,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    padding: 11,
  },
  noteText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textMuted,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: 9,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  deleteButton: {
    paddingHorizontal: 14,
  },
  autoOpenHint: {
    textAlign: 'center',
    fontSize: 10.5,
    color: colors.textFaint,
  },
});
