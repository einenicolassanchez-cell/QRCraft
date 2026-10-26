import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { Logo } from './Logo';

interface BrandProps {
  size?: number;
  compact?: boolean;
  subtitle?: string;
}

export function Brand({ size = 34, compact = false, subtitle }: BrandProps) {
  return (
    <View style={styles.row}>
      <Logo size={size} />
      {!compact ? (
        <View style={styles.textWrap}>
          <Text style={styles.wordmark}>
            QR<Text style={styles.wordmarkAccent}>Craft</Text>
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textWrap: {
    gap: 1,
  },
  wordmark: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  wordmarkAccent: {
    color: colors.primaryBright,
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: colors.textFaint,
    textTransform: 'uppercase',
  },
});
