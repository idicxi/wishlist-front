import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { Button, Card, ErrorText, Screen, TextField, colors } from '../ui/atoms';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!name.trim() || !email || !password) {
      setError('Заполните имя, email и пароль');
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Некорректный email');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }

    try {
      await register(name, email.trim(), password);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Не удалось зарегистрироваться';
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
            Создай аккаунт
          </Text>
          <Text style={{ marginTop: 6, fontSize: 12, color: colors.muted }}>
            И управляй своими вишлистами.
          </Text>

          <View style={{ marginTop: 16, gap: 12 }}>
            <TextField
              label="Имя"
              value={name}
              onChangeText={setName}
              placeholder="Как к вам обращаться"
              autoCapitalize="words"
            />
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

            <Button title="Зарегистрироваться" onPress={onSubmit} loading={loading} />
            <Button
              title="Уже есть аккаунт? Войти"
              variant="secondary"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

