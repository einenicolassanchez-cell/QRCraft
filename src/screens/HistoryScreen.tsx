import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AdBanner } from '../components/AdBanner';
import { Button, IconButton } from '../components/Buttons';
import { CreatedQrModal } from '../components/CreatedQrModal';
import {
  confirmDeleteEntry,
  HistoryRow,
} from '../components/HistoryRow';
import { SegmentedControl } from '../components/Layout';
import { ScanResultModal } from '../components/ScanResultModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { useToast } from '../components/ToastProvider';
import type { AppTabNavigation } from '../navigation/types';
import { successFeedback } from '../services/feedback';
import { useStore } from '../store/StoreProvider';
import { colors, radius, spacing } from '../theme';
import type { HistoryEntry, HistoryKind } from '../types';
import { parseScannedCode } from '../utils/qr';

export function HistoryScreen() {
  const navigation = useNavigation<AppTabNavigation>();
  const { clearHistory, history, removeEntry, settings } = useStore();
  const { showToast } = useToast();
  const [tab, setTab] = useState<HistoryKind>('scanned');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  const scannedCount = history.filter((item) => item.kind === 'scanned').length;
  const createdCount = history.filter((item) => item.kind === 'created').length;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return history
      .filter((item) => item.kind === tab)
      .filter((item) => {
        if (!normalized) return true;
        return (
          item.title.toLowerCase().includes(normalized) ||
          item.raw.toLowerCase().includes(normalized)
        );
      });
  }, [history, query, tab]);

  const currentCount = tab === 'scanned' ? scannedCount : createdCount;

  const handleDelete = (entry: HistoryEntry) => {
    removeEntry(entry.id);
    if (selected?.id === entry.id) setSelected(null);
    void successFeedback(settings.vibration);
    showToast('Elemento eliminado del historial', 'info');
  };

  const clearCurrentTab = () => {
    if (currentCount === 0) return;
    Alert.alert(
      tab === 'scanned' ? 'Borrar escaneos' : 'Borrar QR creados',
      `Se eliminarán ${currentCount} ${currentCount === 1 ? 'elemento' : 'elementos'} de este dispositivo. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: () => {
            clearHistory(tab);
            setSelected(null);
            showToast('Historial borrado', 'info');
          },
        },
      ],
    );
  };

  const parsedSelected =
    selected?.kind === 'scanned' ? parseScannedCode(selected.raw) : null;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Historial"
        subtitle="Todo lo que escaneas y creas, en un solo lugar"
        onSettings={() => navigation.navigate('Settings')}
        right={
          <IconButton
            icon="trash-2"
            label="Borrar historial"
            size={40}
            onPress={clearCurrentTab}
            disabled={currentCount === 0}
          />
        }
      />

      <View style={styles.controls}>
        <SegmentedControl
          options={[
            {
              value: 'scanned',
              label: 'Escaneados',
              icon: 'camera',
              count: scannedCount,
            },
            {
              value: 'created',
              label: 'Creados',
              icon: 'edit-3',
              count: createdCount,
            },
          ]}
          value={tab}
          onChange={(value) => {
            setTab(value);
            setQuery('');
          }}
        />

        <View style={styles.search}>
          <Feather name="search" size={16} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar en el historial"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.primaryBright}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              onPress={() => setQuery('')}
              hitSlop={8}
            >
              <Feather name="x" size={15} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <HistoryRow
            entry={item}
            onPress={() => setSelected(item)}
            onDelete={() => handleDelete(item)}
            onLongPress={() => confirmDeleteEntry(item, () => handleDelete(item))}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather
                name={
                  query
                    ? 'search'
                    : tab === 'scanned'
                      ? 'camera-off'
                      : 'edit-3'
                }
                size={30}
                color={colors.primaryBright}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {query
                ? 'Sin resultados'
                : tab === 'scanned'
                  ? 'Aún no tienes escaneos'
                  : 'Aún no has creado un QR'}
            </Text>
            <Text style={styles.emptyText}>
              {query
                ? 'Prueba con otra palabra o revisa la pestaña contraria.'
                : tab === 'scanned'
                  ? 'Escanea tu primer código y aparecerá aquí automáticamente.'
                  : 'Diseña un QR desde la pestaña Crear y guárdalo para verlo aquí.'}
            </Text>
            {query ? (
              <Button
                label="Limpiar búsqueda"
                icon="x"
                variant="secondary"
                onPress={() => setQuery('')}
                compact
              />
            ) : (
              <Button
                label={tab === 'scanned' ? 'Ir a escanear' : 'Crear mi primer QR'}
                icon={tab === 'scanned' ? 'camera' : 'plus'}
                onPress={() =>
                  navigation.navigate(
                    tab === 'scanned' ? 'ScanTab' : 'CreateTab',
                  )
                }
                compact
              />
            )}
          </View>
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <Text style={styles.footerHint}>
              Desliza un elemento a la izquierda para eliminarlo. Mantén
              pulsado para más opciones.
            </Text>
          ) : undefined
        }
      />

      <AdBanner onUpgrade={() => navigation.navigate('Pro')} />

      <ScanResultModal
        visible={!!selected && selected.kind === 'scanned'}
        parsed={parsedSelected}
        createdAt={selected?.createdAt}
        onClose={() => setSelected(null)}
        onDelete={
          selected
            ? () => {
                handleDelete(selected);
              }
            : undefined
        }
      />

      <CreatedQrModal
        visible={!!selected && selected.kind === 'created'}
        entry={selected?.kind === 'created' ? selected : null}
        onClose={() => setSelected(null)}
        onDelete={() => {
          if (selected) handleDelete(selected);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: 10,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 46,
    paddingHorizontal: 13,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: 9,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footerHint: {
    fontSize: 10,
    lineHeight: 15,
    color: colors.textFaint,
    textAlign: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 6,
  },
});
