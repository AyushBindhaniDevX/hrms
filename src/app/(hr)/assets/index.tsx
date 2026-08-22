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
import {
  getAssets,
  createAsset,
  updateAssetStatus,
  verifyAndAuditAsset,
  disposeAsset,
} from '@/lib/services/assets';
import { CompanyAsset, AssetStatus, AssetCategory } from '@/types/database';
import { formatCurrency } from '@/utils/format';
import {
  Laptop,
  Monitor,
  Key,
  Plus,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  X,
  UserCheck,
  RotateCcw,
  Wrench,
  Sparkles,
  Package,
  Scan,
  Barcode,
  Search,
  Trash2,
  ShieldCheck,
  Calendar,
  Layers,
  AlertTriangle,
} from 'lucide-react-native';

const CATEGORIES: { key: AssetCategory; label: string; prefix: string }[] = [
  { key: 'laptop', label: 'Laptops & Workstations', prefix: 'SUB-LPT' },
  { key: 'monitor', label: 'Displays & 4K Hubs', prefix: 'SUB-MON' },
  { key: 'phone', label: 'Testing Devices', prefix: 'SUB-PHN' },
  { key: 'tablet', label: 'Tablets', prefix: 'SUB-TAB' },
  { key: 'security_token', label: 'YubiKeys & FIPS Tokens', prefix: 'SUB-KEY' },
  { key: 'other', label: 'Accessories & Peripherals', prefix: 'SUB-ACC' },
];

