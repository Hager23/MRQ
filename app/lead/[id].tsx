import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Lead } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const STAGES = [
  { key: 'new', label: 'New', color: '#1e40af' },
  { key: 'follow_up', label: 'Follow Up', color: '#7c3aed' },
  { key: 'quote_sent', label: 'Quote Sent', color: '#d97706' },
  { key: 'won', label: 'Won', color: '#059669' },
  { key: 'lost', label: 'Lost', color: '#dc2626' },
];

export default function LeadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => apiClient.fetch<{ leads: Lead[] }>('/api/mobile/leads'),
  });

  const lead = leadsData?.leads.find((l) => l.assignmentId === id);

  const revealMutation = useMutation({
    mutationFn: () => apiClient.fetch(`/api/mobile/leads/${id}/reveal`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      refreshUser();
      Alert.alert('Success', 'Contact info revealed! 1 credit used.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { stage?: string; notes?: string }) =>
      apiClient.fetch(`/api/mobile/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditingNotes(false);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  function handleReveal() {
    Alert.alert(
      'Reveal Contact Info',
      'This will use 1 credit to reveal the contact details. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reveal', onPress: () => revealMutation.mutate() },
      ]
    );
  }

  function handleCall() {
    if (lead?.contactPhone && lead.isRevealed) {
      Linking.openURL(`tel:${lead.contactPhone}`);
    }
  }

  function handleEmail() {
    if (lead?.contactEmail && lead.isRevealed) {
      Linking.openURL(`mailto:${lead.contactEmail}`);
    }
  }

  function handleSaveNotes() {
    updateMutation.mutate({ notes });
  }

  if (isLoading || !lead) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: lead.contactName || 'Lead Details' }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{lead.contactName || 'Unknown'}</Text>
          <Text style={styles.type}>{lead.renovationType}</Text>
          <View style={styles.regionRow}>
            <Ionicons name="location" size={16} color="#94a3b8" />
            <Text style={styles.region}>{lead.region}</Text>
          </View>
        </View>

        {!lead.isRevealed ? (
          <TouchableOpacity
            style={styles.revealButton}
            onPress={handleReveal}
            disabled={revealMutation.isPending}
          >
            {revealMutation.isPending ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <>
                <Ionicons name="eye-outline" size={24} color="#0f172a" />
                <Text style={styles.revealText}>Reveal Contact Info (1 Credit)</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={20} color="#f59e0b" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{lead.contactPhone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
              <View style={styles.contactIcon}>
                <Ionicons name="mail" size={20} color="#f59e0b" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{lead.contactEmail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lead Stage</Text>
          <View style={styles.stagesRow}>
            {STAGES.map((stage) => (
              <TouchableOpacity
                key={stage.key}
                style={[
                  styles.stageChip,
                  { borderColor: stage.color },
                  lead.stage === stage.key && { backgroundColor: stage.color },
                ]}
                onPress={() => updateMutation.mutate({ stage: stage.key })}
                disabled={updateMutation.isPending}
              >
                <Text
                  style={[
                    styles.stageChipText,
                    lead.stage === stage.key && { color: '#fff' },
                  ]}
                >
                  {stage.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {!isEditingNotes ? (
              <TouchableOpacity onPress={() => {
                setNotes(lead.notes || '');
                setIsEditingNotes(true);
              }}>
                <Ionicons name="pencil" size={20} color="#f59e0b" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSaveNotes} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <ActivityIndicator size="small" color="#f59e0b" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          {isEditingNotes ? (
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this lead..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.notesText}>
              {lead.notes || 'No notes yet. Tap the pencil to add notes.'}
            </Text>
          )}
        </View>

        {lead.projectDescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Details</Text>
            <Text style={styles.descriptionText}>{lead.projectDescription}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  type: {
    fontSize: 18,
    color: '#f59e0b',
    marginTop: 4,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  region: {
    fontSize: 16,
    color: '#94a3b8',
    marginLeft: 4,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  revealText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  contactSection: {
    margin: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  contactValue: {
    fontSize: 16,
    color: '#fff',
    marginTop: 2,
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveText: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '600',
  },
  stagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  stageChipText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  notesInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesText: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
});
