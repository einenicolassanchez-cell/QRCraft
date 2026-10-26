import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';

import { Logo } from '../components/Logo';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, Divider, Section } from '../components/Layout';
import { useToast } from '../components/ToastProvider';
import type { AppStackNavigation } from '../navigation/types';
import { tapFeedback } from '../services/feedback';
import { useStore } from '../store/StoreProvider';
import { colors, radius, spacing } from '../theme';

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
  danger = false,
  iconColor = colors.primaryBright,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
  iconColor?: string;
}) {
  const content = (
    <>
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: danger
              ? colors.dangerSoft
              : 'rgba(56,189,248,0.1)',
          },
        ]}
      >
        <Feather
          name={icon}
          size={17}
          color={danger ? colors.danger : iconColor}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ?? (
        onPress ? (
          <Feather name="chevron-right" size={17} color={colors.textFaint} />
        ) : null
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.68 : 1 },
      ]}
    >
      {content}
    </Pressable>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  iconColor,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  iconColor?: string;
}) {
  return (
    <SettingRow
      icon={icon}
      title={title}
      subtitle={subtitle}
      iconColor={iconColor}
      trailing={
        <Switch
          value={value}
          onValueChange={(next) => {
            void tapFeedback(true);
            onValueChange(next);
          }}
          trackColor={{ false: colors.border, true: 'rgba(16,185,129,0.5)' }}
          thumbColor={value ? colors.accent : colors.textMuted}
        />
      }
    />
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<AppStackNavigation>();
  const { clearHistory, history, settings, updateSettings } = useStore();
  const { showToast } = useToast();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const clearAll = () => {
    if (history.length === 0) {
      showToast('El historial ya está vacío', 'info');
      return;
    }
    Alert.alert(
      'Borrar todo el historial',
      `Se eliminarán ${history.length} elementos guardados en este dispositivo. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            showToast('Todo el historial fue borrado', 'info');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Ajustes"
        subtitle="Personaliza tu experiencia en QRCraft"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Escaneo">
          <Card padded={false} style={styles.card}>
            <ToggleRow
              icon="volume-2"
              title="Sonido al escanear"
              subtitle="Reproduce un bip corto al detectar un QR."
              value={settings.sound}
              onValueChange={(value) => updateSettings({ sound: value })}
            />
            <Divider />
            <ToggleRow
              icon="smartphone"
              title="Vibración"
              subtitle="Confirma con un toque háptico cada escaneo."
              value={settings.vibration}
              onValueChange={(value) => updateSettings({ vibration: value })}
            />
            <Divider />
            <ToggleRow
              icon="external-link"
              title="Abrir URLs automáticamente"
              subtitle="Recomendado desactivado: revisa siempre el destino."
              value={settings.autoOpenUrls}
              onValueChange={(value) => updateSettings({ autoOpenUrls: value })}
              iconColor={colors.warning}
            />
          </Card>
        </Section>

        <Section title="Privacidad y datos">
          <Card padded={false} style={styles.card}>
            <SettingRow
              icon="shield"
              title="Política de Privacidad"
              subtitle="Cómo tratamos tus datos y permisos."
              onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
              iconColor={colors.accent}
            />
            <Divider />
            <SettingRow
              icon="file-text"
              title="Términos de Uso"
              subtitle="Condiciones para usar QRCraft."
              onPress={() => navigation.navigate('Legal', { type: 'terms' })}
              iconColor={colors.primaryBright}
            />
            <Divider />
            <SettingRow
              icon="trash-2"
              title="Borrar historial"
              subtitle={`${history.length} ${history.length === 1 ? 'elemento guardado' : 'elementos guardados'} en este dispositivo.`}
              onPress={clearAll}
              danger
            />
          </Card>
        </Section>

        <Section title="Soporte">
          <Card padded={false} style={styles.card}>
            <SettingRow
              icon="info"
              title="Versión de la app"
              subtitle={`QRCraft ${version} · Hecho para escanear mejor`}
              iconColor={colors.textMuted}
            />
          </Card>
        </Section>

        <View style={styles.about}>
          <Logo size={44} />
          <Text style={styles.aboutTitle}>QRCraft</Text>
          <Text style={styles.aboutText}>
            Escanea, crea y comparte códigos QR con un diseño cuidado. Todo se
            procesa en tu dispositivo.
          </Text>
          <Text style={styles.aboutSmall}>
            © 2026 QRCraft · Los anuncios de la versión gratuita son provistos
            por Google AdMob.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    minHeight: 64,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  rowTitleDanger: {
    color: '#FCA5A5',
  },
  rowSubtitle: {
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.textFaint,
  },
  about: {
    alignItems: 'center',
    gap: 7,
    paddingTop: 4,
    paddingHorizontal: 12,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  aboutText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  aboutSmall: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 4,
  },
});
