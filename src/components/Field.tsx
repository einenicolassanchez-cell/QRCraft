import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, radius, spacing } from '../theme';

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string | null;
  icon?: React.ComponentProps<typeof Feather>['name'];
  prefix?: string;
}

export function Field({
  label,
  hint,
  error,
  icon,
  prefix,
  multiline,
  ...inputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          multiline && styles.inputRowMultiline,
          focused && styles.inputRowFocused,
          !!error && styles.inputRowError,
        ]}
      >
        {icon ? (
          <Feather
            name={icon}
            size={16}
            color={focused ? colors.primaryBright : colors.textFaint}
            style={styles.icon}
          />
        ) : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          {...inputProps}
          multiline={multiline}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.primaryBright}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            inputProps.editable === false && styles.inputDisabled,
          ]}
        />
      </View>
      {error ? (
        <View style={styles.helperRow}>
          <Feather name="alert-circle" size={12} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 7,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  inputRowMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputRowFocused: {
    borderColor: colors.primaryBright,
    backgroundColor: '#0B1528',
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  icon: {
    marginRight: 10,
  },
  prefix: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
    minHeight: 46,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 0,
    lineHeight: 21,
  },
  inputDisabled: {
    color: colors.textFaint,
  },
  hint: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textFaint,
    paddingLeft: 2,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 2,
  },
  error: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#FCA5A5',
    flex: 1,
  },
});
