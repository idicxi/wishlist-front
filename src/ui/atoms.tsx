import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

export const colors = {
  bg: '#FFF7F2',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: 'rgba(236, 72, 153, 0.25)', // pink-500/25
  pink: '#EC4899',
  pinkDark: '#DB2777',
  danger: '#DC2626',
} as const;

export function Screen({
  children,
  title,
  right,
  
}: {
  children: React.ReactNode;
  title?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.screen}>
      {(title || right) && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title ?? ''}</Text>
          <View>{right}</View>
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
} & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(107,114,128,0.7)"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
        {...rest}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  const style =
    variant === 'primary'
      ? styles.btnPrimary
      : variant === 'danger'
        ? styles.btnDanger
        : styles.btnSecondary;
  const textStyle =
    variant === 'secondary' ? styles.btnSecondaryText : styles.btnPrimaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btnBase,
        style,
        isDisabled && { opacity: 0.6 },
        pressed && !isDisabled && { transform: [{ scale: 0.99 }] },
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'secondary' ? colors.pink : '#fff'} /> : <Text style={textStyle}>{title}</Text>}
    </Pressable>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.text },
  input: {
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    color: colors.text,
  },
  btnBase: {
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.text },
  btnDanger: { backgroundColor: colors.danger },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,24,39,0.12)',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondaryText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 14,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220,38,38,0.35)',
  },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
});

