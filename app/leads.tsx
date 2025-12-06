import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient, Lead } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

const STAGE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'follow_up', label: 'Follow Up' },
  { key: 'quote_sent', label: 'Quote Sent' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

export default function Leads() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: () => apiClient.fetch<{ leads: Lead[] }>('/api/mobile/leads'),
  });

  const leads = data?.leads || [];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      lead.region?.toLowerCase().includes(search.toLowerCase()) ||
      lead.renovationType?.toLowerCase().includes(search.toLowerCase());

    const matchesStage =
      stageFilter === 'all' || lead.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  function renderLead({ item: lead }: { item: Lead }) {
    return (
      <TouchableOpacity
        style={styles.leadCard}
        onPress={() => router.push(`/lead/${lead.assignmentId}`)}
      >
        <View style={styles.leadHeader}>
          <Text style={styles.leadName}>{lead.contactName || 'Unknown'}</Text>
          {lead.isRevealed && (
            <Ionicons name="eye" size={16} color="#f59e0b" />
          )}
        </View>
        <Text style={styles.leadType}>{lead.renovationType}</Text>
        <View style={styles.leadFooter}>
          <View style={styles.regionTag}>
            <Ionicons name="location-outline" size={14} color="#94a3b8" />
            <Text style={styles.regionText}>{lead.region}</Text>
          </View>
          <View style={[styles.stageBadge, getStageColor(lead.stage)]}>
            <Text style={styles.stageText}>{formatStage(lead.stage)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'My Leads' }} />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search leads..."
            placeholderTextColor="#64748b"
          />
        </View>
        <FlatList
          horizontal
          data={STAGE_FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                stageFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setStageFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  stageFilter === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.assignmentId}
          renderItem={renderLead}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f59e0b" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#64748b" />
              <Text style={styles.emptyText}>No leads found</Text>
            </View>
          }
        />
      </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  filterList: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#f59e0b',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  leadCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  leadType: {
    fontSize: 14,
    color: '#f59e0b',
    marginTop: 4,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  regionTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 4,
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
});