export default function HRAssetsScreen() {
  const colors = useTheme();
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<AssetStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState<CompanyAsset | null>(null);
  const [showDisposalModal, setShowDisposalModal] = useState<CompanyAsset | null>(null);
  const [assignAssetId, setAssignAssetId] = useState<string | null>(null);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('emp_demo');

  // New Asset Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('laptop');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [value, setValue] = useState('');

  // Barcode Scanner Form
  const [scanCode, setScanCode] = useState('');
  const [scannedAsset, setScannedAsset] = useState<CompanyAsset | null>(null);
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);

  // Disposal Form
  const [salvageVal, setSalvageVal] = useState('5000');
  const [disposalReason, setDisposalReason] = useState('End of lifecycle / hardware upgrade');

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
    if (!name.trim() || !serial.trim()) return;
    const numValue = parseFloat(value) || 50000;
    const catObj = CATEGORIES.find((c) => c.key === category);
    const generatedTag = `${catObj?.prefix || 'SUB-AST'}-${Math.floor(100 + Math.random() * 900)}`;

    await createAsset({
      organization_id: 'subedge_org',
      name,
      asset_tag: generatedTag,
      category,
      model: model || 'Enterprise Standard Model',
      serial_number: serial,
      purchase_date: new Date().toISOString().split('T')[0],
      value: numValue,
      status: 'available',
      assigned_to_id: null,
      notes: 'Registered in Subedge IT hardware registry with verifiable QR barcode.',
    });

    setName('');
    setModel('');
    setSerial('');
    setValue('');
    setShowAddModal(false);
    loadData();
  };

  const handleScanLookup = (code: string) => {
    setScanCode(code);
    setAuditSuccessMsg(null);
    if (!code.trim()) {
      setScannedAsset(null);
      return;
    }
    const match = assets.find(
      (a) =>
        a.asset_tag.toLowerCase() === code.trim().toLowerCase() ||
        a.serial_number.toLowerCase() === code.trim().toLowerCase()
    );
    setScannedAsset(match || null);
  };

  const handleVerifyAudit = async () => {
    if (!scannedAsset) return;
    const res = await verifyAndAuditAsset(scannedAsset.id, 'IT Operations Lead');
    if (res) {
      setScannedAsset(res);
      setAuditSuccessMsg(`✓ Asset [${res.asset_tag}] verified and logged to IT Audit ledger.`);
      loadData();
    }
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

  const handleDisposalSubmit = async () => {
    if (!showDisposalModal) return;
    await disposeAsset(showDisposalModal.id, parseFloat(salvageVal) || 0, disposalReason);
    setShowDisposalModal(null);
    loadData();
  };

  if (loading) return <LoadingState />;

  const filtered = assets.filter((a) => {
    const matchesFilter = filter === 'all' ? true : a.status === filter;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.assigned_employee_name && a.assigned_employee_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const totalValue = assets.reduce((s, a) => s + a.value, 0);
  const deployedCount = assets.filter((a) => a.status === 'in_use').length;
  const inStockCount = assets.filter((a) => a.status === 'available').length;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.title, { color: colors.text }]}>IT Assets & Hardware Inventory</Text>
              <View style={styles.proBadge}>
                <ShieldCheck size={11} color="#0D7377" />
                <Text style={styles.proBadgeText}>BARCODE & AUDIT ENGINE</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Physical Barcode Verification, Hardware Procurement, Employee Allocation & Lifecycle
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                setScanCode('');
                setScannedAsset(null);
                setAuditSuccessMsg(null);
                setShowScannerModal(true);
              }}
              style={styles.scanActionBtn}
            >
              <Scan size={14} color="#0D7377" />
              <Text style={styles.scanActionText}>📷 Scan / Verify Barcode</Text>
            </TouchableOpacity>

            <Button
              title="+ Add New Asset"
              onPress={() => setShowAddModal(true)}
              style={{ backgroundColor: '#0D7377' }}
              size="sm"
            />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Top KPI Metrics */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Hardware Portfolio Value</Text>
              <Text style={styles.statNumber}>{formatCurrency(totalValue)}</Text>
              <Text style={styles.statSub}>{assets.length} tagged devices in registry</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active in Deployment</Text>
              <Text style={[styles.statNumber, { color: '#0D7377' }]}>{deployedCount} Deployed</Text>
              <Text style={styles.statSub}>Assigned to active workforce</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>In Stock / Available</Text>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{inStockCount} Units</Text>
              <Text style={styles.statSub}>Ready for immediate provisioning</Text>
            </View>
          </View>

          {/* Controls Bar: Search & Status Filters */}
          <View style={styles.controlsBar}>
            <View style={styles.searchBar}>
              <Search size={16} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by asset tag (SUB-LPT-042), serial number, device name, or employee..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterRow}>
              {(['all', 'in_use', 'available', 'maintenance', 'retired'] as const).map((status) => {
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

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setShowBarcodeModal(item)}
                      style={styles.qrBadge}
                    >
                      <Barcode size={12} color="#0D7377" />
                      <Text style={styles.qrBadgeText}>QR Code</Text>
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'in_use' && { backgroundColor: '#D1FAE5' },
                        item.status === 'available' && { backgroundColor: '#F0F7F7' },
                        item.status === 'maintenance' && { backgroundColor: '#FEF3C7' },
                        item.status === 'retired' && { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.status === 'in_use' && { color: '#059669' },
                          item.status === 'available' && { color: '#0D7377' },
                          item.status === 'maintenance' && { color: '#D97706' },
                          item.status === 'retired' && { color: '#DC2626' },
                        ]}
                      >
                        {item.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
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

                {item.last_audited_at && (
                  <View style={styles.auditInfoRow}>
                    <ShieldCheck size={12} color="#059669" />
                    <Text style={styles.auditInfoText}>Audited: {new Date(item.last_audited_at).toLocaleDateString()}</Text>
                  </View>
                )}

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

                {/* Card Action Row */}
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

                  {item.status !== 'maintenance' && item.status !== 'retired' && (
                    <TouchableOpacity
                      onPress={() => handleMaintenance(item.id)}
                      style={styles.maintBtn}
                    >
                      <Wrench size={13} color="#D97706" />
                    </TouchableOpacity>
                  )}

                  {item.status !== 'retired' && (
                    <TouchableOpacity
                      onPress={() => setShowDisposalModal(item)}
                      style={styles.disposeBtn}
                    >
                      <Trash2 size={13} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ======================================================== */}
        {/* MODAL 1: PHYSICAL BARCODE & QR AUDIT SCANNER */}
        {/* ======================================================== */}
        <Modal visible={showScannerModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.scannerModal}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Scan size={20} color="#0D7377" />
                  <Text style={styles.modalTitle}>Physical Asset Audit & Barcode Verifier</Text>
                </View>
                <TouchableOpacity onPress={() => setShowScannerModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 24 }}>
                {/* Visual Viewfinder Simulation */}
                <View style={styles.viewfinderBox}>
                  <View style={styles.viewfinderCornerTL} />
                  <View style={styles.viewfinderCornerTR} />
                  <View style={styles.viewfinderCornerBL} />
                  <View style={styles.viewfinderCornerBR} />
                  <Barcode size={48} color="#0D7377" />
                  <Text style={styles.viewfinderText}>Align QR / Barcode Tag inside frame</Text>
                </View>

                <Text style={styles.label}>Enter or Scan Asset Barcode Tag / Serial Number:</Text>
                <TextInput
                  style={[styles.input, { fontSize: 16, fontWeight: '700' }]}
                  placeholder="e.g. SUB-LPT-042 or C02G99812A"
                  value={scanCode}
                  onChangeText={handleScanLookup}
                  autoFocus
                />

                {/* Quick Test Barcode Buttons */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: '#64748B', alignSelf: 'center' }}>Test Scans:</Text>
                  {assets.slice(0, 3).map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => handleScanLookup(a.asset_tag)}
                      style={styles.quickTagBtn}
                    >
                      <Text style={styles.quickTagText}>{a.asset_tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Audit Match Card */}
                {scannedAsset && (
                  <View style={styles.scannedMatchCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View>
                        <Text style={styles.matchTitle}>{scannedAsset.name}</Text>
                        <Text style={styles.matchTag}>Tag: {scannedAsset.asset_tag} · SN: {scannedAsset.serial_number}</Text>
                        <Text style={styles.matchModel}>Model: {scannedAsset.model} · Value: {formatCurrency(scannedAsset.value)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#059669' }]}>
                          {scannedAsset.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.matchAssign}>
                      <UserCheck size={14} color="#0D7377" />
                      <Text style={styles.matchAssignText}>
                        Assigned To: {scannedAsset.assigned_employee_name || scannedAsset.assigned_to_id || 'In Stock'}
                      </Text>
                    </View>

                    {scannedAsset.last_audited_at && (
                      <Text style={styles.lastAuditedText}>
                        Last Verified Audit: {new Date(scannedAsset.last_audited_at).toLocaleString()} by {scannedAsset.last_auditor_name || 'IT Team'}
                      </Text>
                    )}

                    <TouchableOpacity onPress={handleVerifyAudit} style={styles.verifyAuditBtn}>
                      <CheckCircle2 size={16} color="#FFFFFF" />
                      <Text style={styles.verifyAuditBtnText}>Mark Physically Audited & Verified</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {auditSuccessMsg && (
                  <View style={styles.auditSuccessBox}>
                    <CheckCircle2 size={16} color="#059669" />
                    <Text style={styles.auditSuccessText}>{auditSuccessMsg}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL 2: PRINTABLE BARCODE & QR CODE BADGE */}
        {/* ======================================================== */}
        {showBarcodeModal && (
          <Modal visible={!!showBarcodeModal} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.barcodeModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Hardware Barcode Tag</Text>
                  <TouchableOpacity onPress={() => setShowBarcodeModal(null)}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={{ padding: 24, alignItems: 'center' }}>
                  {/* Physical Label Simulation */}
                  <View style={styles.barcodeCardSim}>
                    <Text style={styles.barcodeLabelOrg}>SUBEDGE TECHNOLOGY PVT LTD</Text>
                    <Text style={styles.barcodeLabelDept}>PROPERTY OF IT ASSET OPERATIONS</Text>

                    {/* Barcode Graphic Simulation */}
                    <View style={styles.barcodeBars}>
                      <View style={{ width: 4, height: 50, backgroundColor: '#000' }} />
                      <View style={{ width: 2, height: 50, backgroundColor: '#000' }} />
                      <View style={{ width: 6, height: 50, backgroundColor: '#000' }} />
                      <View style={{ width: 3, height: 50, backgroundColor: '#000' }} />
                      <View style={{ width: 5, height: 50, backgroundColor: '#000' }} />
                      <View style={{ width: 2, height: 50, backgroundColor: '#000' }} />
                      <View style={{ width: 7, height: 50, backgroundColor: '#000' }} />
                      <View style={{ width: 4, height: 50, backgroundColor: '#000' }} />
                      <View style={{ width: 2, height: 50, backgroundColor: '#000' }} />
                      <View style={{ width: 5, height: 50, backgroundColor: '#000' }} />
                    </View>

                    <Text style={styles.barcodeLabelTag}>{showBarcodeModal.asset_tag}</Text>
                    <Text style={styles.barcodeLabelSn}>SN: {showBarcodeModal.serial_number}</Text>
                    <Text style={styles.barcodeLabelName}>{showBarcodeModal.name}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      alert(`✓ Barcode label for ${showBarcodeModal.asset_tag} sent to thermal sticker printer.`);
                      setShowBarcodeModal(null);
                    }}
                    style={styles.printBtn}
                  >
                    <Barcode size={16} color="#FFFFFF" />
                    <Text style={styles.printBtnText}>Print Thermal Asset Sticker</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* ======================================================== */}
        {/* MODAL 3: REGISTER NEW ASSET */}
        {/* ======================================================== */}
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

                <Text style={styles.label}>Asset Category</Text>
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

                <Text style={styles.label}>Model & Specifications</Text>
                <TextInput style={styles.input} placeholder="e.g. 64GB RAM / 1TB SSD" value={model} onChangeText={setModel} />

                <Text style={styles.label}>Hardware Serial Number (SN) *</Text>
                <TextInput style={styles.input} placeholder="e.g. C02G99812A" value={serial} onChangeText={setSerial} />

                <Text style={styles.label}>Purchase Valuation (INR)</Text>
                <TextInput style={styles.input} placeholder="e.g. 240000" value={value} onChangeText={setValue} keyboardType="numeric" />

                <Button title="Register Asset & Generate Barcode Tag" onPress={handleCreateAsset} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL 4: ASSIGN ASSET */}
        {/* ======================================================== */}
        <Modal visible={!!assignAssetId} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Assign Hardware to Employee</Text>
                <TouchableOpacity onPress={() => setAssignAssetId(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 20 }}>
                <Text style={styles.label}>Employee Account / Code</Text>
                <TextInput
                  style={styles.input}
                  value={assignedEmployeeId}
                  onChangeText={setAssignedEmployeeId}
                  placeholder="e.g. emp_demo or SUB-EMP-104"
                />

                <Button title="Confirm Deployment & Issue Receipt" onPress={handleAssignSubmit} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
              </View>
            </View>
          </View>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL 5: DISPOSAL / RETIREMENT */}
        {/* ======================================================== */}
        {showDisposalModal && (
          <Modal visible={!!showDisposalModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Retire / Dispose Asset</Text>
                  <TouchableOpacity onPress={() => setShowDisposalModal(null)}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={{ padding: 20 }}>
                  <Text style={styles.label}>Asset: {showDisposalModal.name} ({showDisposalModal.asset_tag})</Text>

                  <Text style={styles.label}>Salvage / Scrap Recovery Value (INR)</Text>
                  <TextInput style={styles.input} value={salvageVal} onChangeText={setSalvageVal} keyboardType="numeric" />

                  <Text style={styles.label}>Disposal Reason</Text>
                  <TextInput style={styles.input} value={disposalReason} onChangeText={setDisposalReason} />

                  <Button title="Confirm Asset Retirement" onPress={handleDisposalSubmit} style={{ backgroundColor: '#DC2626', marginTop: 16 }} />
                </View>
              </View>
            </View>
          </Modal>
        )}
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
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F7F7', borderWidth: 1, borderColor: '#CCECEC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { color: '#0D7377', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  scanActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F7F7', borderWidth: 1, borderColor: '#CCECEC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  scanActionText: { color: '#0D7377', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statNumber: { fontSize: 24, fontWeight: '800', marginVertical: 4, color: '#1A1A2E' },
  statSub: { fontSize: 11, color: '#94A3B8' },
  controlsBar: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, gap: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#1A1A2E' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  filterChipActive: { backgroundColor: '#0D7377' },
  filterText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '48%', minWidth: 320, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  qrBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F7F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#CCECEC' },
  qrBadgeText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  assetName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginTop: 12 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  tagBox: { backgroundColor: '#F0F7F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  serialText: { fontSize: 11, color: '#64748B' },
  assetModel: { fontSize: 12, color: '#475569', marginTop: 4 },
  assetVal: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginTop: 2 },
  auditInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  auditInfoText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  assignedBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8, marginTop: 10 },
  assignedText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  assignBtn: { flex: 1, backgroundColor: '#0D7377', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  returnBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 8 },
  returnBtnText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  maintBtn: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  disposeBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  scannerModal: { width: '100%', maxWidth: 580, maxHeight: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
  barcodeModal: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  viewfinderBox: { height: 140, backgroundColor: '#F0F7F7', borderRadius: 14, borderWidth: 2, borderColor: '#0D7377', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' },
  viewfinderCornerTL: { position: 'absolute', top: 8, left: 8, width: 14, height: 14, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#0D7377' },
  viewfinderCornerTR: { position: 'absolute', top: 8, right: 8, width: 14, height: 14, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#0D7377' },
  viewfinderCornerBL: { position: 'absolute', bottom: 8, left: 8, width: 14, height: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#0D7377' },
  viewfinderCornerBR: { position: 'absolute', bottom: 8, right: 8, width: 14, height: 14, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#0D7377' },
  viewfinderText: { fontSize: 12, color: '#0D7377', fontWeight: '700', marginTop: 8 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1A1A2E', backgroundColor: '#F8FAFC' },
  quickTagBtn: { backgroundColor: '#F0F7F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  quickTagText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  scannedMatchCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16 },
  matchTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  matchTag: { fontSize: 12, fontWeight: '700', color: '#0D7377', marginTop: 2 },
  matchModel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  matchAssign: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  matchAssignText: { fontSize: 12, fontWeight: '700', color: '#0D7377' },
  lastAuditedText: { fontSize: 11, color: '#64748B', marginTop: 4 },
  verifyAuditBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0D7377', paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  verifyAuditBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  auditSuccessBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8, marginTop: 12 },
  auditSuccessText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  barcodeCardSim: { width: '100%', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000', borderRadius: 8, padding: 16, alignItems: 'center' },
  barcodeLabelOrg: { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  barcodeLabelDept: { fontSize: 9, fontWeight: '700', color: '#666', marginBottom: 10 },
  barcodeBars: { flexDirection: 'row', gap: 6, alignItems: 'center', marginVertical: 8 },
  barcodeLabelTag: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 2, marginTop: 4 },
  barcodeLabelSn: { fontSize: 10, fontWeight: '700', color: '#444', marginTop: 2 },
  barcodeLabelName: { fontSize: 11, fontWeight: '600', color: '#666', marginTop: 2 },
  printBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0D7377', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  printBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  catBtnActive: { backgroundColor: '#0D7377' },
  catText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  catTextActive: { color: '#FFFFFF' },
});
