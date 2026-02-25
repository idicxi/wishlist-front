import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Card, colors } from '../ui/atoms';

export type Gift = {
  id: number;
  title: string;
  price: number;
  url?: string | null;
  image_url?: string | null;
  is_reserved: boolean;
  collected: number;
  progress: number;
  reserved_by?: { id: number; name: string } | null;
  contributors?: Array<{ id: number; user_id: number; user_name: string; amount: number }>;
  has_contributions?: boolean;
};

function declension(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) return 'человек';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'человека';
  return 'человек';
}

export function GiftCard({
  gift,
  isOwner,
  isAuthenticated,
  onRequireAuth,
  onReserve,
  onContribute,
  onEdit,
  onDelete,
}: {
  gift: Gift;
  isOwner: boolean;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onReserve?: () => Promise<void> | void;
  onContribute?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [showContributors, setShowContributors] = useState(false);
  const [loadingReserve, setLoadingReserve] = useState(false);

  const canSeeProgress = isAuthenticated && !isOwner;
  const canSeeWhoReserved = isAuthenticated && !isOwner;
  const canSeeContributors = isAuthenticated && !isOwner;

  const canReserve = isAuthenticated && !isOwner && !gift.is_reserved && !gift.has_contributions;
  const canContribute = isAuthenticated && !isOwner && !gift.is_reserved;

  const urlLabel = useMemo(() => {
    const raw = gift.url ?? '';
    return raw.replace(/^https?:\/\//, '').slice(0, 42);
  }, [gift.url]);

  const onPressUrl = async () => {
    if (!gift.url) return;
    const ok = await Linking.canOpenURL(gift.url);
    if (ok) await Linking.openURL(gift.url);
  };

  const reserve = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!onReserve) return;
    setLoadingReserve(true);
    try {
      await onReserve();
    } finally {
      setLoadingReserve(false);
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={styles.imageWrap}>
          {gift.image_url ? (
            <Image source={{ uri: gift.image_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>🎁</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Text style={styles.title} numberOfLines={2}>
              {gift.title}
            </Text>
            <Text style={styles.price}>{Number(gift.price ?? 0).toLocaleString('ru-RU')} ₽</Text>
          </View>

          {!!gift.url && (
            <Pressable onPress={onPressUrl} style={{ marginTop: 6 }}>
              <Text style={styles.url} numberOfLines={1}>
                {urlLabel}…
              </Text>
            </Pressable>
          )}

          {canSeeProgress && (gift.progress ?? 0) > 0 && (
            <View style={{ marginTop: 10 }}>
              <View style={styles.row}>
                <Text style={styles.muted}>Собрано</Text>
                <Text style={styles.pink}>
                  {Number(gift.collected ?? 0).toLocaleString('ru-RU')} /{' '}
                  {Number(gift.price ?? 0).toLocaleString('ru-RU')} ₽
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(100, gift.progress ?? 0)}%` }]} />
              </View>
            </View>
          )}

          {canSeeWhoReserved && gift.is_reserved && gift.reserved_by && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Забронировал(а): <Text style={{ fontWeight: '900' }}>{gift.reserved_by.name}</Text>
              </Text>
            </View>
          )}

          {canSeeContributors && gift.contributors && gift.contributors.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Pressable onPress={() => setShowContributors((v) => !v)}>
                <Text style={styles.contribToggle}>
                  Скинулись {gift.contributors.length} {declension(gift.contributors.length)}{' '}
                  {showContributors ? '▲' : '▼'}
                </Text>
              </Pressable>
              {showContributors && (
                <View style={styles.contribBox}>
                  {gift.contributors.map((c) => (
                    <View key={String(c.id)} style={styles.contribRow}>
                      <Text style={styles.contribName}>{c.user_name}</Text>
                      <Text style={styles.contribAmount}>
                        {Number(c.amount ?? 0).toLocaleString('ru-RU')} ₽
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={{ marginTop: 12, gap: 10 }}>
        {isOwner && (onEdit || onDelete) && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {onEdit && (
              <View style={{ flex: 1 }}>
                <Button title="Изменить" variant="secondary" onPress={onEdit} />
              </View>
            )}
            {onDelete && (
              <View style={{ flex: 1 }}>
                <Button
                  title="Удалить"
                  variant="danger"
                  onPress={() =>
                    Alert.alert('Удалить подарок?', gift.title, [
                      { text: 'Отмена', style: 'cancel' },
                      { text: 'Удалить', style: 'destructive', onPress: onDelete },
                    ])
                  }
                />
              </View>
            )}
          </View>
        )}

        {!gift.is_reserved && canReserve && (
          <Button title="🎁 Забронировать" onPress={reserve} loading={loadingReserve} />
        )}
        {!gift.is_reserved && canContribute && (
          <Button title="💰 Скинуться" variant="secondary" onPress={onContribute ?? onRequireAuth} />
        )}
        {!gift.is_reserved &&
          gift.has_contributions &&
          isAuthenticated &&
          !isOwner && <Text style={styles.collecting}>Идет сбор средств</Text>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    width: 84,
    height: 84,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(236,72,153,0.10)',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 24 },
  title: { flex: 1, fontSize: 13, fontWeight: '900', color: colors.text },
  price: { fontSize: 13, fontWeight: '900', color: colors.pink },
  url: { fontSize: 10, color: colors.muted, textDecorationLine: 'underline' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { fontSize: 10, color: colors.muted },
  pink: { fontSize: 10, fontWeight: '800', color: colors.pinkDark },
  progressTrack: { marginTop: 6, height: 6, borderRadius: 999, backgroundColor: 'rgba(17,24,39,0.06)' },
  progressFill: { height: 6, borderRadius: 999, backgroundColor: colors.pink },
  badge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(236,72,153,0.08)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 10, color: colors.pinkDark, fontWeight: '700' },
  contribToggle: { fontSize: 10, color: colors.muted, fontWeight: '700' },
  contribBox: { marginTop: 8, backgroundColor: 'rgba(236,72,153,0.06)', borderRadius: 12, padding: 10, gap: 6 },
  contribRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contribName: { fontSize: 10, fontWeight: '800', color: colors.text },
  contribAmount: { fontSize: 10, fontWeight: '800', color: colors.pinkDark },
  collecting: { textAlign: 'center', fontSize: 10, color: '#B45309', fontWeight: '700' },
});

