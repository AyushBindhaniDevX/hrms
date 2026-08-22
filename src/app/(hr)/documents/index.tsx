import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { getDocuments } from '@/lib/services/documents';
import { CompanyDocument } from '@/types/database';
import {
  FileText,
  FileCheck,
  Shield,
  Download,
  Upload,
  CheckCircle,
} from 'lucide-react-native';

export default function DocumentsScreen() {
  const colors = useTheme();
  const [docs, setDocs] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await getDocuments();
      setDocs(data);
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

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Document Vault & Policies</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Organizational Handbooks, NDAs & E-Signatures
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          <View style={{ gap: 14 }}>
            {docs.map((doc) => (
              <View key={doc.id} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={styles.iconBox}>
                    <FileText size={22} color="#0D7377" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.docTitle}>{doc.title}</Text>
                      <View style={styles.verBadge}>
                        <Text style={styles.verText}>{doc.version}</Text>
                      </View>
                    </View>
                    <Text style={styles.docMeta}>
                      Category: {doc.category.toUpperCase()} · Size: {Math.round(doc.file_size_kb / 1024 * 10) / 10} MB · Uploaded by: {doc.uploaded_by}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    {doc.requires_signature ? (
                      <View style={styles.signBadge}>
                        <FileCheck size={14} color="#059669" />
                        <Text style={styles.signText}>{doc.signatures_count} Signed</Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 11, color: '#64748B' }}>Read-only Policy</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
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
  card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  docTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  verBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  verText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  docMeta: { fontSize: 12, color: '#64748B', marginTop: 3 },
  signBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  signText: { fontSize: 11, fontWeight: '700', color: '#059669' },
});
