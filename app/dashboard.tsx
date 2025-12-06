import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient, Lead } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  const { data: leadsData, isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: () => apiClient.fetch<{ leads: Lead[] }>('/api/mobile/leads'),
  });

  const leads = leadsData?.leads || [];
  const newLeads = leads.filter(l => l.stage === 'new' || l.stage === 'assigned').length;
  const inProgress = leads.filter(l => ['follow_up', 'revealed', 'contacted', 'quote_sent'].includes(l.stage)).length;
  const won = leads.filter(l => l.stage === 'won').length;

  async function handleRefresh() {
    await refreshUser();
    await refetch();
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerRight: () => (
            <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
              <Ionicons name="log-out-outline" size={24} color="#f59e0b" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#f59e0b" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome back, {user?.user.firstName || 'Tradie'}!
          </Text>
          <Text style={styles.company}>{user?.client.companyName}</Text>
        </View>

        <View style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <Ionicons name="wallet-outline" size={24} color="#f59e0b" />
            <Text style={styles.creditsTitle}>Lead Credits</Text>
          </View>
          <View style={styles.creditsRow}>
            <View style={styles.creditItem}>
              <Text style={styles.creditValue}>{user?.credits.remaining || 0}</Text>
              <Text style={styles.creditLabel}>Remaining</Text>
            </View>
            <View style={styles.creditDivider} />
            <View style={styles.creditItem}>
              <Text style={styles.creditValue}>{user?.credits.used || 0}</Text>
              <Text style={styles.creditLabel}>Used</Text>
            </View>
            <View style={styles.creditDivider} />
            <View style={styles.creditItem}>
              <Text style={styles.creditValue}>{user?.credits.allocated || 0}</Text>
              <Text style={styles.creditLabel}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#1e40af' }]}>
            <Text style={styles.statValue}>{newLeads}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#7c3aed' }]}>
            <Text style={styles.statValue}>{inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#059669' }]}>
            <Text style={styles.statValue}>{won}</Text>
            <Text style={styles.statLabel}>Won</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Leads</Text>
            <TouchableOpacity onPress={() => router.push('/leads')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {leads.slice(0, 5).map((lead) => (
            <TouchableOpacity
              key={lead.assignmentId}
              style={styles.leadCard}
              onPress={() => router.push(`/lead/${lead.assignmentId}`)}
            >
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{lead.contactName || 'Unknown'}</Text>
                <Text style={styles.leadDetails}>
                  {lead.renovationType} - {lead.region}
                </Text>
              </View>
              <View style={[styles.stageBadge, getStageColor(lead.stage)]}>
                <Text style={styles.stageText}>{formatStage(lead.stage)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {leads.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#64748b" />
              <Text style={styles.emptyText}>No leads yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

function getStageColor(stage: string) {
  switch (stage) {
    case 'new':
    case 'assigned':
      return { backgroundColor: '#1e40af' };
    case 'won':
      return { backgroundColor: '#059669' };
    case 'lost':
      return { backgroundColor: '#dc2626' };
    default:
      return { backgroundColor: '#7c3aed' };
  }
}

function formatStage(stage: string) {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  company: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  creditsCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f59e0b33',
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  creditItem: {
    alignItems: 'center',
    flex: 1,
  },
  creditValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  creditLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  creditDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  seeAll: {
    fontSize: 14,
    color: '#f59e0b',
  },
  leadCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  leadDetails: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
});
