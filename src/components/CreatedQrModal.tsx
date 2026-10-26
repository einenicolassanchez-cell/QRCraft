import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from './Buttons';
import { QRArt, type QRArtHandle } from './QRArt';
import { useToast } from './ToastProvider';
import { savePngToGallery, sharePng, qrFilename } from '../services/qrExport';
import { colors, radius, spacing } from '../theme';
import type { HistoryEntry } from '../types';
import { formatFullDate } from '../utils/date';
import { SCAN_CATEGORY_META } from '../utils/qr';

interface CreatedQrModalProps {
  entry: HistoryEntry | null;
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function CreatedQrModal({
  entry,
  visible,
  onClose,
  onDelete,
}: CreatedQrModalProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { showToast } = useToast();
  const qrRef = useRef<QRArtHandle>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!entry) return null;
  const meta = SCAN_CATEGORY_META[entry.category];
  const qrSize = Math.min(width - 144, 238);
  const color = entry.color ?? '#000000';
  const backgroundColor = entry.backgroundColor ?? '#FFFFFF';
  const shape = entry.moduleShape ?? 'square';

  const copy = async () => {
    await Clipboard.setStringAsync(entry.raw);
    showToast('Contenido copiado');
  };

  const getBase64 = async () => {
    if (!qrRef.current) throw new Error('El QR aún no está listo.');
    return qrRef.current.toBase64({ width: 1024, height: 1024 });
  };

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const base64 = await getBase64();
      await sharePng(base64, qrFilename('png'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo compartir el QR.';
      if (!message.toLowerCase().includes('cancel')) {
        showToast(message, 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const base64 = await getBase64();
      await savePngToGallery(base64, qrFilename('png'));
      showToast('QR guardado en tu galería');
    } catch (error) {
      Alert.alert(
        'No se pudo guardar',
        error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

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
          accessibilityLabel="Cerrar"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View style={[styles.typeIcon, { backgroundColor: `${meta.color}22` }]}>
              <Feather
                name={meta.icon as React.ComponentProps<typeof Feather>['name']}
                size={20}
                color={meta.color}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.typeLabel}>QR CREADO</Text>
              <Text style={styles.title} numberOfLines={1}>
                {entry.title}
              </Text>
            </View>
            <IconButton
              icon="trash-2"
              label="Eliminar QR"
              size={36}
              variant="plain"
              onPress={() => {
                Alert.alert(
                  'Eliminar del historial',
                  'Este QR se borrará de tu historial local.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: onDelete },
                  ],
                );
              }}
            />
            <IconButton
              icon="x"
              label="Cerrar"
              size={36}
              variant="plain"
              onPress={onClose}
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.qrCard}>
              <QRArt
                ref={qrRef}
                value={entry.raw}
                color={color}
                backgroundColor={backgroundColor}
                shape={shape}
                size={qrSize}
              />
            </View>
            <View style={styles.metaRow}>
              <Feather name="calendar" size={12} color={colors.textFaint} />
              <Text style={styles.metaText}>{formatFullDate(entry.createdAt)}</Text>
            </View>

            <View style={styles.payloadCard}>
              <Text style={styles.payloadLabel}>CONTENIDO</Text>
              <Text style={styles.payload} selectable numberOfLines={8}>
                {entry.raw}
              </Text>
            </View>

            <Text style={styles.hint}>
              Este QR se guarda solo en tu historial local. Puedes volver a
              descargarlo o compartirlo cuando quieras.
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              label="Compartir QR"
              icon="share-2"
              onPress={() => {
                void share();
              }}
              loading={sharing}
              disabled={saving || sharing}
              size="lg"
            />
            <View style={styles.secondaryRow}>
              <Button
                label="Copiar"
                icon="copy"
                variant="secondary"
                onPress={() => {
                  void copy();
                }}
                style={styles.flex}
              />
              <Button
                label="Guardar"
                icon="download"
                variant="secondary"
                onPress={() => {
                  void save();
                }}
                loading={saving}
                disabled={saving || sharing}
                style={styles.flex}
              />
            </View>
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
    maxHeight: '92%',
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
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.textFaint,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: 12,
    paddingBottom: 4,
  },
  qrCard: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.textFaint,
  },
  payloadCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    padding: 13,
    gap: 5,
  },
  payloadLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textFaint,
  },
  payload: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  hint: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: 10,
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
});
