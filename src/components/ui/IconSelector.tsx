import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Modal } from './Modal';
import {
  // HR & People
  User,
  Users,
  UserCheck,
  UserPlus,
  Briefcase,
  GraduationCap,
  Award,
  HeartHandshake,
  // Time & Leave
  Calendar,
  Clock,
  Plane,
  BriefcaseMedical,
  Coffee,
  Umbrella,
  Hourglass,
  CalendarCheck,
  // Finance & Payroll
  DollarSign,
  CreditCard,
  Receipt,
  Wallet,
  Coins,
  TrendingUp,
  Percent,
  Calculator,
  // Workplaces & Assets
  Building,
  Building2,
  Laptop,
  Smartphone,
  Server,
  MapPin,
  Compass,
  Shield,
  // Status & Operations
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Bell,
  Sparkles,
  Zap,
  Target,
  FileText,
  Search,
  Check,
} from 'lucide-react-native';

export interface IconOption {
  name: string;
  label: string;
  category: 'hr' | 'time' | 'finance' | 'asset' | 'status';
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
}

export const ENTERPRISE_ICONS: IconOption[] = [
  // HR & People
  { name: 'user', label: 'Employee', category: 'hr', IconComponent: User },
  { name: 'users', label: 'Team / Dept', category: 'hr', IconComponent: Users },
  { name: 'user-check', label: 'Verified Staff', category: 'hr', IconComponent: UserCheck },
  { name: 'user-plus', label: 'Onboarding', category: 'hr', IconComponent: UserPlus },
  { name: 'briefcase', label: 'Job Role', category: 'hr', IconComponent: Briefcase },
  { name: 'graduation-cap', label: 'Training', category: 'hr', IconComponent: GraduationCap },
  { name: 'award', label: 'Appraisal / KPI', category: 'hr', IconComponent: Award },
  { name: 'heart-handshake', label: 'Relations', category: 'hr', IconComponent: HeartHandshake },

  // Time & Leave
  { name: 'calendar', label: 'Calendar', category: 'time', IconComponent: Calendar },
  { name: 'clock', label: 'Shift / Clock', category: 'time', IconComponent: Clock },
  { name: 'plane', label: 'Annual Vacation', category: 'time', IconComponent: Plane },
  { name: 'medical', label: 'Medical / Sick', category: 'time', IconComponent: BriefcaseMedical },
  { name: 'coffee', label: 'Casual / Break', category: 'time', IconComponent: Coffee },
  { name: 'umbrella', label: 'Emergency Leave', category: 'time', IconComponent: Umbrella },
  { name: 'hourglass', label: 'Overtime', category: 'time', IconComponent: Hourglass },
  { name: 'calendar-check', label: 'Public Holiday', category: 'time', IconComponent: CalendarCheck },

  // Finance & Payroll
  { name: 'dollar-sign', label: 'Salary / Pay', category: 'finance', IconComponent: DollarSign },
  { name: 'credit-card', label: 'Reimbursement', category: 'finance', IconComponent: CreditCard },
  { name: 'receipt', label: 'Tax Deductions', category: 'finance', IconComponent: Receipt },
  { name: 'wallet', label: 'Allowances', category: 'finance', IconComponent: Wallet },
  { name: 'coins', label: 'Provident Fund', category: 'finance', IconComponent: Coins },
  { name: 'trending-up', label: 'Bonus / Increment', category: 'finance', IconComponent: TrendingUp },
  { name: 'percent', label: 'TDS / Slab', category: 'finance', IconComponent: Percent },
  { name: 'calculator', label: 'Payroll Auto', category: 'finance', IconComponent: Calculator },

  // Workplaces & Assets
  { name: 'building', label: 'Headquarters', category: 'asset', IconComponent: Building },
  { name: 'building-2', label: 'Branch Office', category: 'asset', IconComponent: Building2 },
  { name: 'laptop', label: 'Work Laptop', category: 'asset', IconComponent: Laptop },
  { name: 'smartphone', label: 'Mobile Device', category: 'asset', IconComponent: Smartphone },
  { name: 'server', label: 'IT Infra', category: 'asset', IconComponent: Server },
  { name: 'map-pin', label: 'Geofence Zone', category: 'asset', IconComponent: MapPin },
  { name: 'compass', label: 'GPS Radius', category: 'asset', IconComponent: Compass },
  { name: 'shield', label: 'Biometrics Security', category: 'asset', IconComponent: Shield },

  // Status & Operations
  { name: 'check-circle', label: 'Approved', category: 'status', IconComponent: CheckCircle },
  { name: 'alert-triangle', label: 'Exception / Late', category: 'status', IconComponent: AlertTriangle },
  { name: 'help-circle', label: 'Helpdesk Ticket', category: 'status', IconComponent: HelpCircle },
  { name: 'bell', label: 'Notification', category: 'status', IconComponent: Bell },
  { name: 'sparkles', label: 'AI Appraisal', category: 'status', IconComponent: Sparkles },
  { name: 'zap', label: 'Instant Action', category: 'status', IconComponent: Zap },
  { name: 'target', label: 'OKR / Goal', category: 'status', IconComponent: Target },
  { name: 'file-text', label: 'Policy Document', category: 'status', IconComponent: FileText },
];

