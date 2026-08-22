import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { getAssets, createAsset, updateAssetStatus } from '@/lib/services/assets';
import { CompanyAsset, AssetStatus, AssetCategory } from '@/types/database';
import { formatCurrency } from '@/utils/format';
import {
  Laptop,
  Monitor,
  Smartphone,
  Shield,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react-native';

export default function AssetsScreen() {
  const colors = useTheme();
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [cat, setCat] = useState<AssetCategory>('laptop');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [value, setValue] = useState('');

  const loadData = async () => {
    try {
      const data = await getAssets();
      setAssets(data);
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

  const handleCreate = async () => {
    if (!name.trim() || !tag.trim()) return;
    await createAsset({
      organization_id: 'subedge_org',
      name,
      asset_tag: tag,
      category: cat,
      model: model || name,
      serial_number: serial || `SN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      purchase_date: new Date().toISOString().split('T')[0],
      value: parseFloat(value) || 50000,
      status: 'available',
    });
    setName('');
    setTag('');
    setModel('');
    setSerial('');
    setValue('');
    setShowModal(false);
    loadData();
  };

  const handleToggleStatus = async (id: string, currentStatus: AssetStatus) => {
    const nextStatus: AssetStatus = currentStatus === 'in_use' ? 'available' : 'in_use';
    await updateAssetStatus(id, nextStatus, nextStatus === 'in_use' ? 'emp_demo' : null);
    loadData();
  };

  if (loading) return <LoadingState />;

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
      a.model.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = assets.reduce((s, a) => s + a.value, 0);

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>IT Assets & Inventory</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Hardware Tracking, Serial Registry & Allocations
            </Text>
          </View>
          <Button
            title="+ Register New Asset"
            onPress={() => setShowModal(true)}
            style={{ backgroundColor: '#0D7377' }}
          />
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Inventory</Text>
              <Text style={styles.statNumber}>{assets.length} Devices</Text>
              <Text style={styles.statSub}>Total Value: {formatCurrency(totalValue)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Deployed / In Use</Text>
              <Text style={[styles.statNumber, { color: '#0D7377' }]}>
                {assets.filter((a) => a.status === 'in_use').length}
              </Text>
              <Text style={styles.statSub}>Allocated to team</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Available in Stock</Text>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {assets.filter((a) => a.status === 'available').length}
              </Text>
              <Text style={styles.statSub}>Ready for assignment</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBox}>
            <Search size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by asset tag, model or serial..."
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Assets Grid */}
          <View style={styles.grid}>
            {filtered.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={styles.iconCircle}>
                    {item.category === 'laptop' ? <Laptop size={20} color="#0D7377" /> : <Monitor size={20} color="#0D7377" />}
                  </View>
                  <View
                    style={[
                      styles.tagBadge,
                      item.status === 'in_use' && { backgroundColor: '#D1FAE5' },
                      item.status === 'available' && { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagBadgeText,
                        item.status === 'in_use' && { color: '#059669' },
                        item.status === 'available' && { color: '#D97706' },
                      ]}
                    >
                      {item.status === 'in_use' ? 'ASSIGNED' : 'IN STOCK'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardTag}>{item.asset_tag}</Text>
                <Text style={styles.cardMeta}>Serial: {item.serial_number}</Text>
                <Text style={styles.cardMeta}>Valuation: {formatCurrency(item.value)}</Text>

                <TouchableOpacity
                  onPress={() => handleToggleStatus(item.id, item.status)}
                  style={[styles.toggleBtn, item.status === 'in_use' ? styles.toggleBtnReturn : styles.toggleBtnAssign]}
                >
                  <Text style={[styles.toggleBtnText, item.status === 'in_use' ? { color: '#DC2626' } : { color: '#0D7377' }]}>
                    {item.status === 'in_use' ? 'Return Asset' : 'Assign to Employee'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal: New Asset */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Register Hardware Asset</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Asset Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. MacBook Pro 14 M3" value={name} onChangeText={setName} />

                <Text style={styles.label}>Asset Tag ID *</Text>
                <TextInput style={styles.input} placeholder="e.g. SUB-LPT-092" value={tag} onChangeText={setTag} />

                <Text style={styles.label}>Serial Number</Text>
                <TextInput style={styles.input} placeholder="Serial number" value={serial} onChangeText={setSerial} />

                <Text style={styles.label}>Asset Value (INR)</Text>
                <TextInput style={styles.input} placeholder="e.g. 195000" keyboardType="numeric" value={value} onChangeText={setValue} />

                <Button title="Save Asset to Registry" onPress={handleCreate} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statNumber: { fontSize: 22, fontWeight: '800', marginVertical: 4 },
  statSub: { fontSize: 11, color: '#94A3B8' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    width: '31%',
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagBadgeText: { fontSize: 10, fontWeight: '800' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginTop: 12 },
  cardTag: { fontSize: 12, fontWeight: '600', color: '#0D7377', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  toggleBtn: {
    marginTop: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnAssign: { backgroundColor: '#F0F7F7' },
  toggleBtnReturn: { backgroundColor: '#FEE2E2' },
  toggleBtnText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1A1A2E', backgroundColor: '#F8FAFC' },
});
