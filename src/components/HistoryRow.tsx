import React, { useMemo, useRef } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, radius, spacing } from '../theme';
import type { HistoryEntry } from '../types';
import { formatDate, formatTime } from '../utils/date';
import { SCAN_CATEGORY_META } from '../utils/qr';

const ACTION_WIDTH = 92;

interface SwipeableRowProps {
  entry: HistoryEntry;
  onPress: () => void;
  onDelete: () => void;
  onLongPress: () => void;
}

export function HistoryRow({
  entry,
  onPress,
  onDelete,
  onLongPress,
}: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteRef = useRef(onDelete);
  deleteRef.current = onDelete;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
        onPanResponderMove: (_event, gesture) => {
          const next = Math.max(-ACTION_WIDTH - 16, Math.min(0, gesture.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx < -ACTION_WIDTH * 0.6 || gesture.vx < -0.55) {
            Animated.timing(translateX, {
              toValue: -ACTION_WIDTH,
              duration: 140,
              useNativeDriver: true,
            }).start(() => {
              translateX.setValue(0);
              deleteRef.current();
            });
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
              stiffness: 240,
              mass: 0.7,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [translateX],
  );

  const meta = SCAN_CATEGORY_META[entry.category];

  return (
    <View style={styles.swipeWrap}>
      <View style={styles.deleteBackground}>
        <Feather name="trash-2" size={18} color={colors.white} />
        <Text style={styles.deleteText}>Eliminar</Text>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${entry.title}. Desliza a la izquierda para eliminar.`}
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={450}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: pressed ? colors.surfaceRaised : colors.surface },
          ]}
        >
          <View
            style={[styles.iconWrap, { backgroundColor: `${meta.color}1C` }]}
          >
            <Feather
              name={meta.icon as React.ComponentProps<typeof Feather>['name']}
              size={18}
              color={meta.color}
            />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {entry.title}
            </Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {entry.raw
                .replace(/\r?\n/g, ' · ')
                .replace(/\s+/g, ' ')
                .slice(0, 80)}
            </Text>
            <View style={styles.rowMeta}>
              <Text style={styles.rowMetaText}>{formatDate(entry.createdAt)}</Text>
              <View style={styles.metaDot} />
              <Text style={styles.rowMetaText}>{formatTime(entry.createdAt)}</Text>
              {entry.kind === 'created' ? (
                <>
                  <View style={styles.metaDot} />
                  <Text style={styles.createdTag}>Creado</Text>
                </>
              ) : null}
            </View>
          </View>
          <Feather name="chevron-right" size={16} color={colors.textFaint} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function confirmDeleteEntry(entry: HistoryEntry, onDelete: () => void) {
  Alert.alert(
    'Eliminar del historial',
    `"${entry.title}" se borrará de este dispositivo.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ],
  );
}

const styles = StyleSheet.create({
  swipeWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.danger,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
    paddingRight: spacing.xl,
    backgroundColor: colors.danger,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    minHeight: 86,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  rowMetaText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textFaint,
  },
  metaDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.textFaint,
  },
  createdTag: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.accent,
  },
});
