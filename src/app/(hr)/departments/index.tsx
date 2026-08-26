import { HR_NAV, ADMIN_NAV } from '@/constants/navigation';
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
  Platform,
  ActivityIndicator,
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
  getDepartmentsWithStats,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllEmployees,
  updateEmployee,
  updateReportingManager,
  getOrgHierarchy,
  getWorkplaces,
} from '@/lib/services/employee';
import { updateUserRole, getOrgUsers } from '@/lib/services/organization';
import { createAuditLog } from '@/lib/services/audit';
import type { Department, Employee, Workplace, Profile } from '@/types';
import {
  Building2,
  Network,
  Users,
  MapPin,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  GitFork,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
  MoveRight,
  Lock,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type StudioMode = 'departments' | 'workplaces' | 'roles' | 'org-chart';

export default function DepartmentsAndHierarchyScreen() {
  const colors = useTheme();
  const { profile, role } = useAuth();
  const { organization: tenantOrg } = useTenant();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const navItems = role === 'admin' ? ADMIN_NAV : HR_NAV;

  // Active Studio Mode: 'departments' | 'workplaces' | 'roles' | 'org-chart'
  const [activeMode, setActiveMode] = useState<StudioMode>('departments');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedEmpId, setDraggedEmpId] = useState<string | null>(null);
  const [dropTargetColId, setDropTargetColId] = useState<string | null>(null);

  // Modals state
  const [createDeptModalOpen, setCreateDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newDeptManagerId, setNewDeptManagerId] = useState<string | null>(null);
  const [savingDept, setSavingDept] = useState(false);
  const [deptFormError, setDeptFormError] = useState('');

  const [createWpModalOpen, setCreateWpModalOpen] = useState(false);
  const [newWpName, setNewWpName] = useState('');
  const [newWpAddress, setNewWpAddress] = useState('');
  const [newWpLat, setNewWpLat] = useState('12.9716');
  const [newWpLng, setNewWpLng] = useState('77.5946');
  const [newWpRadius, setNewWpRadius] = useState('150');
  const [savingWp, setSavingWp] = useState(false);
  const [wpFormError, setWpFormError] = useState('');

  const [editRoleUser, setEditRoleUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'hr' | 'employee'>('employee');
  const [savingRole, setSavingRole] = useState(false);
  const [roleFormError, setRoleFormError] = useState('');

  const [editReportingEmp, setEditReportingEmp] = useState<Employee | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [selectedMgrId, setSelectedMgrId] = useState<string | null>(null);
  const [savingReporting, setSavingReporting] = useState(false);
  const [reportingError, setReportingError] = useState('');
  const [assignManagerModalOpen, setAssignManagerModalOpen] = useState(false);
  const [quickMoveModalEmp, setQuickMoveModalEmp] = useState<Employee | null>(null);
  const [formError, setFormError] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptManagerId, setDeptManagerId] = useState<string | null>(null);
  const [editDept, setEditDept] = useState<Department | null>(null);

  // Collapsed branches in Org Chart
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const orgId = tenantOrg?.id || profile?.organization_id || '00000000-0000-0000-0000-000000000001';
      const [deptData, wpData, empData, profData] = await Promise.all([
        getDepartmentsWithStats(orgId),
        getWorkplaces(orgId),
        getOrgHierarchy(orgId),
        getOrgUsers(orgId),
      ]);
      setDepartments(deptData);
      setWorkplaces(wpData);
      setEmployees(empData);
      setProfiles(profData);
    } catch (err) {
      console.error('Error loading organization studio:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, tenantOrg]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ── Drag & Drop Handlers ──────────────────────────────────────────────────
  const handleDragStart = (e: any, empId: string) => {
    if (e && e.dataTransfer) {
      e.dataTransfer.setData('text/plain', empId);
      e.dataTransfer.effectAllowed = 'move';
    }
    setDraggedEmpId(empId);
  };

  const handleDragOver = (e: any, columnId: string) => {
    if (Platform.OS === 'web' && e) {
      if (e.preventDefault) e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (dropTargetColId !== columnId) {
        setDropTargetColId(columnId);
      }
    }
  };

  const handleDragLeave = (e: any) => {
    if (Platform.OS === 'web' && e && e.preventDefault) e.preventDefault();
    setDropTargetColId(null);
  };

  const handleDrop = async (e: any, targetColId: string) => {
    if (Platform.OS === 'web' && e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    const empId = (e?.dataTransfer ? e.dataTransfer.getData('text/plain') : null) || draggedEmpId;
    if (!empId) return;

    const emp = employees.find((x) => x.id === empId);
    if (!emp) return;

    setActionLoadingId(empId);
    try {
      if (activeMode === 'departments') {
        const targetDeptId = targetColId === 'unassigned' ? null : targetColId;
        if (emp.department_id !== targetDeptId) {
          await updateEmployee(emp.id, { department_id: targetDeptId || undefined });
          await createAuditLog('employee_department_reassigned', 'employee', emp.id, {
            department_id: targetDeptId,
            reassigned_by: profile?.id,
          });
        }
      } else if (activeMode === 'workplaces') {
        const targetWpId = targetColId === 'unassigned' ? null : targetColId;
        if (emp.workplace_id !== targetWpId) {
          await updateEmployee(emp.id, { workplace_id: targetWpId || undefined });
          await createAuditLog('employee_workplace_reassigned', 'employee', emp.id, {
            workplace_id: targetWpId,
            reassigned_by: profile?.id,
          });
        }
      } else if (activeMode === 'roles') {
        const targetRole = targetColId as 'admin' | 'hr' | 'employee';
        if (emp.profile?.id && emp.profile.role !== targetRole) {
          await updateUserRole(emp.profile.id, targetRole);
          await createAuditLog('user_role_drag_reassigned', 'profile', emp.profile.id, {
            new_role: targetRole,
            reassigned_by: profile?.id,
          });
        }
      }
      await load();
    } catch (err) {
      console.error('Drag and drop error:', err);
    } finally {
      setDraggedEmpId(null);
      setDropTargetColId(null);
      setActionLoadingId(null);
    }
  };

  // ── Quick Move (Mobile fallback) ──────────────────────────────────────────
  const handleQuickMove = async (targetId: string) => {
    if (!quickMoveModalEmp) return;
    setActionLoadingId(quickMoveModalEmp.id);
    try {
      if (activeMode === 'departments') {
        const deptId = targetId === 'unassigned' ? null : targetId;
        await updateEmployee(quickMoveModalEmp.id, { department_id: deptId || undefined });
      } else if (activeMode === 'workplaces') {
        const wpId = targetId === 'unassigned' ? null : targetId;
        await updateEmployee(quickMoveModalEmp.id, { workplace_id: wpId || undefined });
      } else if (activeMode === 'roles') {
        if (quickMoveModalEmp.profile?.id) {
          await updateUserRole(quickMoveModalEmp.profile.id, targetId);
        }
      }
      setQuickMoveModalEmp(null);
      await load();
    } catch (err) {
      console.error('Quick move error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Dept CRUD Handlers ────────────────────────────────────────────────────
  const openCreateModal = () => {
    setDeptName('');
    setDeptDesc('');
    setDeptManagerId(null);
    setFormError('');
    setCreateDeptModalOpen(true);
  };

  const handleCreateDept = async () => {
    if (!deptName.trim()) {
      setFormError('Department name is required');
      return;
    }
    setSavingDept(true);
    setFormError('');
    try {
      const orgId = profile?.organization_id || '00000000-0000-0000-0000-000000000001';
      const newDept = await createDepartment({
        organization_id: orgId,
        name: deptName.trim(),
        description: deptDesc.trim() || undefined,
        manager_id: deptManagerId,
      });

      await createAuditLog('department_created', 'department', newDept.id, {
        name: deptName.trim(),
        created_by: profile?.id,
      });

      setCreateDeptModalOpen(false);
      await load();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create department');
    } finally {
      setSavingDept(false);
    }
  };

  const openEditModal = (d: Department) => {
    setEditDept(d);
    setDeptName(d.name);
    setDeptDesc(d.description || '');
    setDeptManagerId(d.manager_id || null);
    setFormError('');
  };

  const handleSaveEditDept = async () => {
    if (!editDept) return;
    if (!deptName.trim()) {
      setFormError('Department name is required');
      return;
    }
    setSavingDept(true);
    setFormError('');
    try {
      await updateDepartment(editDept.id, {
        name: deptName.trim(),
        description: deptDesc.trim() || null,
        manager_id: deptManagerId,
      });

      await createAuditLog('department_updated', 'department', editDept.id, {
        name: deptName.trim(),
        updated_by: profile?.id,
      });

      setEditDept(null);
      await load();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update department');
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deleteDept) return;
    setSavingDept(true);
    try {
      await deleteDepartment(deleteDept.id);
      await createAuditLog('department_deleted', 'department', deleteDept.id, {
        name: deleteDept.name,
        deleted_by: profile?.id,
      });
      setDeleteDept(null);
      await load();
    } catch (err) {
      console.error('Delete department error:', err);
    } finally {
      setSavingDept(false);
    }
  };

  const handleSaveReportingManager = async () => {
    if (!selectedEmpId) {
      setReportingError('Please select an employee');
      return;
    }
    if (selectedEmpId === selectedMgrId) {
      setReportingError('An employee cannot report to themselves');
      return;
    }

    setSavingReporting(true);
    setReportingError('');
    try {
      await updateReportingManager(selectedEmpId, selectedMgrId);
      await createAuditLog('reporting_manager_updated', 'employee', selectedEmpId, {
        manager_id: selectedMgrId,
        updated_by: profile?.id,
      });
      setAssignManagerModalOpen(false);
      setSelectedEmpId(null);
      setSelectedMgrId(null);
      await load();
    } catch (err: any) {
      setReportingError(err.message || 'Failed to update reporting manager');
    } finally {
      setSavingReporting(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Filtered employees for search
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.profile?.full_name?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        e.employee_code?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  // Root employees for Org Chart
  const rootEmployees = useMemo(() => {
    return employees.filter((e) => !e.manager_id);
  }, [employees]);

  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      label: `${e.profile?.full_name || 'Staff'} (${e.designation || 'Employee'})`,
      value: e.id,
    }));
  }, [employees]);

  const managerOptions = useMemo(() => {
    return [
      { label: 'None (Top Level / Direct to Exec)', value: '' },
      ...employees
        .filter((e) => e.id !== selectedEmpId)
        .map((e) => ({
          label: `${e.profile?.full_name || 'Staff'} (${e.designation || 'Manager'})`,
          value: e.id,
        })),
    ];
  }, [employees, selectedEmpId]);

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <Animated.View entering={FadeInDown.duration(350).springify()}>
          <View style={[styles.heroBar, { backgroundColor: '#0b1c30' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroSubHeader}>VISUAL WORKSPACE & GROUPING STUDIO</Text>
              <Text style={styles.heroTitle}>Organization Drag & Drop Studio</Text>
              <Text style={styles.heroSub}>
                Reassign employees across Departments, Office Workplaces, and Role Groups by dragging cards.
              </Text>
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.actionBtnHero, { backgroundColor: '#006a61' }]}
                onPress={openCreateModal}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#FFF" />
                <Text style={styles.actionBtnText}>New Department</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnHero, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => {
                  setReportingError('');
                  setSelectedEmpId(null);
                  setSelectedMgrId(null);
                  setAssignManagerModalOpen(true);
                }}
                activeOpacity={0.85}
              >
                <GitFork size={16} color="#FFF" />
                <Text style={styles.actionBtnText}>Reporting Line</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* 4 Mode Selector Tabs */}
        <View style={[styles.modeTabsBar, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => setActiveMode('departments')}
              style={[
                styles.modeTab,
                activeMode === 'departments'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: '#f1f5f9' },
              ]}
            >
              <Building2 size={16} color={activeMode === 'departments' ? '#FFF' : colors.text} />
              <Text
                style={[
                  styles.modeTabText,
                  { color: activeMode === 'departments' ? '#FFF' : colors.text },
                ]}
              >
                Department Grouping
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveMode('workplaces')}
              style={[
                styles.modeTab,
                activeMode === 'workplaces'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: '#f1f5f9' },
              ]}
            >
              <MapPin size={16} color={activeMode === 'workplaces' ? '#FFF' : colors.text} />
              <Text
                style={[
                  styles.modeTabText,
                  { color: activeMode === 'workplaces' ? '#FFF' : colors.text },
                ]}
              >
                Office Locations & Geofence
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveMode('roles')}
              style={[
                styles.modeTab,
                activeMode === 'roles'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: '#f1f5f9' },
              ]}
            >
              <ShieldCheck size={16} color={activeMode === 'roles' ? '#FFF' : colors.text} />
              <Text
                style={[
                  styles.modeTabText,
                  { color: activeMode === 'roles' ? '#FFF' : colors.text },
                ]}
              >
                Role & Permission Groups
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveMode('org-chart')}
              style={[
                styles.modeTab,
                activeMode === 'org-chart'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: '#f1f5f9' },
              ]}
            >
              <Network size={16} color={activeMode === 'org-chart' ? '#FFF' : colors.text} />
              <Text
                style={[
                  styles.modeTabText,
                  { color: activeMode === 'org-chart' ? '#FFF' : colors.text },
                ]}
              >
                Hierarchy Chart
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {activeMode !== 'org-chart' && (
            <View style={[styles.searchBox, { borderColor: '#e2e8f0' }]}>
              <Search size={15} color={colors.textSecondary} />
              <TextInput
                placeholder="Filter employees..."
                placeholderTextColor={colors.textSecondary}
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
          )}
        </View>

        {/* ── MODE 1: DEPARTMENT GROUPING KANBAN ────────────────────────────── */}
        {activeMode === 'departments' && (
          <View style={styles.kanbanBoardWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardColumns}>
              {/* Unassigned Department Column */}
              <KanbanColumn
                id="unassigned"
                title="Unassigned Department"
                count={filteredEmployees.filter((e) => !e.department_id).length}
                color="#64748b"
                bg="#f8faff"
                employees={filteredEmployees.filter((e) => !e.department_id)}
                isDropTarget={dropTargetColId === 'unassigned'}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleDragOver(e, 'unassigned')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'unassigned')}
                onQuickMove={setQuickMoveModalEmp}
                actionLoadingId={actionLoadingId}
                colors={colors}
              />

              {/* Each Department Column */}
              {departments.map((dept) => {
                const colEmps = filteredEmployees.filter((e) => e.department_id === dept.id);
                return (
                  <KanbanColumn
                    key={dept.id}
                    id={dept.id}
                    title={dept.name}
                    sub={dept.manager?.profile?.full_name ? `Lead: ${dept.manager.profile.full_name}` : undefined}
                    count={colEmps.length}
                    color="#006a61"
                    bg="#edf8f6"
                    employees={colEmps}
                    isDropTarget={dropTargetColId === dept.id}
                    onDragStart={handleDragStart}
                    onDragOver={(e) => handleDragOver(e, dept.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dept.id)}
                    onQuickMove={setQuickMoveModalEmp}
                    onEditDept={() => openEditModal(dept)}
                    actionLoadingId={actionLoadingId}
                    colors={colors}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── MODE 2: WORKPLACE / OFFICE GROUPING KANBAN ───────────────────── */}
        {activeMode === 'workplaces' && (
          <View style={styles.kanbanBoardWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardColumns}>
              {/* Unassigned / Remote Column */}
              <KanbanColumn
                id="unassigned"
                title="Remote / Unassigned"
                sub="No geofenced office"
                count={filteredEmployees.filter((e) => !e.workplace_id).length}
                color="#64748b"
                bg="#f8faff"
                employees={filteredEmployees.filter((e) => !e.workplace_id)}
                isDropTarget={dropTargetColId === 'unassigned'}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleDragOver(e, 'unassigned')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'unassigned')}
                onQuickMove={setQuickMoveModalEmp}
                actionLoadingId={actionLoadingId}
                colors={colors}
              />

              {/* Office Location Columns */}
              {workplaces.map((wp) => {
                const colEmps = filteredEmployees.filter((e) => e.workplace_id === wp.id);
                return (
                  <KanbanColumn
                    key={wp.id}
                    id={wp.id}
                    title={wp.name}
                    sub={`${wp.radius_meters}m geofence`}
                    count={colEmps.length}
                    color="#0369a1"
                    bg="#e0f2fe"
                    employees={colEmps}
                    isDropTarget={dropTargetColId === wp.id}
                    onDragStart={handleDragStart}
                    onDragOver={(e) => handleDragOver(e, wp.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, wp.id)}
                    onQuickMove={setQuickMoveModalEmp}
                    actionLoadingId={actionLoadingId}
                    colors={colors}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── MODE 3: ROLE & PERMISSION GROUPING KANBAN ─────────────────────── */}
        {activeMode === 'roles' && (
          <View style={styles.kanbanBoardWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardColumns}>
              {/* Administrators */}
              <KanbanColumn
                id="admin"
                title="Administrators"
                sub="Full org & settings access"
                count={filteredEmployees.filter((e) => e.profile?.role === 'admin').length}
                color="#4f46e5"
                bg="#eeebff"
                employees={filteredEmployees.filter((e) => e.profile?.role === 'admin')}
                isDropTarget={dropTargetColId === 'admin'}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleDragOver(e, 'admin')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'admin')}
                onQuickMove={setQuickMoveModalEmp}
                actionLoadingId={actionLoadingId}
                colors={colors}
              />

              {/* HR Managers */}
              <KanbanColumn
                id="hr"
                title="HR Managers"
                sub="Attendance, leave & payroll"
                count={filteredEmployees.filter((e) => e.profile?.role === 'hr').length}
                color="#b45309"
                bg="#fef3c7"
                employees={filteredEmployees.filter((e) => e.profile?.role === 'hr')}
                isDropTarget={dropTargetColId === 'hr'}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleDragOver(e, 'hr')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'hr')}
                onQuickMove={setQuickMoveModalEmp}
                actionLoadingId={actionLoadingId}
                colors={colors}
              />

              {/* Standard Employees */}
              <KanbanColumn
                id="employee"
                title="Standard Employees"
                sub="Self-service portal"
                count={filteredEmployees.filter((e) => e.profile?.role === 'employee').length}
                color="#006a61"
                bg="#edf8f6"
                employees={filteredEmployees.filter((e) => e.profile?.role === 'employee')}
                isDropTarget={dropTargetColId === 'employee'}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleDragOver(e, 'employee')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'employee')}
                onQuickMove={setQuickMoveModalEmp}
                actionLoadingId={actionLoadingId}
                colors={colors}
              />
            </ScrollView>
          </View>
        )}

        {/* ── MODE 4: HIERARCHY ORG TREE ───────────────────────────────────── */}
        {activeMode === 'org-chart' && (
          <View style={[styles.treeContainer, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <View style={[styles.treeHead, { borderBottomColor: '#f1f5f9' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.treeIconWrap, { backgroundColor: '#eeebff' }]}>
                  <Network size={20} color="#4f46e5" />
                </View>
                <View>
                  <Text style={[styles.treeTitle, { color: colors.text }]}>
                    Executive Chains of Command & Direct Reports
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Shows managerial supervisory relationships across the organization
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.treeContent}>
              {rootEmployees.map((rootEmp) => (
                <TreeNode
                  key={rootEmp.id}
                  employee={rootEmp}
                  collapsedNodes={collapsedNodes}
                  onToggle={toggleNode}
                  onReassignManager={(emp) => {
                    setSelectedEmpId(emp.id);
                    setSelectedMgrId(emp.manager_id || null);
                    setReportingError('');
                    setAssignManagerModalOpen(true);
                  }}
                  colors={colors}
                  depth={0}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── MODAL: Create Department ─────────────────────────────────────── */}
        <Modal visible={createDeptModalOpen} onClose={() => setCreateDeptModalOpen(false)} title="Create Department">
          <View style={{ gap: 14 }}>
            {formError ? (
              <View style={[styles.alertBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}>
                <AlertCircle size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 13, flex: 1 }}>{formError}</Text>
              </View>
            ) : null}

            <Input
              label="Department Name *"
              placeholder="e.g. Engineering, Sales, Product"
              value={deptName}
              onChangeText={setDeptName}
            />

            <Input
              label="Description"
              placeholder="Primary mission & responsibilities..."
              value={deptDesc}
              onChangeText={setDeptDesc}
              multiline
            />

            <Select
              label="Department Head / Lead"
              placeholder="Select department manager..."
              options={[{ label: 'Unassigned', value: '' }, ...employeeOptions]}
              value={deptManagerId || ''}
              onValueChange={(v) => setDeptManagerId(v || null)}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setCreateDeptModalOpen(false)}
                variant="outline"
                style={{ flex: 1, borderRadius: 8 }}
              />
              <Button
                title="Create Department"
                onPress={handleCreateDept}
                loading={savingDept}
                style={{ flex: 2, backgroundColor: colors.primary, borderRadius: 8 }}
              />
            </View>
          </View>
        </Modal>

        {/* ── MODAL: Edit Department ───────────────────────────────────────── */}
        <Modal visible={!!editDept} onClose={() => setEditDept(null)} title="Edit Department">
          <View style={{ gap: 14 }}>
            {formError ? (
              <View style={[styles.alertBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}>
                <AlertCircle size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 13, flex: 1 }}>{formError}</Text>
              </View>
            ) : null}

            <Input
              label="Department Name *"
              value={deptName}
              onChangeText={setDeptName}
              placeholder="Department Name"
            />

            <Input
              label="Description"
              value={deptDesc}
              onChangeText={setDeptDesc}
              placeholder="Description"
              multiline
            />

            <Select
              label="Department Head"
              placeholder="Select department manager..."
              options={[{ label: 'Unassigned', value: '' }, ...employeeOptions]}
              value={deptManagerId || ''}
              onValueChange={(v) => setDeptManagerId(v || null)}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setEditDept(null)}
                variant="outline"
                style={{ flex: 1, borderRadius: 8 }}
              />
              <Button
                title="Save Changes"
                onPress={handleSaveEditDept}
                loading={savingDept}
                style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8 }}
              />
            </View>
          </View>
        </Modal>

        {/* ── MODAL: Assign Reporting Manager ──────────────────────────────── */}
        <Modal
          visible={assignManagerModalOpen}
          onClose={() => setAssignManagerModalOpen(false)}
          title="Set Reporting Hierarchy"
        >
          <View style={{ gap: 14 }}>
            {reportingError ? (
              <View style={[styles.alertBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}>
                <AlertCircle size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 13, flex: 1 }}>{reportingError}</Text>
              </View>
            ) : null}

            <Select
              label="Employee *"
              placeholder="Select employee..."
              options={employeeOptions}
              value={selectedEmpId}
              onValueChange={(v) => {
                setSelectedEmpId(v);
                const currentEmp = employees.find((e) => e.id === v);
                setSelectedMgrId(currentEmp?.manager_id || '');
              }}
            />

            <Select
              label="Direct Reporting Supervisor / Manager *"
              placeholder="Select supervisor..."
              options={managerOptions}
              value={selectedMgrId || ''}
              onValueChange={(v) => setSelectedMgrId(v || null)}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setAssignManagerModalOpen(false)}
                variant="outline"
                style={{ flex: 1, borderRadius: 8 }}
              />
              <Button
                title="Update Hierarchy"
                onPress={handleSaveReportingManager}
                loading={savingReporting}
                style={{ flex: 2, backgroundColor: colors.primary, borderRadius: 8 }}
              />
            </View>
          </View>
        </Modal>

        {/* ── MODAL: Quick Move Mobile Fallback ─────────────────────────────── */}
        <Modal
          visible={!!quickMoveModalEmp}
          onClose={() => setQuickMoveModalEmp(null)}
          title={`Reassign ${quickMoveModalEmp?.profile?.full_name || 'Employee'}`}
        >
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Select target {activeMode === 'departments' ? 'department' : activeMode === 'workplaces' ? 'office workplace' : 'role'}:
            </Text>

            {activeMode === 'departments' && (
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleQuickMove('unassigned')}
                  style={[styles.quickMoveRow, { borderColor: '#e2e8f0' }]}
                >
                  <Text style={{ fontWeight: '600', color: colors.text }}>Unassigned Department</Text>
                </TouchableOpacity>
                {departments.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => handleQuickMove(d.id)}
                    style={[styles.quickMoveRow, { borderColor: '#e2e8f0' }]}
                  >
                    <Text style={{ fontWeight: '600', color: colors.text }}>{d.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeMode === 'workplaces' && (
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleQuickMove('unassigned')}
                  style={[styles.quickMoveRow, { borderColor: '#e2e8f0' }]}
                >
                  <Text style={{ fontWeight: '600', color: colors.text }}>Remote / Unassigned</Text>
                </TouchableOpacity>
                {workplaces.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => handleQuickMove(w.id)}
                    style={[styles.quickMoveRow, { borderColor: '#e2e8f0' }]}
                  >
                    <Text style={{ fontWeight: '600', color: colors.text }}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeMode === 'roles' && (
              <View style={{ gap: 8 }}>
                {(['employee', 'hr', 'admin'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => handleQuickMove(r)}
                    style={[styles.quickMoveRow, { borderColor: '#e2e8f0' }]}
                  >
                    <Text style={{ fontWeight: '600', color: colors.text }}>
                      {r === 'employee' ? 'Standard Employee' : r === 'hr' ? 'HR Manager' : 'Administrator'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Modal>

        {/* ── DIALOG: Delete Department Confirm ────────────────────────────── */}
        <ConfirmDialog
          visible={!!deleteDept}
          title="Delete Department?"
          message={`Are you sure you want to delete ${deleteDept?.name}? Employees in this department will be moved to Unassigned.`}
          confirmLabel="Yes, Delete"
          onConfirm={handleDeleteDept}
          onCancel={() => setDeleteDept(null)}
          loading={savingDept}
          variant="danger"
        />
      </ScrollView>
    </SidebarLayout>
  );
}

// ── Kanban Column Component ──────────────────────────────────────────────────
function KanbanColumn({
  id,
  title,
  sub,
  count,
  color,
  bg,
  employees,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onQuickMove,
  onEditDept,
  actionLoadingId,
  colors,
}: {
  id: string;
  title: string;
  sub?: string;
  count: number;
  color: string;
  bg: string;
  employees: Employee[];
  isDropTarget: boolean;
  onDragStart: (e: any, id: string) => void;
  onDragOver: (e: any) => void;
  onDragLeave: (e: any) => void;
  onDrop: (e: any) => void;
  onQuickMove: (emp: Employee) => void;
  onEditDept?: () => void;
  actionLoadingId: string | null;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.kanbanCol,
        { backgroundColor: colors.surface, borderColor: '#e2e8f0' },
        isDropTarget && {
          borderColor: color,
          borderWidth: 2,
          backgroundColor: bg,
        },
      ]}
      {...(Platform.OS === 'web'
        ? ({
            onDragOver,
            onDragLeave,
            onDrop,
          } as any)
        : {})}
    >
      {/* Column Head */}
      <View style={[styles.colHead, { borderBottomColor: '#f1f5f9' }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.colDot, { backgroundColor: color }]} />
            <Text style={[styles.colTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          {sub && <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>{sub}</Text>}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.colPill, { backgroundColor: bg }]}>
            <Text style={{ fontSize: 12, fontWeight: '800', color }}>{count}</Text>
          </View>
          {onEditDept && (
            <TouchableOpacity onPress={onEditDept} style={styles.colEditBtn}>
              <Edit2 size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Employees Card Stream */}
      <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
        {employees.length === 0 ? (
          <View style={styles.emptyColBox}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Drop employees here</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {employees.map((emp) => {
              const name = emp.profile?.full_name || 'Staff';
              const isWorking = actionLoadingId === emp.id;
              return (
                <View
                  key={emp.id}
                  {...(Platform.OS === 'web'
                    ? ({
                        draggable: true,
                        onDragStart: (e: any) => onDragStart(e, emp.id),
                        style: [
                          styles.empKanbanCard,
                          { backgroundColor: colors.surface, borderColor: '#e2e8f0' },
                          isWorking && { opacity: 0.4 },
                        ],
                      } as any)
                    : {
                        style: [
                          styles.empKanbanCard,
                          { backgroundColor: colors.surface, borderColor: '#e2e8f0' },
                        ],
                      })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar name={name} url={emp.profile?.avatar_url} size={34} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.cardEmpName, { color: colors.text }]} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={[styles.cardEmpSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {emp.designation || 'Staff'} · {emp.employee_code || 'EMP'}
                      </Text>
                    </View>

                    {isWorking ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <TouchableOpacity
                        style={[styles.movePill, { borderColor: '#e2e8f0' }]}
                        onPress={() => onQuickMove(emp)}
                      >
                        <MoveRight size={12} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Tree Node Component ──────────────────────────────────────────────────────
function TreeNode({
  employee,
  collapsedNodes,
  onToggle,
  onReassignManager,
  colors,
  depth,
}: {
  employee: Employee;
  collapsedNodes: Record<string, boolean>;
  onToggle: (id: string) => void;
  onReassignManager: (emp: Employee) => void;
  colors: any;
  depth: number;
}) {
  const isCollapsed = collapsedNodes[employee.id];
  const hasReports = employee.direct_reports && employee.direct_reports.length > 0;
  const name = employee.profile?.full_name || 'Staff Member';

  return (
    <View style={[treeStyles.nodeWrap, { marginLeft: depth > 0 ? 24 : 0 }]}>
      <View style={[treeStyles.nodeCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
        {hasReports && (
          <TouchableOpacity onPress={() => onToggle(employee.id)} style={treeStyles.collapseBtn}>
            {isCollapsed ? (
              <ChevronRight size={16} color={colors.primary} />
            ) : (
              <ChevronDown size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}

        <Avatar name={name} url={employee.profile?.avatar_url} size={38} />

        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={[treeStyles.empName, { color: colors.text }]}>{name}</Text>
            {depth === 0 && <Badge label="LEADERSHIP" variant="accentLight" />}
            {employee.department?.name && (
              <Badge label={employee.department.name} variant="neutral" />
            )}
          </View>
          <Text style={[treeStyles.designation, { color: colors.textSecondary }]}>
            {employee.designation || 'Staff'} · {employee.employee_code || 'EMP'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {hasReports && (
            <View style={[treeStyles.reportsBadge, { backgroundColor: '#edf8f6' }]}>
              <Users size={12} color="#006a61" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#006a61' }}>
                {employee.direct_reports?.length} Direct Report{employee.direct_reports?.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[treeStyles.editLineBtn, { borderColor: '#e2e8f0' }]}
            onPress={() => onReassignManager(employee)}
          >
            <GitFork size={13} color={colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Children Direct Reports */}
      {hasReports && !isCollapsed && (
        <View style={treeStyles.childrenContainer}>
          {employee.direct_reports?.map((child) => (
            <TreeNode
              key={child.id}
              employee={child}
              collapsedNodes={collapsedNodes}
              onToggle={onToggle}
              onReassignManager={onReassignManager}
              colors={colors}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 24, paddingBottom: 64 },
  contentDesktop: { maxWidth: 1380, alignSelf: 'center', width: '100%', paddingHorizontal: 36, paddingTop: 36, gap: 28 },

  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    paddingTop: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  heroSubHeader: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 4, letterSpacing: -0.4 },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },

  heroActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtnHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  modeTabsBar: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabText: { fontSize: 13, fontWeight: '700' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13 },

  // Board
  kanbanBoardWrap: { minHeight: 540 },
  boardColumns: { flexDirection: 'row', gap: 18, alignItems: 'flex-start', paddingBottom: 16 },
  kanbanCol: {
    width: 310,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 520,
  },
  colHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  colDot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { fontSize: 14, fontWeight: '800', flex: 1 },
  colPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  colEditBtn: { padding: 4 },

  colScroll: { padding: 12, maxHeight: 650 },
  emptyColBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },

  empKanbanCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    cursor: 'grab' as any,
  },
  cardEmpName: { fontSize: 13, fontWeight: '700' },
  cardEmpSub: { fontSize: 11 },
  movePill: { padding: 6, borderRadius: 6, borderWidth: 1 },

  // Tree View
  treeContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  treeHead: { padding: 20, borderBottomWidth: 1 },
  treeIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  treeTitle: { fontSize: 16, fontWeight: '700' },
  treeContent: { padding: 20, gap: 12 },

  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  quickMoveRow: { padding: 14, borderRadius: 10, borderWidth: 1 },
});

const treeStyles = StyleSheet.create({
  nodeWrap: { position: 'relative', marginTop: 8 },
  nodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  collapseBtn: { padding: 4 },
  empName: { fontSize: 14, fontWeight: '700' },
  designation: { fontSize: 12 },
  reportsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  childrenContainer: {
    borderLeftWidth: 2,
    borderLeftColor: '#e2e8f0',
    marginLeft: 20,
    paddingLeft: 12,
    marginTop: 4,
  },
});
