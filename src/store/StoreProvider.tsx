import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  AppSettings,
  HistoryEntry,
  HistoryKind,
} from '../types';

const STORAGE_KEY = '@qrcraft/state/v1';
const MAX_HISTORY = 300;

const DEFAULT_SETTINGS: AppSettings = {
  sound: true,
  vibration: true,
  autoOpenUrls: false,
  pro: false,
  exportCount: 0,
};

interface PersistedState {
  history: HistoryEntry[];
  settings: AppSettings;
}

interface StoreValue {
  history: HistoryEntry[];
  settings: AppSettings;
  hydrated: boolean;
  addEntry: (
    entry: Omit<HistoryEntry, 'id' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
    },
  ) => HistoryEntry;
  removeEntry: (id: string) => void;
  clearHistory: (kind?: HistoryKind) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  registerExport: () => number;
}

const StoreContext = createContext<StoreValue | null>(null);

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<HistoryEntry>;
  return (
    typeof entry.id === 'string' &&
    (entry.kind === 'scanned' || entry.kind === 'created') &&
    typeof entry.category === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.raw === 'string' &&
    typeof entry.createdAt === 'string'
  );
}

function sanitizeState(value: unknown): PersistedState {
  if (!value || typeof value !== 'object') {
    return { history: [], settings: DEFAULT_SETTINGS };
  }

  const parsed = value as Partial<PersistedState>;
  const history = Array.isArray(parsed.history)
    ? parsed.history.filter(isHistoryEntry).slice(0, MAX_HISTORY)
    : [];

  const settings = {
    ...DEFAULT_SETTINGS,
    ...(parsed.settings && typeof parsed.settings === 'object'
      ? parsed.settings
      : {}),
  };

  return {
    history,
    settings: {
      sound: Boolean(settings.sound),
      vibration: Boolean(settings.vibration),
      autoOpenUrls: Boolean(settings.autoOpenUrls),
      pro: false,
      exportCount: Number.isFinite(settings.exportCount)
        ? Math.max(0, Number(settings.exportCount))
        : 0,
    },
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const exportCountRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (raw) {
          const state = sanitizeState(JSON.parse(raw));
          setHistory(state.history);
          setSettings(state.settings);
          exportCountRef.current = state.settings.exportCount;
        }
      } catch {
        // Corrupt or unavailable storage must never block the app.
      } finally {
        if (mounted) setHydrated(true);
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedState = { history, settings };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Persisting is best-effort; the in-memory state remains usable.
    });
  }, [history, settings, hydrated]);

  const addEntry = useCallback<StoreValue['addEntry']>((input) => {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const entry: HistoryEntry = {
      ...input,
      id: input.id ?? createId(),
      createdAt,
    };

    setHistory((previous) => {
      const dedupeWindow = 5 * 60 * 1000;
      const now = Date.now();
      const filtered = previous.filter((item) => {
        if (item.kind !== entry.kind) return true;
        if (entry.kind !== 'created') return true;
        if (item.raw !== entry.raw) return true;
        const age = now - new Date(item.createdAt).getTime();
        return !(age >= 0 && age < dedupeWindow);
      });
      return [entry, ...filtered].slice(0, MAX_HISTORY);
    });

    return entry;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback((kind?: HistoryKind) => {
    setHistory((previous) =>
      kind ? previous.filter((item) => item.kind !== kind) : [],
    );
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((previous) => ({ ...previous, ...patch }));
  }, []);

  const registerExport = useCallback(() => {
    const nextCount = exportCountRef.current + 1;
    exportCountRef.current = nextCount;
    setSettings((previous) => ({ ...previous, exportCount: nextCount }));
    return nextCount;
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      history,
      settings,
      hydrated,
      addEntry,
      removeEntry,
      clearHistory,
      updateSettings,
      registerExport,
    }),
    [
      history,
      settings,
      hydrated,
      addEntry,
      removeEntry,
      clearHistory,
      updateSettings,
      registerExport,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return context;
}

export { DEFAULT_SETTINGS };
