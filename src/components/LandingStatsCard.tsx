import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { apiFetch } from '../api/http';
import { API_BASE_URL, getWsBaseUrl } from '../config';
import { Card, colors } from '../ui/atoms';

type Stats = {
  total_collected: number;
  total_goal: number;
  recent_contributors: { name: string }[];
};

const POLL_INTERVAL_MS = 30000;

function getInitial(name: string): string {
  const n = (name || '').trim();
  return n ? n[0]!.toUpperCase() : '?';
}

export function LandingStatsCard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchStats = async () => {
    try {
      const data = await apiFetch<Stats>('/stats');
      setStats({
        total_collected: Number((data as any).total_collected ?? 0),
        total_goal: Number((data as any).total_goal ?? 0),
        recent_contributors: Array.isArray((data as any).recent_contributors)
          ? (data as any).recent_contributors
          : [],
      });
    } catch {
      setStats({ total_collected: 0, total_goal: 0, recent_contributors: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const wsUrl = `${getWsBaseUrl(API_BASE_URL)}/ws/landing`;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data));
          if (data?.type === 'stats_updated') fetchStats();
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        wsRef.current = null;
      };
      ws.onerror = () => {
        // ignore
      };
    } catch {
      wsRef.current = null;
    }

    const t = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => {
      clearInterval(t);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const collected = stats?.total_collected ?? 0;
  const goal = stats?.total_goal ?? 0;
  const progress = goal > 0 ? Math.min(1, collected / goal) : 0;
  const contributors = stats?.recent_contributors ?? [];

  return (
    <Card>
      <Text style={styles.title}>Покупайте подарки друзьям вместе</Text>
      <Text style={styles.subtitle}>
        Скидывайтесь на подарки и следите за общей суммой — обновления в реальном
        времени.
      </Text>

      <View style={{ marginTop: 10, gap: 6 }}>
        <View style={styles.row}>
          <Text style={styles.muted}>Собрано</Text>
          <Text style={styles.pink}>
            {loading
              ? '…'
              : `${collected.toLocaleString('ru-RU')} / ${goal.toLocaleString('ru-RU')} ₽`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      {contributors.length > 0 && (
        <View style={styles.contribRow}>
          <View style={{ flexDirection: 'row' }}>
            {contributors.slice(0, 5).map((c, i) => (
              <View key={`${c.name}-${i}`} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -6 }]}>
                <Text style={styles.avatarText}>{getInitial(c.name)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.contribText}>
            {contributors.length}{' '}
            {contributors.length === 1
              ? 'человек уже скинулся'
              : [2, 3, 4].includes(contributors.length % 10) &&
                  ![12, 13, 14].includes(contributors.length % 100)
                ? 'человека уже скинулись'
                : 'человек уже скинулись'}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 6, fontSize: 12, lineHeight: 16, color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { fontSize: 11, color: colors.muted },
  pink: { fontSize: 11, fontWeight: '800', color: colors.pink },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: 'rgba(17,24,39,0.06)' },
  progressFill: { height: 6, borderRadius: 999, backgroundColor: colors.pink },
  contribRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(236,72,153,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: '800', color: colors.pinkDark },
  contribText: { fontSize: 10, color: colors.muted },
});

