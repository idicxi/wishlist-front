import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/ui/atoms';

enableScreens();

function AppShell() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <NavigationContainer>
          <AppShell />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
