import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '../theme';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  variant: ToastVariant;
  key: number;
}

interface ToastValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

const ICONS: Record<ToastVariant, React.ComponentProps<typeof Feather>['name']> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: colors.accent,
  error: colors.danger,
  info: colors.primaryBright,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, variant, key: Date.now() });
      opacity.setValue(0);
      translateY.setValue(14);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 16,
          stiffness: 220,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
      hideTimer.current = setTimeout(hide, 2600);
    },
    [hide, opacity, translateY],
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              bottom: insets.bottom + 86,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.toast}>
            <Feather
              name={ICONS[toast.variant]}
              size={18}
              color={ICON_COLORS[toast.variant]}
            />
            <Text style={styles.message} numberOfLines={3}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 11,
    paddingHorizontal: 16,
    maxWidth: 420,
    ...shadow.floating,
  },
  message: {
    flexShrink: 1,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.text,
  },
});
