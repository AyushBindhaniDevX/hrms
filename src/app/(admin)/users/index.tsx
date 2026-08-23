import { ADMIN_NAV } from '@/constants/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  useWindowDimensions,
  Switch,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import {
  getOrgUsers,
  updateUserRole,
  updateUserProfileData,
  toggleUserActive,
  createSystemUser,
} from '@/lib/services/organization';
import { getDepartments, getWorkplaces } from '@/lib/services/employee';
import { createAuditLog } from '@/lib/services/audit';
import { formatDate } from '@/utils/format';
import type { Profile, Department, Workplace } from '@/types';
import {
  Search,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Lock,
  Mail,
  Phone,
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Award,
} from 'lucide-react-native';

export default function UserManagementScreen() {
  const colors = useTheme();
  const { profile: currentAdmin } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'hr' | 'employee'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [toggleUser, setToggleUser] = useState<Profile | null>(null);

  // Add User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'hr' | 'employee'>('employee');
  const [createEmpRecord, setCreateEmpRecord] = useState(true);
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newDeptId, setNewDeptId] = useState<string | null>(null);
  const [newDesignation, setNewDesignation] = useState('');
  const [newWorkplaceId, setNewWorkplaceId] = useState<string | null>(null);
  const [newSalary, setNewSalary] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Edit User Form State
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'hr' | 'employee'>('employee');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Processing state for quick actions
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [userData, deptData, wpData] = await Promise.all([
        getOrgUsers(),
        getDepartments(),
        getWorkplaces(),
      ]);
      setUsers(userData);
      setDepartments(deptData);
      setWorkplaces(wpData);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openAddModal = () => {
    setNewFullName('');
    setNewEmail('');
    setNewPassword('');
    setNewPhone('');
    setNewRole('employee');
    setCreateEmpRecord(true);
    setNewEmpCode(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewDeptId(departments.length > 0 ? departments[0].id : null);
    setNewDesignation('');
    setNewWorkplaceId(workplaces.length > 0 ? workplaces[0].id : null);
    setNewSalary('50000');
    setFormError('');
    setFormSuccess(false);
    setAddModalOpen(true);
  };

  const handleCreateUser = async () => {
    if (!newFullName.trim()) {
      setFormError('Please enter a full name');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    setFormError('');
    setSavingUser(true);
    try {
      const orgId = currentAdmin?.organization_id || '00000000-0000-0000-0000-000000000001';
      const uid = await createSystemUser({
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        full_name: newFullName.trim(),
        role: newRole,
        organization_id: orgId,
        phone: newPhone.trim() || undefined,
        create_employee_record: createEmpRecord,
        employee_code: newEmpCode.trim() || undefined,
        department_id: newDeptId || undefined,
        designation: newDesignation.trim() || undefined,
        workplace_id: newWorkplaceId || undefined,
        basic_salary: parseFloat(newSalary) || 0,
      });

      await createAuditLog('user_created', 'profile', uid, {
        email: newEmail,
        role: newRole,
        created_by: currentAdmin?.id,
      });

      setFormSuccess(true);
      await load();
      setTimeout(() => {
        setAddModalOpen(false);
        setFormSuccess(false);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user. Please try again.');
    } finally {
      setSavingUser(false);
    }
  };

  const openEditModal = (u: Profile) => {
    setEditUser(u);
    setEditFullName(u.full_name || '');
    setEditPhone(u.phone || '');
    setEditRole((u.role as any) || 'employee');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    if (!editFullName.trim()) {
      setEditError('Full name cannot be empty');
      return;
    }

    setSavingEdit(true);
    setEditError('');
    try {
      await updateUserProfileData(editUser.id, {
        full_name: editFullName.trim(),
        phone: editPhone.trim() || null,
        role: editRole,
      });

      await createAuditLog('user_updated', 'profile', editUser.id, {
        old_role: editUser.role,
        new_role: editRole,
        updated_by: currentAdmin?.id,
      });

      setEditUser(null);
      await load();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user profile');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggle = async () => {
    if (!toggleUser) return;
    setProcessing(true);
    try {
      const nextActive = !toggleUser.is_active;
      await toggleUserActive(toggleUser.id, nextActive);
      await createAuditLog(
        nextActive ? 'user_activated' : 'user_deactivated',
        'profile',
        toggleUser.id,
        { toggled_by: currentAdmin?.id }
      );
      setToggleUser(null);
      await load();
    } catch (err) {
      console.error('Toggle active error:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      // Status filter
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'inactive' && u.is_active) return false;
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = u.full_name?.toLowerCase().includes(query);
        const matchesEmail = u.email?.toLowerCase().includes(query);
        const matchesRole = u.role?.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesRole;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  // Statistics
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const hrCount = users.filter((u) => u.role === 'hr').length;
  const empCount = users.filter((u) => u.role === 'employee').length;
  const activeCount = users.filter((u) => u.is_active).length;

  const getRoleBadgeVariant = (role: string): 'accentLight' | 'warningLight' | 'neutral' => {
    if (role === 'admin') return 'accentLight';
    if (role === 'hr') return 'warningLight';
    return 'neutral';
  };

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout items={ADMIN_NAV}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>User & Access Control</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage organization accounts, assign roles (Admin, HR, Employee), and activate or deactivate access.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openAddModal}
            activeOpacity={0.85}
          >
            <UserPlus size={16} color="#FFF" />
            <Text style={styles.addBtnText}>Add New User</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={isDesktop ? styles.statsGridDesktop : styles.statsGridMobile}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#edf8f6' }]}>
              <Users size={18} color="#006a61" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{users.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Accounts</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#eeebff' }]}>
              <ShieldCheck size={18} color="#4f46e5" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{adminCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Administrators</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#fef3c7' }]}>
              <Award size={18} color="#b45309" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{hrCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>HR Managers</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#e0f2fe' }]}>
              <UserCheck size={18} color="#0369a1" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Users</Text>
          </View>
        </View>

        {/* Controls: Search & Filter Tabs */}
        <View style={[styles.filterBar, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={[styles.searchBox, { borderColor: '#e2e8f0' }]}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              placeholder="Search by name, email, or role..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          {/* Role Filter Chips */}
          <View style={styles.chipRow}>
            {(['all', 'admin', 'hr', 'employee'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRoleFilter(r)}
                style={[
                  styles.filterChip,
                  roleFilter === r
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: '#f1f5f9' },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: roleFilter === r ? '#FFF' : colors.text },
                  ]}
                >
                  {r === 'all' ? 'All Roles' : r === 'hr' ? 'HR' : r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Status Filter Chips */}
          <View style={styles.chipRow}>
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[
                  styles.filterChip,
                  statusFilter === s
                    ? { backgroundColor: '#0b1c30' }
                    : { backgroundColor: '#f1f5f9' },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: statusFilter === s ? '#FFF' : colors.text },
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Users Table / Grid */}
        <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={[styles.tableHeader, { borderBottomColor: '#f1f5f9' }]}>
            <Text style={[styles.tableTitle, { color: colors.text }]}>
              User Accounts ({filteredUsers.length})
            </Text>
          </View>

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={36} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontWeight: '600', marginTop: 12 }}>
                No users found
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {search ? `No accounts match "${search}"` : 'Try changing your role or status filters.'}
              </Text>
            </View>
          ) : (
            <View style={styles.userList}>
              {filteredUsers.map((u, idx) => (
                <View
                  key={u.id}
                  style={[
                    styles.userRow,
                    idx !== filteredUsers.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: '#f1f5f9',
                    },
                  ]}
                >
                  <Avatar name={u.full_name} url={u.avatar_url} size={44} />

                  <View style={{ flex: 1, gap: 2, paddingHorizontal: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={[styles.userName, { color: colors.text }]}>{u.full_name}</Text>
                      <Badge
                        label={u.role.toUpperCase()}
                        variant={getRoleBadgeVariant(u.role)}
                      />
                      <Badge
                        label={u.is_active ? 'ACTIVE' : 'INACTIVE'}
                        variant={u.is_active ? 'successLight' : 'dangerLight'}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} color={colors.textSecondary} />
                        <Text style={[styles.userMeta, { color: colors.textSecondary }]}>{u.email}</Text>
                      </View>
                      {u.phone && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Phone size={12} color={colors.textSecondary} />
                          <Text style={[styles.userMeta, { color: colors.textSecondary }]}>{u.phone}</Text>
                        </View>
                      )}
                      {u.created_at && (
                        <Text style={[styles.userMeta, { color: colors.textSecondary }]}>
                          Added {formatDate(u.created_at)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.userActions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(u)}
                      style={[styles.actionBtn, { borderColor: '#e2e8f0', borderWidth: 1 }]}
                    >
                      <Edit2 size={14} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setToggleUser(u)}
                      style={[
                        styles.actionBtn,
                        u.is_active
                          ? { backgroundColor: '#fff5f5' }
                          : { backgroundColor: '#edf8f6' },
                      ]}
                    >
                      {u.is_active ? (
                        <>
                          <UserX size={14} color={colors.danger} />
                          <Text style={[styles.actionBtnText, { color: colors.danger }]}>Deactivate</Text>
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} color="#006a61" />
                          <Text style={[styles.actionBtnText, { color: '#006a61' }]}>Activate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Modal: Add New User ─────────────────────────────────────────── */}
        <Modal visible={addModalOpen} onClose={() => setAddModalOpen(false)} title="Create New Account">
          {formSuccess ? (
            <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={48} color="#006a61" />
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>User Created Successfully!</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                {newFullName} can now sign in using {newEmail}.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14, paddingBottom: 16 }}>
                {formError ? (
                  <View style={[styles.alertBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}>
                    <AlertCircle size={16} color={colors.danger} />
                    <Text style={{ color: colors.danger, fontSize: 13, flex: 1 }}>{formError}</Text>
                  </View>
                ) : null}

                <Input
                  label="Full Name *"
                  placeholder="e.g. Sarah Jenkins"
                  value={newFullName}
                  onChangeText={setNewFullName}
                />

                <Input
                  label="Email Address *"
                  placeholder="e.g. sarah.jenkins@company.com"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input
                  label="Initial Password *"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />

                {/* Role Selector */}
                <Select
                  label="Assign Role *"
                  options={[
                    { label: 'Employee (Standard Access)', value: 'employee' },
                    { label: 'HR Manager (Full HR & Payroll Access)', value: 'hr' },
                    { label: 'Administrator (System & Org Settings)', value: 'admin' },
                  ]}
                  value={newRole}
                  onValueChange={(val) => setNewRole(val as any)}
                />

                {/* Toggle: Also Create Employee Record */}
                <View style={[styles.switchCard, { backgroundColor: '#f8faff', borderColor: '#e2e8f0' }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                      Create Employee Profile
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      Enables attendance clock-in, leave quotas, and salary payslips.
                    </Text>
                  </View>
                  <Switch
                    value={createEmpRecord}
                    onValueChange={setCreateEmpRecord}
                    trackColor={{ true: colors.primary }}
                  />
                </View>

                {createEmpRecord && (
                  <View style={[styles.empFieldsBox, { borderColor: '#e2e8f0' }]}>
                    <Input
                      label="Employee Code"
                      placeholder="EMP-1001"
                      value={newEmpCode}
                      onChangeText={setNewEmpCode}
                    />

                    <Input
                      label="Designation / Job Title"
                      placeholder="e.g. Senior Software Engineer"
                      value={newDesignation}
                      onChangeText={setNewDesignation}
                    />

                    {departments.length > 0 && (
                      <Select
                        label="Department"
                        options={departments.map((d) => ({ label: d.name, value: d.id }))}
                        value={newDeptId}
                        onValueChange={setNewDeptId}
                      />
                    )}

                    {workplaces.length > 0 && (
                      <Select
                        label="Office Workplace"
                        options={workplaces.map((w) => ({ label: w.name, value: w.id }))}
                        value={newWorkplaceId}
                        onValueChange={setNewWorkplaceId}
                      />
                    )}

                    <Input
                      label="Basic Monthly Salary (₹)"
                      placeholder="50000"
                      value={newSalary}
                      onChangeText={setNewSalary}
                      keyboardType="numeric"
                    />
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Button
                    title="Cancel"
                    onPress={() => setAddModalOpen(false)}
                    variant="outline"
                    style={{ flex: 1, borderRadius: 8 }}
                  />
                  <Button
                    title="Create Account"
                    onPress={handleCreateUser}
                    loading={savingUser}
                    style={{ flex: 2, backgroundColor: colors.primary, borderRadius: 8 }}
                  />
                </View>
              </View>
            </ScrollView>
          )}
        </Modal>

        {/* ── Modal: Edit User ───────────────────────────────────────────── */}
        <Modal visible={!!editUser} onClose={() => setEditUser(null)} title="Edit User Profile">
          <View style={{ gap: 14 }}>
            {editError ? (
              <View style={[styles.alertBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}>
                <AlertCircle size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 13, flex: 1 }}>{editError}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name"
              value={editFullName}
              onChangeText={setEditFullName}
              placeholder="Full name"
            />

            <Input
              label="Phone Number"
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
            />

            <Select
              label="System Role"
              options={[
                { label: 'Employee (Standard Access)', value: 'employee' },
                { label: 'HR Manager (Full HR & Payroll Access)', value: 'hr' },
                { label: 'Administrator (System & Org Settings)', value: 'admin' },
              ]}
              value={editRole}
              onValueChange={(val) => setEditRole(val as any)}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setEditUser(null)}
                variant="outline"
                style={{ flex: 1, borderRadius: 8 }}
              />
              <Button
                title="Save Changes"
                onPress={handleSaveEdit}
                loading={savingEdit}
                style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8 }}
              />
            </View>
          </View>
        </Modal>

        {/* ── Dialog: Confirm Deactivation / Activation ────────────────────── */}
        <ConfirmDialog
          visible={!!toggleUser}
          title={toggleUser?.is_active ? 'Deactivate User Account?' : 'Activate User Account?'}
          message={
            toggleUser?.is_active
              ? `Are you sure you want to deactivate ${toggleUser?.full_name}? They will not be able to log in until reactivated.`
              : `Activate ${toggleUser?.full_name}'s account and restore login access?`
          }
          confirmLabel={toggleUser?.is_active ? 'Yes, Deactivate' : 'Yes, Activate'}
          onConfirm={handleToggle}
          onCancel={() => setToggleUser(null)}
          loading={processing}
          variant={toggleUser?.is_active ? 'danger' : 'primary'}
        />
      </ScrollView>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 36, gap: 28 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  statsGridDesktop: { flexDirection: 'row', gap: 16 },
  statsGridMobile: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statIconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '500' },

  filterBar: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: '600' },

  tableCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { padding: 18, borderBottomWidth: 1 },
  tableTitle: { fontSize: 16, fontWeight: '700' },

  userList: { padding: 4 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
    flexWrap: 'wrap',
  },
  userName: { fontSize: 15, fontWeight: '700' },
  userMeta: { fontSize: 12 },
  userActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },

  emptyState: { padding: 48, alignItems: 'center' },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },

  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  empFieldsBox: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#fafafa',
    gap: 12,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});
