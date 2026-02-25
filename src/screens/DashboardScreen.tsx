import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { apiFetch } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { Button, Card, ErrorText, Screen, TextField, colors } from '../ui/atoms';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type Wishlist = {
  id: number;
  title: string;
  description?: string | null;
  event_date?: string | null;
  slug: string;
  owner_id: number;
};

type Gift = {
  id: number;
};

export function DashboardScreen({ navigation }: Props) {
  const { user, token, logout } = useAuth();
  const [wishlists, setWishlists] = useState<Array<Wishlist & { gifts_count?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const headerRight = useMemo(
    () => (
      <View style={{ minWidth: 70 }}>
        <Button
          title="Выйти"
          variant="secondary"
          onPress={() =>
            Alert.alert('Выход', 'Выйти из аккаунта?', [
              { text: 'Отмена', style: 'cancel' },
              {
                text: 'Выйти',
                style: 'destructive',
                onPress: async () => {
                  await logout();
                },
              },
            ])
          }
        />
      </View>
    ),
    [logout],
  );
       
  const fetchWishlists = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Wishlist[]>('/wishlists/', { token });
      const withCounts = await Promise.all(
        (data ?? []).map(async (w) => {
          try {
            const gifts = await apiFetch<Gift[]>(`/wishlists/${w.id}/gifts`, { token });
            return { ...w, gifts_count: Array.isArray(gifts) ? gifts.length : 0 };
          } catch {
            return { ...w, gifts_count: undefined };
          }
        }),
      );
      setWishlists(withCounts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось загрузить вишлисты';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWishlists();
  }, [fetchWishlists]);

  const createWishlist = async () => {
    if (!token || !user) return;
    if (!title.trim()) {
      setError('Введите название');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDate ? eventDate.toISOString().split('T')[0] : null,
        owner_id: user.id,
      };

      await apiFetch<Wishlist>('/wishlists/', {
        token,
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreateOpen(false);
      setTitle('');
      setDescription('');
      setEventDate(null);
      await fetchWishlists();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось создать вишлист';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen title="Профиль" right={headerRight}>
      <Card>
        <Text style={styles.hi}>Привет, {user?.name ?? 'друг'}!</Text>
        <Text style={styles.sub}>Тут твои вишлисты. Можно создать новый и делиться ссылкой.</Text>
        <View style={{ marginTop: 12 }}>
          <Button
            title={createOpen ? 'Закрыть создание' : 'Создать вишлист'}
            variant={createOpen ? 'secondary' : 'primary'}
            onPress={() => setCreateOpen((v) => !v)}
          />
        </View>
      </Card>

      {createOpen && (
        <View style={{ marginTop: 12 }}>
          <Card>
            <Text style={styles.cardTitle}>Новый вишлист</Text>
            <View style={{ marginTop: 12, gap: 12 }}>
              <TextField label="Название" value={title} onChangeText={setTitle} placeholder="Например, День рождения" />
              <TextField
                label="Описание (необязательно)"
                value={description}
                onChangeText={setDescription}
                placeholder="Пару слов…"
              />

             {/* Календарь */}
<View>
  <Text style={styles.label}>Дата события (необязательно)</Text>
  <Button
    title={eventDate ? eventDate.toLocaleDateString('ru-RU') : 'Выбрать дату'}
    onPress={() => setDatePickerOpen(true)}
    variant="secondary"
  />
  {datePickerOpen && (
    <DateTimePicker
      value={eventDate || new Date()}
      mode="date"
      display="default"
      locale="ru-RU"
      onChange={(event, selectedDate) => {
        setDatePickerOpen(false);
        if (selectedDate) setEventDate(selectedDate);
      }}
    />
  )}
</View>

              <ErrorText message={error} />
              <Button title="Создать" onPress={createWishlist} loading={creating} />
            </View>
          </Card>
        </View>
      )}

      <View style={{ marginTop: 12, flex: 1 }}>
        <Text style={styles.sectionTitle}>Мои вишлисты</Text>
        <ErrorText message={error && !createOpen ? error : null} />
        <FlatList
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20, gap: 10 }}
          data={wishlists}
          refreshing={loading}
          onRefresh={fetchWishlists}
          keyExtractor={(w) => String(w.id)}
          ListEmptyComponent={
            loading ? null : (
              <Text style={{ color: colors.muted, marginTop: 6 }}>
                Пока пусто. Создай первый вишлист.
              </Text>
            )
          }
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.wTitle}>{item.title}</Text>
              {!!item.description && <Text style={styles.wDesc}>{item.description}</Text>}
              {!!item.event_date && (
                <Text style={styles.wMetaDate}>📅 {new Date(item.event_date).toLocaleDateString('ru-RU')}</Text>
              )}
              <Text style={styles.wMeta}>
                {item.gifts_count != null ? `${item.gifts_count} подарков` : '…'}
              </Text>
              <View style={{ marginTop: 10 }}>
                <Button
                  title="Открыть"
                  onPress={() => navigation.navigate('Wishlist', { slug: item.slug })}
                />
              </View>
            </Card>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hi: { fontSize: 16, fontWeight: '900', color: colors.text },
  sub: { marginTop: 6, fontSize: 12, lineHeight: 16, color: colors.muted },
  sectionTitle: { marginTop: 14, fontSize: 14, fontWeight: '800', color: colors.text },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  wTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  wDesc: { marginTop: 6, fontSize: 12, lineHeight: 16, color: colors.muted },
  wMetaDate: { marginTop: 6, fontSize: 11, color: colors.pinkDark, fontWeight: '600' },
  wMeta: { marginTop: 4, fontSize: 11, color: colors.muted, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 6 },
});