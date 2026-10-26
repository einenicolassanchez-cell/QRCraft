import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, radius, spacing } from '../theme';

export function Section({
  title,
  caption,
  action,
  children,
  style,
}: {
  title?: string;
  caption?: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.section, style]}>
      {title || action ? (
        <View style={styles.headingRow}>
          <View style={styles.headingText}>
            <Text style={styles.heading}>{title}</Text>
            {caption ? <Text style={styles.caption}>{caption}</Text> : null}
          </View>
          {action ? (
            <Pressable
              accessibilityRole="button"
              onPress={action.onPress}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
            >
              <Text style={styles.action}>{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padded?: boolean;
}) {
  return (
    <View style={[styles.card, padded && styles.cardPadded, style]}>
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; icon?: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            {option.icon ? (
              <Feather
                name={option.icon as React.ComponentProps<typeof Feather>['name']}
                size={14}
                color={selected ? colors.text : colors.textMuted}
              />
            ) : null}
            <Text
              style={[
                styles.segmentLabel,
                selected && styles.segmentLabelSelected,
              ]}
            >
              {option.label}
            </Text>
            {typeof option.count === 'number' ? (
              <View
                style={[
                  styles.count,
                  selected ? styles.countSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    selected ? styles.countTextSelected : null,
                  ]}
                >
                  {option.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headingText: {
    gap: 3,
    flex: 1,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  action: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryBright,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
  },
  cardPadded: {
    padding: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSoft,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundDeep,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentSelected: {
    backgroundColor: colors.surfaceRaised,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentLabelSelected: {
    color: colors.text,
    fontWeight: '700',
  },
  count: {
    backgroundColor: 'rgba(148,163,184,0.16)',
    borderRadius: radius.full,
    minWidth: 20,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countSelected: {
    backgroundColor: 'rgba(56,189,248,0.2)',
  },
  countText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  countTextSelected: {
    color: colors.primaryBright,
  },
});
