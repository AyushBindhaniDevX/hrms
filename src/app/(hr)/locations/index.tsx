import { HR_NAV } from '@/constants/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getWorkplaces, createWorkplace, updateWorkplace } from '@/lib/services/employee';
import type { Workplace } from '@/types';



export default function LocationsScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('150');

  const load = useCallback(async () => {
    const data = await getWorkplaces();
    setWorkplaces(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name || !lat || !lng) return;
    setCreating(true);
    try {
      await createWorkplace({
        organization_id: profile?.organization_id || '',
        name,
        address: address || undefined,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        radius_meters: parseInt(radius) || 150,
      });
      setShowCreate(false);
      setName(''); setAddress(''); setLat(''); setLng(''); setRadius('150');
      await load();
    } catch {}
    setCreating(false);
  };

  const toggleActive = async (wp: Workplace) => {
    await updateWorkplace(wp.id, { is_active: !wp.is_active });
    await load();
  };

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout items={HR_NAV}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Workplaces</Text>
          <Button title="+ Add Location" onPress={() => setShowCreate(true)} size="sm" />
        </View>

        <FlatList
          data={workplaces}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: colors.text, fontWeight: '500', fontSize: 15 }]}>{item.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.address}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)} · Radius: {item.radius_meters}m
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Badge label={item.is_active ? 'Active' : 'Inactive'} variant={item.is_active ? 'success' : 'neutral'} />
                  <Button
                    title={item.is_active ? 'Deactivate' : 'Activate'}
                    onPress={() => toggleActive(item)}
                    variant="ghost"
                    size="sm"
                  />
                </View>
              </View>
            </Card>
          )}
        />

        <Modal visible={showCreate} onClose={() => setShowCreate(false)} title="Add Workplace">
          <Input label="Name *" value={name} onChangeText={setName} />
          <Input label="Address" value={address} onChangeText={setAddress} />
          <Input label="Latitude *" value={lat} onChangeText={setLat} keyboardType="numeric" />
          <Input label="Longitude *" value={lng} onChangeText={setLng} keyboardType="numeric" />
          <Input label="Geofence Radius (m)" value={radius} onChangeText={setRadius} keyboardType="numeric" />
          <Button title="Create" onPress={handleCreate} loading={creating} />
        </Modal>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
