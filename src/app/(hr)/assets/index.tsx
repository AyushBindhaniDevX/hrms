import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  useWindowDimensions,
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
  Key,
  Plus,
  QrCode,
  ShieldAlert,
  CheckCircle,
  X,
  UserCheck,
  RotateCcw,
  Wrench,
  Sparkles,
  Package,
} from 'lucide-react-native';

const CATEGORIES: { key: AssetCategory; label: string }[] = [
  { key: 'laptop', label: 'Laptops & Workstations' },
  { key: 'monitor', label: 'Displays & 4K Hubs' },
  { key: 'phone', label: 'Testing Devices' },
  { key: 'tablet', label: 'Tablets' },
  { key: 'security_token', label: 'YubiKeys & FIPS Tokens' },
  { key: 'other', label: 'Accessories & Peripherals' },
];

export default function HRAssetsScreen() {
  const colors = useTheme();
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<AssetStatus | 'all'>('all');

  // New Asset Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState<AssetCategory>('laptop');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [value, setValue] = useState('');

  // Assign Modal
  const [assignAssetId, setAssignAssetId] = useState<string | null>(null);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('emp_demo');

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

  const handleCreateAsset = async () => {
    if (!name.trim() || !tag.trim() || !serial.trim()) return;
    const numValue = parseFloat(value) || 50000;
    await createAsset({
      organization_id: 'subedge_org',
      name,
      asset_tag: tag,
      category,
      model: model || 'Standard Enterprise Edition',
      serial_number: serial,
      purchase_date: new Date().toISOString().split('T')[0],
      value: numValue,
      status: 'available',
      assigned_to_id: null,
      notes: 'New asset registered in Subedge IT hardware registry.',
    });
    setName('');
    setTag('');
    setModel('');
    setSerial('');
    setValue('');
    setShowAddModal(false);
    loadData();
  };

  const handleAssignSubmit = async () => {
    if (!assignAssetId) return;
    await updateAssetStatus(assignAssetId, 'in_use', assignedEmployeeId);
    setAssignAssetId(null);
    loadData();
  };

  const handleReturnAsset = async (assetId: string) => {
    await updateAssetStatus(assetId, 'available', null);
    loadData();
  };

  const handleMaintenance = async (assetId: string) => {
    await updateAssetStatus(assetId, 'maintenance', null);
    loadData();
  };

  if (loading) return <LoadingState />;

  const filtered = filter === 'all' ? assets : assets.filter((a) => a.status === filter);
  const totalValue = assets.reduce((s, a) => s + a.value, 0);
  const deployedCount = assets.filter((a) => a.status === 'in_use').length;
  const inStockCount = assets.filter((a) => a.status === 'available').length;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>IT Assets & Hardware Registry</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Hardware Procurement, QR Tagging, Employee Assignments & Lifecycle
            </Text>
          </View>
          <Button
            title="+ Register Asset"
            onPress={() => setShowAddModal(true)}
            style={{ backgroundColor: '#0D7377' }}
          />
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Top KPI Metrics */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Hardware Valuation</Text>
              <Text style={styles.statNumber}>{formatCurrency(totalValue)}</Text>
              <Text style={styles.statSub}>{assets.length} physical assets</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Assigned to Employees</Text>
              <Text style={[styles.statNumber, { color: '#0D7377' }]}>{deployedCount} Deployed</Text>
              <Text style={styles.statSub}>Active devices</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>In Stock / Available</Text>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{inStockCount} Units</Text>
              <Text style={styles.statSub}>Ready for onboarding</Text>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {(['all', 'in_use', 'available', 'maintenance'] as const).map((status) => {
              const active = filter === status;
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => setFilter(status)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {status.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Assets Grid */}
          <View style={styles.grid}>
            {filtered.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={styles.iconBox}>
                    {item.category === 'laptop' ? (
                      <Laptop size={22} color="#0D7377" />
                    ) : item.category === 'monitor' ? (
                      <Monitor size={22} color="#0D7377" />
                    ) : (
                      <Key size={22} color="#0D7377" />
                    )}
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'in_use' && { backgroundColor: '#D1FAE5' },
                      item.status === 'available' && { backgroundColor: '#F0F7F7' },
                      item.status === 'maintenance' && { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.status === 'in_use' && { color: '#059669' },
                        item.status === 'available' && { color: '#0D7377' },
                        item.status === 'maintenance' && { color: '#D97706' },
                      ]}
                    >
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.assetName}>{item.name}</Text>
                <View style={styles.tagRow}>
                  <View style={styles.tagBox}>
                    <Text style={styles.tagText}>{item.asset_tag}</Text>
                  </View>
                  <Text style={styles.serialText}>SN: {item.serial_number}</Text>
                </View>

                <Text style={styles.assetModel}>Model: {item.model}</Text>
                <Text style={styles.assetVal}>Valuation: {formatCurrency(item.value)}</Text>

                {item.assigned_to_id ? (
                  <View style={styles.assignedBox}>
                    <UserCheck size={14} color="#059669" />
                    <Text style={styles.assignedText}>Assigned: {item.assigned_employee_name || item.assigned_to_id}</Text>
                  </View>
                ) : (
                  <View style={[styles.assignedBox, { backgroundColor: '#F1F5F9' }]}>
                    <Package size={14} color="#64748B" />
                    <Text style={[styles.assignedText, { color: '#64748B' }]}>In Stock / Unassigned</Text>
                  </View>
                )}

                {/* Action Row */}
                <View style={styles.cardActions}>
                  {item.status === 'available' ? (
                    <TouchableOpacity
                      onPress={() => setAssignAssetId(item.id)}
                      style={styles.assignBtn}
                    >
                      <Text style={styles.btnText}>Assign to Employee</Text>
                    </TouchableOpacity>
                  ) : item.status === 'in_use' ? (
                    <TouchableOpacity
                      onPress={() => handleReturnAsset(item.id)}
                      style={styles.returnBtn}
                    >
                      <RotateCcw size={12} color="#475569" />
                      <Text style={styles.returnBtnText}>Return to Stock</Text>
                    </TouchableOpacity>
                  ) : null}

                  {item.status !== 'maintenance' && (
                    <TouchableOpacity
                      onPress={() => handleMaintenance(item.id)}
                      style={styles.maintBtn}
                    >
                      <Wrench size={12} color="#D97706" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal 1: Register Asset */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Register New Hardware Asset</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Device / Asset Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. MacBook Pro 16 M3 Max" value={name} onChangeText={setName} />

                <Text style={styles.label}>Asset Tag Number *</Text>
                <TextInput style={styles.input} placeholder="e.g. SUB-LPT-048" value={tag} onChangeText={setTag} />

                <Text style={styles.label}>Category</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setCategory(c.key)}
                      style={[styles.catBtn, category === c.key && styles.catBtnActive]}
                    >
                      <Text style={[styles.catText, category === c.key && styles.catTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Serial Number *</Text>
                <TextInput style={styles.input} placeholder="e.g. C02G99812A" value={serial} onChangeText={setSerial} />

                <Text style={styles.label}>Purchase Valuation (INR)</Text>
                <TextInput style={styles.input} placeholder="e.g. 240000" value={value} onChangeText={setValue} keyboardType="numeric" />

                <Button title="Save to IT Registry" onPress={handleCreateAsset} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal 2: Assign Asset */}
        <Modal visible={!!assignAssetId} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Assign Asset to Employee</Text>
                <TouchableOpacity onPress={() => setAssignAssetId(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 20 }}>
                <Text style={styles.label}>Select Employee Account</Text>
                <TextInput
                  style={styles.input}
                  value={assignedEmployeeId}
                  onChangeText={setAssignedEmployeeId}
                  placeholder="emp_demo or Employee ID"
                />

                <Button title="Confirm Assignment" onPress={handleAssignSubmit} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
              </View>
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
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statNumber: { fontSize: 24, fontWeight: '800', marginVertical: 4, color: '#1A1A2E' },
  statSub: { fontSize: 11, color: '#94A3B8' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#0D7377', borderColor: '#0D7377' },
  filterText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '48%', minWidth: 320, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  assetName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginTop: 12 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  tagBox: { backgroundColor: '#F0F7F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  serialText: { fontSize: 11, color: '#64748B' },
  assetModel: { fontSize: 12, color: '#475569', marginTop: 4 },
  assetVal: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginTop: 2 },
  assignedBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8, marginTop: 12 },
  assignedText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  assignBtn: { flex: 1, backgroundColor: '#0D7377', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  returnBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 8 },
  returnBtnText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  maintBtn: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1A1A2E', backgroundColor: '#F8FAFC' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  catBtnActive: { backgroundColor: '#0D7377' },
  catText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  catTextActive: { color: '#FFFFFF' },
});
