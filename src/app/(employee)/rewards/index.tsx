import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { getRewards, getEmployeePoints, claimReward } from '@/lib/services/rewards';
import { RewardItem } from '@/types/database';
import {
  Gift,
  Sparkles,
  Trophy,
  CheckCircle,
  ShoppingBag,
} from 'lucide-react-native';

export default function RewardsStoreScreen() {
  const colors = useTheme();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [points, setPoints] = useState(850);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [r, p] = await Promise.all([getRewards(), getEmployeePoints('emp_demo')]);
      setRewards(r);
      setPoints(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRedeem = async (reward: RewardItem) => {
    if (points < reward.points_required) {
      alert(`You need ${reward.points_required - points} more kudos points to claim this reward!`);
      return;
    }
    await claimReward('emp_demo', reward.id);
    setPoints((prev) => prev - reward.points_required);
    alert(`🎉 Success! You claimed "${reward.title}". Your voucher will arrive in your email.`);
    loadData();
  };

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Rewards & Recognition Store</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Redeem Peer Kudos Points for Curated Tech & Experiences
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Points Banner */}
          <View style={styles.pointsBanner}>
            <View>
              <Text style={styles.bannerLabel}>Your Available Recognition Balance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Trophy size={28} color="#FEF3C7" />
                <Text style={styles.pointsNumber}>{points} Kudos Points</Text>
              </View>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Earn more via peer appreciation!</Text>
            </View>
          </View>

          {/* Reward Catalog */}
          <Text style={styles.catalogTitle}>Available Rewards Catalog</Text>
          <View style={styles.grid}>
            {rewards.map((r) => {
              const canAfford = points >= r.points_required;
              return (
                <View key={r.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={styles.iconBox}>
                      <Gift size={22} color="#0D7377" />
                    </View>
                    <View style={styles.costBadge}>
                      <Text style={styles.costText}>{r.points_required} Points</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{r.title}</Text>
                  <Text style={styles.cardDesc}>{r.description}</Text>

                  <View style={{ marginTop: 14 }}>
                    <TouchableOpacity
                      onPress={() => handleRedeem(r)}
                      style={[
                        styles.redeemBtn,
                        canAfford ? { backgroundColor: '#0D7377' } : { backgroundColor: '#E2E8F0' },
                      ]}
                    >
                      <ShoppingBag size={14} color={canAfford ? '#FFFFFF' : '#94A3B8'} />
                      <Text style={[styles.redeemText, canAfford ? { color: '#FFFFFF' } : { color: '#94A3B8' }]}>
                        {canAfford ? 'Redeem Voucher' : `Needs ${r.points_required - points} Pts`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  pointsBanner: {
    backgroundColor: '#0D7377',
    padding: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerLabel: { color: '#CCECEC', fontSize: 13, fontWeight: '600' },
  pointsNumber: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  badgePill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgePillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  catalogTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '48%', minWidth: 280, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  costBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  costText: { fontSize: 12, fontWeight: '800', color: '#D97706' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginTop: 12 },
  cardDesc: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  redeemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
  redeemText: { fontSize: 12, fontWeight: '700' },
});
