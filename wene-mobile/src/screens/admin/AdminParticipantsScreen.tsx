import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, AdminSearchBar, Card, AdminShell } from '../../ui/components';
import { adminTheme } from '../../ui/adminTheme';
import { getMockAdminRole, setMockAdminRole, mockParticipantLogs } from '../../data/adminMock';

export const AdminParticipantsScreen: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState(getMockAdminRole());

  return (
    <AdminShell
      title="参加者検索"
      role={role}
      onRoleChange={(nextRole) => {
        setRole(nextRole);
        setMockAdminRole(nextRole);
      }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="h2" style={styles.title}>
            参加者検索
          </AppText>
          <Button title="戻る" variant="secondary" onPress={() => router.back()} />
        </View>

        <AdminSearchBar value={query} onChange={setQuery} />

        <Card style={styles.card}>
          {mockParticipantLogs.map((result) => (
            <View key={result.code} style={styles.resultRow}>
              <View>
                <AppText variant="bodyLarge" style={styles.cardText}>
                  {result.id}
                </AppText>
                <AppText variant="caption" style={styles.cardMuted}>
                  表示名: {result.display}
                </AppText>
                <AppText variant="caption" style={styles.cardMuted}>
                  イベント: {result.event}
                </AppText>
              </View>
              <View style={styles.meta}>
                <AppText variant="caption" style={styles.cardText}>
                  {result.code}
                </AppText>
                <AppText variant="small" style={styles.cardMuted}>
                  {result.time}
                </AppText>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </AdminShell>
  );
};

const styles = StyleSheet.create({
  content: {
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminTheme.spacing.md,
  },
  title: {
    color: adminTheme.colors.text,
  },
  card: {
    backgroundColor: adminTheme.colors.surface,
    borderColor: adminTheme.colors.border,
  },
  cardText: {
    color: adminTheme.colors.text,
  },
  cardMuted: {
    color: adminTheme.colors.textSecondary,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: adminTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminTheme.colors.border,
  },
  meta: {
    alignItems: 'flex-end',
  },
});
