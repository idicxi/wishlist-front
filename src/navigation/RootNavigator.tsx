import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAuth } from '../auth/AuthContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { token } = useAuth();

  return (
    <Stack.Navigator
      key={token ? 'app' : 'auth'}
      initialRouteName={token ? 'Dashboard' : 'Landing'}
    >
      {token ? (
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'Профиль' }}
          />
          <Stack.Screen
            name="Wishlist"
            component={WishlistScreen}
            options={{ title: 'Вишлист' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{ title: 'Wishlist' }}
          />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Вход' }} />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Регистрация' }}
          />
          <Stack.Screen
            name="Wishlist"
            component={WishlistScreen}
            options={{ title: 'Вишлист' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

