import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { apiFetch, qs } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { GiftCard, type Gift } from '../components/GiftCard';
import { useWishlistSocket } from '../hooks/useWishlistSocket';
import type { RootStackParamList } from '../navigation/types';
import { Button, Card, ErrorText, Screen, TextField, colors } from '../ui/atoms';

type Props = NativeStackScreenProps<RootStackParamList, 'Wishlist'>;

type Wishlist = {
  id: number;
  title: string;
  description?: string | null;
  owner_id: number;
};

type ParseUrlResponse = { title: string | null; image: string | null; price: number | null };

function normalizeGiftUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

export function WishlistScreen({ navigation, route }: Props) {
  const { user, token } = useAuth();
  const slug = route.params.slug;

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wishlistId = wishlist?.id ?? null;
  const { lastEvent } = useWishlistSocket(wishlistId);

  const isAuthenticated = !!token && !!user;
  const isOwner = isAuthenticated && !!wishlist && user!.id === wishlist.owner_id;

  const requireAuth = () => navigation.navigate('Login');

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const w = await apiFetch<Wishlist>(`/wishlist/${encodeURIComponent(slug)}`, {
        token: token ?? undefined,
      });
      if (!w || !(w as any).id) {
        setWishlist(null);
        setGifts([]);
        setError('Вишлист не найден');
        return;
      }
      setWishlist(w);
      const g = await apiFetch<Gift[]>(`/wishlists/${(w as any).id}/gifts`, {
        token: token ?? undefined,
      });
      setGifts(Array.isArray(g) ? g : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить вишлист');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!lastEvent) return;

    setGifts((prev) => {
      if (lastEvent.type === 'gift_added' && (lastEvent as any).gift) {
        const g = (lastEvent as any).gift as Record<string, unknown>;
        const newId = Number(g.id);
        if (prev.some((x) => x.id === newId)) return prev;
        const newGift: Gift = {
          id: newId,
          title: String(g.title ?? ''),
          price: Number(g.price ?? 0),
          url: g.url != null ? String(g.url) : undefined,
          image_url: g.image_url != null ? String(g.image_url) : undefined,
          is_reserved: Boolean(g.is_reserved),
          collected: Number(g.collected ?? 0),
          progress: Number(g.progress ?? 0),
          reserved_by: null,
          contributors: [],
          has_contributions: false,
        };
        return [...prev, newGift];
      }

      const eventGiftId = Number((lastEvent as any).giftId);
      return prev.map((g) => {
        if (g.id !== eventGiftId) return g;
        if (lastEvent.type === 'item_reserved') {
          const reservedBy =
            (lastEvent as any).userId != null && (lastEvent as any).userName
              ? { id: Number((lastEvent as any).userId), name: String((lastEvent as any).userName) }
              : null;
          return { ...g, is_reserved: true, reserved_by: reservedBy };
        }
        if (lastEvent.type === 'contribution_added') {
          const collected = Number((lastEvent as any).total ?? 0);
          const progress = g.price > 0 ? Math.min(100, Math.round((collected / g.price) * 100)) : 0;
          const amount = Number((lastEvent as any).amount ?? 0);
          const existing = g.contributors ?? [];
          const newContributor =
            (lastEvent as any).userId != null && (lastEvent as any).userName != null
              ? {
                  id: Number((lastEvent as any).userId) * 1000000 + existing.length * 1000 + Math.round(amount),
                  user_id: Number((lastEvent as any).userId),
                  user_name: String((lastEvent as any).userName),
                  amount,
                }
              : null;
          const contributors = newContributor ? [...existing, newContributor] : existing;
          return {
            ...g,
            collected,
            progress,
            is_reserved: g.price != null && collected >= g.price ? true : g.is_reserved,
            contributors,
            has_contributions: contributors.length > 0,
          };
        }
        return g;
      });
    });
  }, [lastEvent]);

  // ----- owner: add/edit -----
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [savingGift, setSavingGift] = useState(false);
  const [parsing, setParsing] = useState(false);

  const parseFromUrl = async () => {
    const u = normalizeGiftUrl(link);
    if (!u) return;
    setParsing(true);
    try {
      const data = await apiFetch<ParseUrlResponse>(`/api/parse-url${qs({ url: u })}`);
      if (!title.trim() && data?.title) setTitle(data.title);
      if (!price && data?.price != null) setPrice(String(data.price));
      if (!imageUrl && data?.image) setImageUrl(data.image);
    } catch {
      Alert.alert('Ошибка', 'Не удалось распарсить ссылку');
    } finally {
      setParsing(false);
    }
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [parsingEdit, setParsingEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (gift: Gift) => {
    setEditingGift(gift);
    setEditTitle(gift.title ?? '');
    setEditLink(gift.url ? String(gift.url) : '');
    setEditPrice(gift.price != null ? String(gift.price) : '');
    setEditImageUrl(gift.image_url ? String(gift.image_url) : '');
    setEditOpen(true);
  };

  const parseEditFromUrl = async () => {
    const u = normalizeGiftUrl(editLink);
    if (!u) return;
    setParsingEdit(true);
    try {
      const data = await apiFetch<ParseUrlResponse>(`/api/parse-url${qs({ url: u })}`);
      if (!editTitle.trim() && data?.title) setEditTitle(data.title);
      if (!editPrice && data?.price != null) setEditPrice(String(data.price));
      if (!editImageUrl && data?.image) setEditImageUrl(data.image);
    } catch {
      Alert.alert('Ошибка', 'Не удалось распарсить ссылку');
    } finally {
      setParsingEdit(false);
    }
  };

  const saveEdit = async () => {
    if (!token || !editingGift) return;
    const t = editTitle.trim();
    const p = Number(String(editPrice).replace(',', '.'));
    if (!t) {
      setError('Введите название подарка');
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      setError('Введите цену (число > 0)');
      return;
    }
    setSavingEdit(true);
    setError(null);
    try {
      const u = normalizeGiftUrl(editLink);
      const q = qs({
        title: t,
        price: p,
        url: u || null,
        image_url: editImageUrl.trim() || null,
      });
      const res = await apiFetch<any>(`/gifts/${editingGift.id}${q}`, { token, method: 'PUT' });
      if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
        throw new Error(String((res as any).error));
      }
      setEditOpen(false);
      setEditingGift(null);
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteGift = async (giftId: number) => {
    if (!token) return;
    try {
      const res = await apiFetch<any>(`/gifts/${giftId}`, { token, method: 'DELETE' });
      if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
        Alert.alert('Не получилось', String((res as any).error));
        return;
      }
      setGifts((prev) => prev.filter((g) => g.id !== giftId));
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось удалить');
    }
  };

  const saveGift = async () => {
    if (!token || !wishlist) return;
    const t = title.trim();
    const p = Number(String(price).replace(',', '.'));
    if (!t) {
      setError('Введите название подарка');
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      setError('Введите цену (число > 0)');
      return;
    }
    setSavingGift(true);
    setError(null);
    try {
      const u = normalizeGiftUrl(link);
      const q = qs({
        title: t,
        price: p,
        wishlist_id: wishlist.id,
        url: u || null,
        image_url: imageUrl.trim() || null,
      });
      const res = await apiFetch<any>(`/gifts/${q}`, { token, method: 'POST' });
      if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
        throw new Error(String((res as any).error));
      }
      setAddOpen(false);
      setTitle('');
      setLink('');
      setPrice('');
      setImageUrl('');
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSavingGift(false);
    }
  };

  const reserveGift = async (giftId: number) => {
    if (!token) return requireAuth();
    try {
      const res = await apiFetch<any>(`/gifts/${giftId}/reserve`, { token, method: 'POST' });
      if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
        Alert.alert('Не получилось', String((res as any).error));
        return;
      }
      // realtime придёт по ws, но на всякий случай обновим локально
      setGifts((prev) => prev.map((g) => (g.id === giftId ? { ...g, is_reserved: true } : g)));
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось забронировать');
    }
  };

  const [contributeOpen, setContributeOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [amount, setAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  const openContribute = (gift: Gift) => {
    if (!token) return requireAuth();
    setSelectedGift(gift);
    setAmount('');
    setContributeOpen(true);
  };

  const submitContribution = async () => {
    if (!token || !selectedGift) return;
    const a = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(a) || a <= 0) {
      setError('Введите сумму (число > 0)');
      return;
    }
    setContributing(true);
    setError(null);
    try {
      const res = await apiFetch<any>(
        `/gifts/${selectedGift.id}/contribute${qs({ amount: a })}`,
        { token, method: 'POST' },
      );
      if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
        Alert.alert('Не получилось', String((res as any).error));
        return;
      }
      setContributeOpen(false);
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось отправить вклад');
    } finally {
      setContributing(false);
    }
  };

  const headerRight = useMemo(() => {
    if (!isAuthenticated) return null;
    return (
      <Button
        title="Профиль"
        variant="secondary"
        onPress={() => navigation.navigate('Dashboard')}
      />
    );
  }, [isAuthenticated, navigation]);

  return (
    <Screen title={wishlist?.title ?? 'Вишлист'} right={headerRight}>
      {wishlist?.description ? (
        <Text style={{ marginBottom: 10, color: colors.muted, fontSize: 12, lineHeight: 16 }}>
          {wishlist.description}
        </Text>
      ) : null}

      {isOwner && (
        <View style={{ marginBottom: 12 }}>
          <Button
            title={addOpen ? 'Закрыть добавление подарка' : 'Добавить подарок'}
            variant={addOpen ? 'secondary' : 'primary'}
            onPress={() => setAddOpen((v) => !v)}
          />
        </View>
      )}

      {addOpen && isOwner && (
        <View style={{ marginBottom: 12 }}>
          <Card>
            <Text style={styles.cardTitle}>Новый подарок</Text>
            <View style={{ marginTop: 12, gap: 12 }}>
              <TextField label="Название" value={title} onChangeText={setTitle} placeholder="Например, наушники" />
              <TextField label="Ссылка (необязательно)" value={link} onChangeText={setLink} placeholder="https://..." autoCapitalize="none" />
              <TextField label="Цена" value={price} onChangeText={setPrice} placeholder="10000" keyboardType="numeric" />
              <TextField label="Картинка (url, необязательно)" value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." autoCapitalize="none" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Заполнить по ссылке" variant="secondary" onPress={parseFromUrl} loading={parsing} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Сохранить" onPress={saveGift} loading={savingGift} />
                </View>
              </View>
              <ErrorText message={error} />
            </View>
          </Card>
        </View>
      )}

      {contributeOpen && selectedGift && (
        <View style={{ marginBottom: 12 }}>
          <Card>
            <Text style={styles.cardTitle}>Скинуться на подарок</Text>
            <Text style={{ marginTop: 6, fontSize: 12, color: colors.muted }}>
              {selectedGift.title}
            </Text>
            <View style={{ marginTop: 12, gap: 12 }}>
              <TextField
                label="Сумма"
                value={amount}
                onChangeText={setAmount}
                placeholder="500"
                keyboardType="numeric"
              />
              <ErrorText message={error} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Отмена" variant="secondary" onPress={() => setContributeOpen(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Отправить" onPress={submitContribution} loading={contributing} />
                </View>
              </View>
            </View>
          </Card>
        </View>
      )}

      {editOpen && editingGift && (
        <View style={{ marginBottom: 12 }}>
          <Card>
            <Text style={styles.cardTitle}>Редактировать подарок</Text>
            <Text style={{ marginTop: 6, fontSize: 12, color: colors.muted }}>
              #{editingGift.id}
            </Text>
            <View style={{ marginTop: 12, gap: 12 }}>
              <TextField label="Название" value={editTitle} onChangeText={setEditTitle} />
              <TextField label="Ссылка (необязательно)" value={editLink} onChangeText={setEditLink} autoCapitalize="none" />
              <TextField label="Цена" value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" />
              <TextField label="Картинка (url, необязательно)" value={editImageUrl} onChangeText={setEditImageUrl} autoCapitalize="none" />
              <ErrorText message={error} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Отмена" variant="secondary" onPress={() => setEditOpen(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Заполнить по ссылке" variant="secondary" onPress={parseEditFromUrl} loading={parsingEdit} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Сохранить" onPress={saveEdit} loading={savingEdit} />
                </View>
              </View>
            </View>
          </Card>
        </View>
      )}

      <FlatList
        data={gifts}
        refreshing={loading}
        onRefresh={fetchAll}
        keyExtractor={(g) => String(g.id)}
        contentContainerStyle={{ gap: 10, paddingBottom: 18 }}
        ListEmptyComponent={
          loading ? null : (
            <Text style={{ marginTop: 10, color: colors.muted }}>
              Пока нет подарков.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <GiftCard
            gift={item}
            isOwner={isOwner}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
            onReserve={() => reserveGift(item.id)}
            onContribute={() => openContribute(item)}
            onEdit={isOwner ? () => openEdit(item) : undefined}
            onDelete={isOwner ? () => deleteGift(item.id) : undefined}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
});

