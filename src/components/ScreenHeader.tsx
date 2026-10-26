import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';
import { Logo } from './Logo';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onSettings?: () => void;
  onBack?: () => void;
  right?: React.ReactNode;
  brand?: boolean;
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  onSettings,
  onBack,
  right,
  brand = false,
  style,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }, style]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={onBack}
              hitSlop={10}
              style={({ pressed }) => [
                styles.back,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="arrow-left" size={21} color={colors.text} />
            </Pressable>
          ) : brand ? (
            <Logo size={38} />
          ) : null}
          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.right}>
          {right}
          {onSettings ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajustes"
              onPress={onSettings}
              hitSlop={10}
              style={({ pressed }) => [
                styles.settings,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="settings" size={19} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.text,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  settings: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
