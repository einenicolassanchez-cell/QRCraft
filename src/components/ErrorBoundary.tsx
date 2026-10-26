import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, radius, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.error('QRCraft error boundary:', error);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root}>
        <View style={styles.icon}>
          <Feather name="alert-triangle" size={30} color={colors.warning} />
        </View>
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.text}>
          QRCraft encontró un error inesperado. Tu historial local sigue a salvo.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState({ error: null })}
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="refresh-cw" size={16} color={colors.white} />
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
        {__DEV__ ? (
          <Text style={styles.debug}>{this.state.error.message}</Text>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 13,
    marginTop: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  debug: {
    marginTop: 16,
    fontSize: 10,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
