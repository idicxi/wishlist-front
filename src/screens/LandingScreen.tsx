import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { LandingStatsCard } from '../components/LandingStatsCard';
import { Button, Card, Screen, colors } from '../ui/atoms';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export function LandingScreen({ navigation }: Props) {
  return (
    <Screen >
      <ImageBackground
        source={{
          uri: 'https://i.pinimg.com/originals/79/26/47/7926476d9d6f5fa8c2cb9b9ee771e0c0.jpg',
        }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.badge}>
            <View style={styles.dot} />
            <Text style={styles.badgeText}>Новый формат подарков — без повторов</Text>
          </View>
          <Text style={styles.title}>
            Социальный вишлист{' '}
            <Text style={{ color: colors.pink }}>— дари то, что хотят</Text>
          </Text>
          <Text style={styles.subtitle}>
            Создавай списки желаний, делись с друзьями и собирай подарки в реальном
            времени.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <Button title="Регистрация" onPress={() => navigation.navigate('Register')} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Вход"
                variant="secondary"
                onPress={() => navigation.navigate('Login')}
              />
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={{ marginTop: 14, gap: 12 }}>
        <LandingStatsCard />
        <Card>
          <Text style={styles.cardTitle}>Реалтайм</Text>
          <Text style={styles.cardText}>
            Бронирования и вклады появляются мгновенно — без обновления экрана.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroImage: { borderRadius: 20 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  heroContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.pinkDark },
  title: { marginTop: 10, fontSize: 22, fontWeight: '900', fontFamily: 'Soledago',color: colors.text },
  subtitle: { marginTop: 8, fontSize: 12, lineHeight: 16, color: colors.text },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  cardText: { marginTop: 6, fontSize: 12, lineHeight: 16, color: colors.muted },
});

