import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  Alert,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { Button, ErrorText, TextField, colors } from '../ui/atoms';

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

  // Простая иконка Google
  const GoogleIcon = () => (
    <View style={styles.googleIcon}>
      <Text style={styles.googleIconText}>G</Text>
    </View>
  );

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/originals/79/26/47/7926476d9d6f5fa8c2cb9b9ee771e0c0.jpg',
      }}
      style={styles.container}
      imageStyle={styles.image}
    >
      {/* Оверлей как на главной странице */}
      <View style={styles.overlay} />
      
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Плашка */}
            <View style={styles.topBar} />

            {/* Заголовок с шрифтами как на главной */}
            <View style={styles.header}>
              <Text style={styles.title}>
                Вход в <Text style={styles.titleAccent}>аккаунт</Text>
              </Text>
              <Text style={styles.subtitle}>
                Управляй своими вишлистами и дари{'\n'}именно то, что хотят
              </Text>
            </View>

            {/* Форма */}
            <View style={styles.form}>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                labelStyle={styles.label}
              />

              <TextField
                label="Пароль"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                labelStyle={styles.label}
              />

              <ErrorText message={error} />

              {/* Кнопка входа */}
              <TouchableOpacity
                onPress={onSubmit}
                disabled={loading}
                activeOpacity={0.9}
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Входим...' : 'Войти'}
                </Text>
              </TouchableOpacity>

              {/* Google кнопка */}
              <TouchableOpacity
                onPress={signInWithGoogle}
                disabled={googleLoading}
                activeOpacity={0.8}
                style={styles.googleButton}
              >
                <GoogleIcon />
                <Text style={styles.googleButtonText}>
                  Войти через Google
                </Text>
              </TouchableOpacity>

              {/* Текст регистрации */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                style={styles.registerLink}
              >
                <Text style={styles.registerText}>
                  Нет аккаунта?{' '}
                  <Text style={styles.registerHighlight}>
                    Зарегистрироваться
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Разделитель */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  wishlist
                </Text>
                <View style={styles.dividerLine} />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    opacity: 0.9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.15)',
    borderTopWidth: 0,
    padding: 32,
    paddingTop: 28,
    shadowColor: '#FF9AAE',
    shadowOpacity: 0.15,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'visible',
  },
  topBar: {
    position: 'absolute',
    top: -6,
    left: -1,
    right: -1,
    height: 12,
    backgroundColor: colors.pink,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  // ✅ Шрифты КАК НА ГЛАВНОЙ
  title: {
    marginTop: 10,
    fontSize: 22, // Как на главной
    fontWeight: '900', // Как на главной
    fontFamily: 'Soledago-Regular', // Как на главной
    color: colors.text,
    textAlign: 'center',
  },
  titleAccent: {
    color: colors.pink,
  },
  subtitle: {
    marginTop: 8, // Как на главной
    fontSize: 12, // Как на главной
    lineHeight: 16, // Как на главной
    color: colors.text, // Как на главной
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System',
    }),
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System',
    }),
    marginBottom: 8,
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },
  loginButton: {
    height: 50, // Как на главной
    borderRadius: 999,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#A9A9B0',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16, // Как на главной
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  googleButton: {
    height: 50, // Как на главной
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(236, 72, 153, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16, // Как на главной
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  registerText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '400',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System',
    }),
  },
  registerHighlight: {
    color: colors.pink,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif-medium',
      default: 'System',
    }),
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: colors.pink,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '400',
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: 'System',
    }),
    textTransform: 'lowercase',
  },
});