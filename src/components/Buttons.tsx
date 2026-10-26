import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, radius, shadow, spacing } from '../theme';

type IconName = React.ComponentProps<typeof Feather>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean;
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  compact = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const palette = {
    primary: {
      background: colors.primary,
      border: 'transparent',
      text: colors.white,
      icon: colors.white,
    },
    success: {
      background: colors.accent,
      border: 'transparent',
      text: '#022C22',
      icon: '#022C22',
    },
    secondary: {
      background: colors.surface,
      border: colors.border,
      text: colors.text,
      icon: colors.primaryBright,
    },
    ghost: {
      background: 'transparent',
      border: colors.borderSoft,
      text: colors.text,
      icon: colors.textMuted,
    },
    danger: {
      background: colors.dangerSoft,
      border: 'rgba(239,68,68,0.4)',
      text: '#FCA5A5',
      icon: '#FCA5A5',
    },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        size === 'lg' && styles.buttonLarge,
        compact && styles.buttonCompact,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: isDisabled ? 0.46 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
        },
        variant === 'primary' || variant === 'success' ? shadow.card : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : icon ? (
        <Feather name={icon} size={size === 'lg' ? 19 : 17} color={palette.icon} />
      ) : null}
      <Text
        style={[
          styles.label,
          size === 'lg' && styles.labelLarge,
          { color: palette.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  active?: boolean;
  variant?: 'surface' | 'glass' | 'plain' | 'accent';
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 44,
  active = false,
  variant = 'surface',
  disabled = false,
}: IconButtonProps) {
  const background = active
    ? 'rgba(16,185,129,0.22)'
    : variant === 'glass'
      ? 'rgba(15,23,42,0.62)'
      : variant === 'accent'
        ? colors.accent
        : variant === 'plain'
          ? 'transparent'
          : colors.surface;
  const border = active
    ? 'rgba(16,185,129,0.6)'
    : variant === 'glass'
      ? 'rgba(248,250,252,0.18)'
      : variant === 'plain'
        ? 'transparent'
        : colors.border;
  const iconColor =
    variant === 'accent'
      ? '#022C22'
      : active
        ? colors.accent
        : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          borderColor: border,
          opacity: disabled ? 0.4 : pressed ? 0.72 : 1,
        },
      ]}
    >
      <Feather name={icon} size={Math.round(size * 0.43)} color={iconColor} />
    </Pressable>
  );
}

export function TextLink({
  label,
  onPress,
  color = colors.primaryBright,
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
    >
      <Text style={[styles.link, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? 'rgba(2,132,199,0.18)' : colors.surfaceSoft,
          borderColor: selected ? colors.primaryBright : colors.borderSoft,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {icon ? (
        <Feather
          name={icon}
          size={13}
          color={selected ? colors.primaryBright : colors.textMuted}
        />
      ) : null}
      <Text
        style={[
          styles.chipLabel,
          { color: selected ? colors.primaryBright : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonLarge: {
    minHeight: 56,
    borderRadius: radius.lg,
  },
  buttonCompact: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  label: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  labelLarge: {
    fontSize: 15.5,
  },
  iconButton: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
