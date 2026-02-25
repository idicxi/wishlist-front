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
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 16,
            paddingVertical: 24,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: '100%',
              maxWidth: 420,
              borderRadius: 24,
              padding: 20,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderWidth: 1,
              borderColor: 'rgba(244,114,182,0.35)',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 6,
                backgroundColor: colors.pink,
                opacity: 0.9,
              }}
            />

            <View style={{ alignItems: 'center', marginTop: 6 }}>
              <Text
                style={{
                  fontSize: 24,
                  color: colors.text,
                  fontFamily: 'Soledago-Regular',
                }}
              >
                Регистрация
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: colors.muted,
                  textAlign: 'center',
                }}
              >
                Создай аккаунт и управляй своими вишлистами.
              </Text>
            </View>

            <View style={{ marginTop: 24, gap: 12 }}>
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

              <Button
                title={loading ? 'Регистрируем...' : 'Зарегистрироваться'}
                onPress={onSubmit}
                loading={loading}
              />
             
            </View>

            <View
              style={{
                marginTop: 24,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: colors.muted,
                  textAlign: 'center',
                }}
              >
                Уже есть аккаунт?{' '}
                <Text
                  style={{ color: colors.pink, fontWeight: '600' }}
                  onPress={() => navigation.navigate('Login')}
                >
                  Войти
                </Text>
              </Text>
            </View>

            <View
              style={{
                marginTop: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <View
                style={{
                  height: 1,
                  flex: 1,
                  backgroundColor: 'rgba(244,114,182,0.4)',
                }}
              />
              <Text
                style={{
                  fontFamily: 'Soledago-Regular',
                  fontSize: 14,
                  color: colors.muted,
                }}
              >
                wishlist
              </Text>
              <View
                style={{
                  height: 1,
                  flex: 1,
                  backgroundColor: 'rgba(244,114,182,0.4)',
                }}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