export const SAP_SEMANTIC_COLORS = [
  { name: 'Teal (SAP Primary)', hex: '#006a61', bgHex: '#EDF8F6' },
  { name: 'Positive (Green)', hex: '#107E3E', bgHex: '#EAF7EE' },
  { name: 'Informative (Blue)', hex: '#0064D9', bgHex: '#EBF3FE' },
  { name: 'Critical (Amber)', hex: '#DF6E0C', bgHex: '#FEF5EB' },
  { name: 'Negative (Red)', hex: '#BB0000', bgHex: '#FDECEC' },
  { name: 'Purple (Executive)', hex: '#7C3AED', bgHex: '#F5F3FF' },
  { name: 'Indigo (Operations)', hex: '#4338CA', bgHex: '#EEF2FF' },
  { name: 'Slate (Neutral)', hex: '#475569', bgHex: '#F1F5F9' },
];

interface IconSelectorProps {
  label?: string;
  selectedIconName?: string;
  selectedColor?: string;
  onSelect: (iconName: string, colorHex: string, bgHex: string) => void;
  disabled?: boolean;
}

export function IconSelector({
  label = 'Select Category Icon & Color',
  selectedIconName = 'calendar-check',
  selectedColor = '#006a61',
  onSelect,
  disabled = false,
}: IconSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [tempIcon, setTempIcon] = useState(selectedIconName);
  const [tempColor, setTempColor] = useState(selectedColor);

  const activeIconObj =
    ENTERPRISE_ICONS.find((i) => i.name === selectedIconName) ||
    ENTERPRISE_ICONS[0];
  const ActiveIconComp = activeIconObj.IconComponent;

  const activeColorObj =
    SAP_SEMANTIC_COLORS.find((c) => c.hex === selectedColor) ||
    SAP_SEMANTIC_COLORS[0];

  const filteredIcons = ENTERPRISE_ICONS.filter((item) => {
    const matchesCat =
      activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      search.trim() === '' ||
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleApply = () => {
    const chosenColor =
      SAP_SEMANTIC_COLORS.find((c) => c.hex === tempColor) ||
      SAP_SEMANTIC_COLORS[0];
    onSelect(tempIcon, chosenColor.hex, chosenColor.bgHex);
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* SAP Trigger Field */}
      <TouchableOpacity
        onPress={() => {
          if (disabled) return;
          setTempIcon(selectedIconName);
          setTempColor(selectedColor);
          setShowModal(true);
        }}
        disabled={disabled}
        activeOpacity={0.75}
        style={[
          styles.triggerBox,
          { backgroundColor: disabled ? '#F1F5F9' : '#FFFFFF' },
        ]}
      >
        <View style={styles.triggerLeft}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: activeColorObj.bgHex },
            ]}
          >
            <ActiveIconComp size={20} color={activeColorObj.hex} />
          </View>
          <View>
            <Text style={styles.triggerTitle}>{activeIconObj.label}</Text>
            <Text style={styles.triggerSub}>
              {activeColorObj.name} • {activeIconObj.name}
            </Text>
          </View>
        </View>

        <View style={styles.sapPill}>
          <Text style={styles.sapPillText}>Fiori Value Help</Text>
        </View>
      </TouchableOpacity>

      {/* Modal Palette */}
      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="SAP Fiori Icon & Color Palette"
      >
        <View style={styles.modalBody}>
          {/* Color Palette Selector */}
          <Text style={styles.sectionHeading}>1. Semantic Color Badge</Text>
          <View style={styles.colorPaletteRow}>
            {SAP_SEMANTIC_COLORS.map((c) => (
              <TouchableOpacity
                key={c.hex}
                onPress={() => setTempColor(c.hex)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c.hex },
                  tempColor === c.hex && styles.colorCircleActive,
                ]}
              >
                {tempColor === c.hex && <Check size={14} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Box */}
          <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
            2. Choose Icon
          </Text>
          <View style={styles.searchBox}>
            <Search size={15} color="#64748B" />
            <TextInput
              placeholder="Filter icons (e.g. Leave, Pay, HR)..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'hr', label: 'HR & People' },
              { id: 'time', label: 'Time & Leave' },
              { id: 'finance', label: 'Finance & Pay' },
              { id: 'asset', label: 'Assets & Space' },
              { id: 'status', label: 'Status & AI' },
            ].map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.catTab,
                  activeCategory === cat.id && styles.catTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.catTabText,
                    activeCategory === cat.id && styles.catTabTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Icon Grid */}
          <ScrollView style={styles.iconGridScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.iconGrid}>
              {filteredIcons.map((item) => {
                const IconC = item.IconComponent;
                const isSelected = tempIcon === item.name;
                const colorObj =
                  SAP_SEMANTIC_COLORS.find((c) => c.hex === tempColor) ||
                  SAP_SEMANTIC_COLORS[0];

                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => setTempIcon(item.name)}
                    style={[
                      styles.iconTile,
                      isSelected && {
                        backgroundColor: colorObj.bgHex,
                        borderColor: colorObj.hex,
                      },
                    ]}
                  >
                    <IconC
                      size={22}
                      color={isSelected ? colorObj.hex : '#475569'}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.iconTileLabel,
                        isSelected && {
                          color: colorObj.hex,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Check size={16} color="#FFF" />
              <Text style={styles.applyBtnText}>Apply Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  triggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    ...Platform.select({
      web: { boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  triggerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  sapPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sapPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },

  modalBody: {
    maxHeight: 520,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 0 0 2px #006a61' },
      default: { elevation: 3 },
    }),
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },

  categoryScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  catTabActive: {
    backgroundColor: '#006a61',
  },
  catTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  catTabTextActive: {
    color: '#FFFFFF',
  },

  iconGridScroll: {
    maxHeight: 260,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  iconTile: {
    width: '23%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 6,
  },
  iconTileLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#006a61',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
