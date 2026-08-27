import { ADMIN_NAV } from '@/constants/navigation';
import { useRouter } from 'expo-router';
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
import { useTenant } from '@/context/TenantContext';
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
  deleteUserRecord,
} from '@/lib/services/organization';
import { resetPassword } from '@/lib/auth';
import { getDepartments, getWorkplaces, getEmployees, updateEmployee } from '@/lib/services/employee';
import { getShifts } from '@/lib/services/shifts';
import { createAuditLog } from '@/lib/services/audit';
import { formatDate } from '@/utils/format';
import type { Profile, Department, Workplace, WorkShift, Employee } from '@/types';
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
  Trash2,
  KeyRound,
  RotateCcw,
  RefreshCw,
} from 'lucide-react-native';

export default function UserManagementScreen() {
  const colors = useTheme();
  const { profile: currentAdmin } = useAuth();
  const { organization: tenantOrg } = useTenant();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
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
  const [deleteUser, setDeleteUser] = useState<Profile | null>(null);
  const [infoBanner, setInfoBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'hr' | 'employee'>('employee');
  const [createEmpRecord, setCreateEmpRecord] = useState(true);
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newDeptId, setNewDeptId] = useState<string | null>(null);
  const [newDesignation, setNewDesignation] = useState('');
  const [newWorkplaceId, setNewWorkplaceId] = useState<string | null>(null);
  const [newShiftId, setNewShiftId] = useState<string | null>(null);
  const [newManagerId, setNewManagerId] = useState<string | null>(null);
  const [newSalary, setNewSalary] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Edit User Form State
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'hr' | 'employee'>('employee');
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [editEmpCode, setEditEmpCode] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [editWorkplaceId, setEditWorkplaceId] = useState<string | null>(null);
  const [editShiftId, setEditShiftId] = useState<string | null>(null);
  const [editManagerId, setEditManagerId] = useState<string | null>(null);
  const [editSalary, setEditSalary] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Processing state for quick actions
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      const orgId = tenantOrg?.id || currentAdmin?.organization_id || '00000000-0000-0000-0000-000000000001';
      const [userData, deptData, wpData, shiftData, empData] = await Promise.all([
        getOrgUsers(orgId),
        getDepartments(orgId),
        getWorkplaces(orgId),
        getShifts(orgId),
        getEmployees({ organization_id: orgId }),
      ]);
      setUsers(userData);
      setDepartments(deptData);
      setWorkplaces(wpData);
      setShifts(shiftData || []);
      setManagers(empData || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentAdmin, tenantOrg]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const tenantDomain = (tenantOrg?.settings as any)?.domain || (typeof window !== 'undefined' && window.location.hostname.includes('shanti') ? 'shantimemorialhospital.com' : 'subedge.com');

  const generateRandomCode = () => {
    const prefix = tenantDomain.includes('shanti') ? 'SMH' : 'EMP';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomDigits}`;
  };

  const openAddModal = () => {
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('employee');
    setCreateEmpRecord(true);
    setNewEmpCode(generateRandomCode());
    setNewDeptId(departments.length > 0 ? departments[0].id : null);
    setNewDesignation('');
    setNewWorkplaceId(workplaces.length > 0 ? workplaces[0].id : null);
    setNewShiftId(null);
    setNewManagerId(null);
    setNewSalary('50000');
    setFormError('');
    setFormSuccess(false);
    setAddModalOpen(true);
  };

  const handleFullNameChange = (name: string) => {
    setNewFullName(name);
    const words = name.trim().split(/\s+/);
    const cleanWords = words.filter((w) => !/^(dr|mr|mrs|ms|prof)\.?$/i.test(w));
    const mainName = cleanWords[0] || words[0] || '';
    const usernamePrefix = mainName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (usernamePrefix) {
      setNewEmail(usernamePrefix);
    }
  };

  const handleDeptChange = (val: string | null) => {
    setNewDeptId(val);
    if (val) {
      const dept = departments.find(d => d.id === val);
      if (dept && dept.manager_id) {
        setNewManagerId(dept.manager_id);
      }
    }
  };

  const handleCreateUser = async () => {
    if (!newFullName.trim()) {
      setFormError('Please enter a full name');
      return;
    }
    if (!newEmail.trim()) {
      setFormError('Please enter a username');
      return;
    }
    if (!newPhone || newPhone.length < 6) {
      setFormError('Phone number is required and must be at least 6 characters (used as default password)');
      return;
    }

    setFormError('');
    setSavingUser(true);
    try {
      const orgId = tenantOrg?.id || currentAdmin?.organization_id || '00000000-0000-0000-0000-000000000001';
      const fullEmail = newEmail.includes('@') ? newEmail.trim().toLowerCase() : `${newEmail.trim().toLowerCase()}@${tenantDomain}`;

      const uid = await createSystemUser({
        email: fullEmail,
        password: newPhone.trim(),
        full_name: newFullName.trim(),
        role: newRole,
        organization_id: orgId,
        phone: newPhone.trim(),
        create_employee_record: createEmpRecord,
        employee_code: newEmpCode.trim() || undefined,
        department_id: newDeptId || undefined,
        designation: newDesignation.trim() || undefined,
        workplace_id: newWorkplaceId || undefined,
        default_shift_id: newShiftId || undefined,
        manager_id: newManagerId || undefined,
        basic_salary: parseFloat(newSalary) || 0,
      });

      await createAuditLog('user_created', 'profile', uid, {
        email: fullEmail,
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

  const openEditModal = async (u: Profile) => {
    setEditUser(u);
    setEditFullName(u.full_name || '');
    setEditPhone(u.phone || '');
    setEditRole((u.role as any) || 'employee');
    setEditError('');

    // Fetch linked employee record if any
    try {
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('profile_id', u.id)
        .maybeSingle();

      if (empData) {
        setEditEmpId(empData.id);
        setEditEmpCode(empData.employee_code || '');
        setEditDesignation(empData.designation || '');
        setEditDeptId(empData.department_id || null);
        setEditWorkplaceId(empData.workplace_id || null);
        setEditShiftId((empData as any).default_shift_id || null);
        setEditManagerId(empData.manager_id || null);
        setEditSalary(empData.basic_salary ? String(empData.basic_salary) : '0');
        setEditStatus(empData.employment_status || 'active');
      } else {
        setEditEmpId(null);
        setEditEmpCode('');
        setEditDesignation('');
        setEditDeptId(null);
        setEditWorkplaceId(null);
        setEditShiftId(null);
        setEditManagerId(null);
        setEditSalary('');
        setEditStatus('active');
      }
    } catch (e) {
      console.warn('Could not fetch linked employee for user edit:', e);
    }
  };

  const handleDeptChangeEdit = (val: string | null) => {
    setEditDeptId(val);
    if (val) {
      const dept = departments.find(d => d.id === val);
      if (dept && dept.manager_id) {
        setEditManagerId(dept.manager_id);
      }
    }
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
      // 1. Update Profile
      await updateUserProfileData(editUser.id, {
        full_name: editFullName.trim(),
        phone: editPhone.trim() || null,
        role: editRole,
      });

      // 2. Update linked Employee if exists
      if (editEmpId) {
        await updateEmployee(editEmpId, {
          employee_code: editEmpCode.trim() || undefined,
          designation: editDesignation.trim() || null,
          department_id: editDeptId || null,
          workplace_id: editWorkplaceId || null,
          default_shift_id: editShiftId || null,
          manager_id: editManagerId || null,
          basic_salary: parseFloat(editSalary) || 0,
          employment_status: editStatus as any,
        });

        // 3. Link shift roster
        if (editShiftId && editUser.organization_id) {
          try {
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('employee_shifts').upsert({
              id: `${editEmpId}_${today}`,
              employee_id: editEmpId,
              date: today,
              shift_id: editShiftId,
              organization_id: editUser.organization_id,
              created_at: new Date().toISOString(),
            });
          } catch (sErr) {}
        }
      }

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
      setInfoBanner({
        type: 'success',
        message: `${toggleUser.full_name}'s account was ${nextActive ? 'activated' : 'deactivated'}.`,
      });
      setTimeout(() => setInfoBanner(null), 4000);
      await load();
    } catch (err) {
      console.error('Toggle active error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setProcessing(true);
    try {
      await deleteUserRecord(deleteUser.id);
      await createAuditLog('user_deleted', 'profile', deleteUser.id, {
        deleted_email: deleteUser.email,
        deleted_name: deleteUser.full_name,
        deleted_by: currentAdmin?.id,
      });
      setDeleteUser(null);
      setInfoBanner({
        type: 'success',
        message: `Account for ${deleteUser.full_name} (${deleteUser.email}) has been deleted.`,
      });
      setTimeout(() => setInfoBanner(null), 4000);
      await load();
    } catch (err: any) {
      console.error('Delete user error:', err);
      setInfoBanner({
        type: 'error',
        message: err.message || 'Failed to delete user account.',
      });
      setTimeout(() => setInfoBanner(null), 5000);
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    try {
      await resetPassword(userEmail);
      setInfoBanner({
        type: 'success',
        message: `Password reset email sent to ${userEmail}.`,
      });
      setTimeout(() => setInfoBanner(null), 4000);
    } catch (err: any) {
      setInfoBanner({
        type: 'error',
        message: err.message || `Failed to send password reset email to ${userEmail}.`,
      });
      setTimeout(() => setInfoBanner(null), 5000);
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

  const pkg = tenantOrg?.package_type?.toLowerCase() || 'basic';
  const limit = pkg === 'gold' ? 250 : pkg === 'silver' ? 100 : 50;
  const isLimitReached = activeCount >= limit;

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
            <Text style={[styles.title, { color: colors.text }]}>Users & Employees</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage organization accounts, roles, and employee records.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
              <Badge label={`${pkg.toUpperCase()} PACKAGE`} variant={pkg === 'gold' ? 'warning' : 'neutral'} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: isLimitReached ? colors.danger : colors.textSecondary }}>
                {activeCount} / {limit} Users active ({Math.max(0, limit - activeCount)} left)
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: isLimitReached ? colors.border : colors.primary }]}
            onPress={openAddModal}
            activeOpacity={0.85}
            disabled={isLimitReached}
          >
            <UserPlus size={16} color="#FFF" />
            <Text style={styles.addBtnText}>{isLimitReached ? 'Limit Reached' : 'Add New User'}</Text>
          </TouchableOpacity>
        </View>

        {infoBanner && (
          <View
            style={[
              styles.alertBox,
              infoBanner.type === 'success'
                ? { backgroundColor: '#edf8f6', borderColor: '#c4ece7' }
                : { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' },
            ]}
          >
            {infoBanner.type === 'success' ? (
              <CheckCircle2 size={18} color="#006a61" />
            ) : (
              <AlertCircle size={18} color={colors.danger} />
            )}
            <Text
              style={{
                color: infoBanner.type === 'success' ? '#006a61' : colors.danger,
                fontWeight: '600',
                fontSize: 13,
                flex: 1,
              }}
            >
              {infoBanner.message}
            </Text>
          </View>
        )}

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
                      onPress={() => handleResetPassword(u.email)}
                      style={[styles.actionBtn, { borderColor: '#e2e8f0', borderWidth: 1 }]}
                    >
                      <KeyRound size={14} color="#64748B" />
                      <Text style={[styles.actionBtnText, { color: '#64748B' }]}>Reset Pwd</Text>
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

                    <TouchableOpacity
                      onPress={() => setDeleteUser(u)}
                      style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
                    >
                      <Trash2 size={14} color={colors.danger} />
                      <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
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
                  onChangeText={handleFullNameChange}
                />

                <Input
                  label="Work Username (Login ID) *"
                  placeholder="e.g. sarah"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  autoCapitalize="none"
                  rightElement={
                    <View style={{
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#F1F5F9',
                      borderLeftWidth: 1,
                      borderLeftColor: '#CBD5E1',
                      alignSelf: 'stretch',
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>@{tenantDomain}</Text>
                    </View>
                  }
                />

                <Input
                  label="Phone Number (used as default password) *"
                  placeholder="+91 98765 43210"
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
                      label="Employee Code *"
                      value={newEmpCode}
                      onChangeText={setNewEmpCode}
                      rightElement={
                        <TouchableOpacity
                          onPress={() => setNewEmpCode(generateRandomCode())}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 10,
                            backgroundColor: '#E6F4F4',
                            borderLeftWidth: 1,
                            borderLeftColor: '#CBD5E1',
                            alignSelf: 'stretch',
                            justifyContent: 'center',
                          }}
                          activeOpacity={0.7}
                        >
                          <RefreshCw size={13} color="#0D7377" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0D7377' }}>Random</Text>
                        </TouchableOpacity>
                      }
                    />

                    <Input
                      label="Designation / Job Title"
                      placeholder="e.g. Senior Software Engineer"
                      value={newDesignation}
                      onChangeText={setNewDesignation}
                    />

                    <Select
                      label="Department"
                      options={departments.map((d) => ({ label: d.name, value: d.id }))}
                      value={newDeptId}
                      onValueChange={handleDeptChange}
                    />

                    <Select
                      label="Primary Workplace (Location)"
                      options={workplaces.map((w) => ({ label: w.name, value: w.id }))}
                      value={newWorkplaceId}
                      onValueChange={setNewWorkplaceId}
                    />

                    <Select
                      label="Reporting Manager"
                      options={managers.map((m) => ({ label: m.profile?.full_name || m.employee_code || 'Unknown', value: m.id }))}
                      value={newManagerId}
                      onValueChange={setNewManagerId}
                    />

                    <Select
                      label="Default Shift (For Attendance)"
                      placeholder="Select a shift..."
                      options={shifts.map((s) => ({ label: `${s.name} (${s.start_time} - ${s.end_time})`, value: s.id }))}
                      value={newShiftId || ''}
                      onValueChange={(val) => setNewShiftId(val || null)}
                    />

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

        {/* ── Modal: Edit User & Employee ─────────────────────────────────── */}
        <Modal visible={!!editUser} onClose={() => setEditUser(null)} title="Edit User & Employee Profile">
          <ScrollView style={{ maxHeight: 520, paddingRight: 4 }}>
            <View style={{ gap: 14 }}>
              {editError ? (
                <View style={[styles.alertBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}>
                  <AlertCircle size={16} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 13, flex: 1 }}>{editError}</Text>
                </View>
              ) : null}

              <Text style={[styles.formSubHeader, { color: colors.textSecondary }]}>Account & Profile</Text>

              <Input
                label="Full Name *"
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Full name"
              />

              <Input
                label="Phone Number"
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+91 98765 43210"
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

              {editEmpId ? (
                <View style={{ gap: 14, marginTop: 6 }}>
                  <Text style={[styles.formSubHeader, { color: colors.textSecondary }]}>Employee & Job Assignment</Text>

                  <Input
                    label="Employee Code"
                    value={editEmpCode}
                    onChangeText={setEditEmpCode}
                    placeholder="e.g. EMP-1001"
                  />

                  <Input
                    label="Designation / Job Title"
                    value={editDesignation}
                    onChangeText={setEditDesignation}
                    placeholder="e.g. Senior Software Engineer"
                  />

                  <Select
                    label="Department"
                    options={[
                      { label: 'None / Unassigned', value: '' },
                      ...departments.map((d) => ({ label: d.name, value: d.id })),
                    ]}
                    value={editDeptId}
                    onValueChange={handleDeptChangeEdit}
                  />

                  <Select
                    label="Primary Workplace (Location)"
                    options={[
                      { label: 'None / Unassigned', value: '' },
                      ...workplaces.map((w) => ({ label: w.name, value: w.id })),
                    ]}
                    value={editWorkplaceId}
                    onValueChange={setEditWorkplaceId}
                  />

                  <Select
                    label="Reporting Manager"
                    options={[
                      { label: 'None / Top Level', value: '' },
                      ...managers
                        .filter(m => m.profile_id !== editUser?.id)
                        .map((m) => ({
                          label: m.profile?.full_name || m.employee_code || 'Unknown',
                          value: m.id,
                        })),
                    ]}
                    value={editManagerId}
                    onValueChange={setEditManagerId}
                  />

                  <Select
                    label="Default Shift (For Attendance)"
                    options={[
                      { label: 'Standard / Unset', value: '' },
                      ...shifts.map((s) => ({
                        label: `${s.name} (${s.start_time} - ${s.end_time})`,
                        value: s.id,
                      })),
                    ]}
                    value={editShiftId || ''}
                    onValueChange={(val) => setEditShiftId(val || null)}
                  />

                  <Input
                    label="Basic Monthly Salary (₹)"
                    value={editSalary}
                    onChangeText={setEditSalary}
                    placeholder="50000"
                    keyboardType="numeric"
                  />

                  <Select
                    label="Employment Status"
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'On Leave', value: 'on_leave' },
                      { label: 'Suspended', value: 'suspended' },
                      { label: 'Terminated', value: 'terminated' },
                    ]}
                    value={editStatus}
                    onValueChange={(val) => setEditStatus(val || 'active')}
                  />
                </View>
              ) : null}

              <View style={[styles.modalActions, { marginTop: 16, marginBottom: 12 }]}>
                <Button
                  title="Cancel"
                  onPress={() => setEditUser(null)}
                  variant="outline"
                  style={{ flex: 1, borderRadius: 8 }}
                />
                <Button
                  title={savingEdit ? 'Saving...' : 'Save Changes'}
                  onPress={handleSaveEdit}
                  loading={savingEdit}
                  style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8 }}
                />
              </View>
            </View>
          </ScrollView>
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

        {/* ── Dialog: Confirm Permanent Account Deletion ──────────────────── */}
        <ConfirmDialog
          visible={!!deleteUser}
          title="Permanently Delete User Account?"
          message={`Are you sure you want to permanently delete ${deleteUser?.full_name} (${deleteUser?.email})? This action removes their access and linked employee profile records permanently.`}
          confirmLabel="Yes, Delete Account"
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteUser(null)}
          loading={processing}
          variant="danger"
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
