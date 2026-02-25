import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { Button, Card, ErrorText, Screen, TextField, colors } from '../ui/atoms';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, loginWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '15536812730-shvclbe84e933f37vkpqpoai37bgmea8.apps.googleusercontent.com',
      iosClientId: '15536812730-shvclbe84e933f37vkpqpoai37bgmea8.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

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
      Alert.alert('Ошибка', msg);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens?.idToken;

      if (!idToken) {
        throw new Error('Не удалось получить токен Google');
      }

      await loginWithGoogle(idToken);
      Alert.alert('✅ Успех', 'Вы успешно вошли через Google');
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Ошибка входа через Google';
      setError(msg);
      console.error(e);
    } finally {
      setGoogleLoading(false);
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
                Вход в аккаунт
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: colors.muted,
                  textAlign: 'center',
                }}
              >
                Управляй своими вишлистами и подарками.
              </Text>
            </View>

            <View style={{ marginTop: 24, gap: 12 }}>
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

              <Button title={loading ? 'Входим...' : 'Войти'} onPress={onSubmit} loading={loading} />

              <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={signInWithGoogle}
                disabled={googleLoading}
                style={{ width: '100%', height: 48, marginTop: 8 }}
              />

              <Button
                title="Нет аккаунта? Регистрация"
                variant="secondary"
                onPress={() => navigation.navigate('Register')}
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
                Нет аккаунта?{' '}
                <Text
                  style={{ color: colors.pink, fontWeight: '600' }}
                  onPress={() => navigation.navigate('Register')}
                >
                  Зарегистрироваться
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