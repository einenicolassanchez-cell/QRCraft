import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { getAdUnitId, getAdsSdk } from '../ads/sdk';
import { colors, radius, spacing } from '../theme';

export function AdBanner() {
  const [failed, setFailed] = useState(false);
  const sdk = useMemo(() => getAdsSdk(), []);

  if (!sdk || failed) {
    return (
      <View style={styles.placeholder}>
        <View style={styles.adLabel}>
          <Text style={styles.adLabelText}>PUBLICIDAD</Text>
        </View>
        <View style={styles.placeholderBody}>
          <Feather name="info" size={14} color={colors.primaryBright} />
          <Text style={styles.placeholderText}>
            Los anuncios se muestran en la versión instalada.
          </Text>
        </View>
      </View>
    );
  }

  const { BannerAd, BannerAdSize } = sdk;

  return (
    <View style={styles.bannerWrap}>
      <View style={styles.adLabel}>
        <Text style={styles.adLabelText}>PUBLICIDAD</Text>
      </View>
      <BannerAd
        unitId={getAdUnitId('banner')}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    minHeight: 52,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceSoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    gap: 3,
  },
  bannerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    minHeight: 56,
    gap: 2,
  },
  adLabel: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(148,163,184,0.14)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  adLabelText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textFaint,
  },
  placeholderBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  placeholderText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
    flex: 1,
    textAlign: 'center',
  },
});
