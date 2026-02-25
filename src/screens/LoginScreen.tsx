import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { Button, Card, ErrorText, Screen, TextField, colors } from '../ui/atoms';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Заполните email и пароль');
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Некорректный email');
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Неверный email или пароль';
      setError(msg);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
            Вход в аккаунт
          </Text>
          <Text style={{ marginTop: 6, fontSize: 12, color: colors.muted }}>
            Управляй своими вишлистами и подарками.
          </Text>

          <View style={{ marginTop: 16, gap: 12 }}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextField
              label="Пароль"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ErrorText message={error} />

            <Button title="Войти" onPress={onSubmit} loading={loading} />
            <Button
              title="Нет аккаунта? Регистрация"
              variant="secondary"
              onPress={() => navigation.navigate('Register')}
            />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

