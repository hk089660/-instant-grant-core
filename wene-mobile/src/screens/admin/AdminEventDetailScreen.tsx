import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText, Button, Card, AdminShell } from '../../ui/components';
import { adminTheme } from '../../ui/adminTheme';
import { getMockAdminRole, setMockAdminRole, mockEvents } from '../../data/adminMock';
import { useSyncedAdminData } from '../../data/adminUserSync';

export const AdminEventDetailScreen: React.FC = () => {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [role, setRole] = React.useState(getMockAdminRole());
  const canPrint = role === 'admin';
  const canDownloadCsv = role === 'admin';
  const { syncedEvents, getParticipantsForEvent } = useSyncedAdminData();
  const event = syncedEvents.find((item) => item.id === eventId) ?? mockEvents[0];
  const participants = getParticipantsForEvent(eventId ?? event.id);

  return (
    <AdminShell
      title="イベント詳細"
      role={role}
      onRoleChange={(nextRole) => {
        setRole(nextRole);
        setMockAdminRole(nextRole);
      }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="h2" style={styles.title}>
            イベント詳細
          </AppText>
          <Button title="戻る" variant="secondary" onPress={() => router.back()} />
        </View>

        <Card style={styles.card}>
          <AppText variant="h3" style={styles.cardText}>
            {event.title}
          </AppText>
          <AppText variant="caption" style={styles.cardText}>
            {event.datetime}
          </AppText>
          <AppText variant="caption" style={styles.cardText}>
            主催: {event.host}
          </AppText>
          <AppText variant="small" style={styles.cardMuted}>
            ID: {event.id}
          </AppText>
          <AppText variant="small" style={styles.cardMuted}>
            状態: {event.state}
          </AppText>
        </Card>

        <View style={styles.counts}>
          <Card style={styles.countCard}>
            <AppText variant="caption" style={styles.cardText}>
              リアルタイム参加数
            </AppText>
            <AppText variant="h2" style={styles.cardText}>
              {event.rtCount}
            </AppText>
          </Card>
          <Card style={styles.countCard}>
            <AppText variant="caption" style={styles.cardText}>
              total参加数
            </AppText>
            <AppText variant="h2" style={styles.cardText}>
              {event.totalCount}
            </AppText>
          </Card>
        </View>

        <Card style={styles.card}>
          <AppText variant="h3" style={styles.cardText}>
            QR表示
          </AppText>
          <View style={styles.qrBox}>
            <AppText variant="caption" style={styles.cardMuted}>
              QRプレビュー（モック）
            </AppText>
          </View>
          <View style={styles.qrActions}>
            <Button title="QRを表示" variant="secondary" onPress={() => {}} />
            {canPrint ? (
              <Button
                title="印刷用PDF"
                variant="secondary"
                onPress={() => router.push(`/admin/print/${eventId}` as any)}
                style={styles.secondaryButton}
              />
            ) : null}
          </View>
        </Card>

        {canDownloadCsv ? (
          <View style={styles.actions}>
            <Button title="CSVダウンロード" variant="secondary" onPress={() => {}} />
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <AppText variant="h3" style={styles.title}>
            参加者一覧
          </AppText>
          <AppText variant="small" style={styles.muted}>
            個人情報は表示しません
          </AppText>
        </View>
        <Card style={styles.card}>
          <View style={styles.tableHeader}>
            <AppText variant="small" style={styles.cardMuted}>
              内部ID
            </AppText>
            <AppText variant="small" style={styles.cardMuted}>
              表示名
            </AppText>
            <AppText variant="small" style={styles.cardMuted}>
              確認コード
            </AppText>
            <AppText variant="small" style={styles.cardMuted}>
              参加時刻
            </AppText>
          </View>
          {participants.map((p) => (
            <View key={p.id} style={styles.participantRow}>
              <View style={styles.participantInfo}>
                <AppText variant="bodyLarge" style={styles.cardText}>
                  {p.id}
                </AppText>
                <AppText variant="caption" style={styles.cardMuted}>
                  表示名: {p.display}
                </AppText>
              </View>
              <View style={styles.participantMeta}>
                <AppText variant="caption" style={styles.cardText}>
                  {p.code}
                </AppText>
                <AppText variant="small" style={styles.cardMuted}>
                  {p.time}
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
    marginBottom: adminTheme.spacing.lg,
  },
  cardText: {
    color: adminTheme.colors.text,
  },
  cardMuted: {
    color: adminTheme.colors.textSecondary,
  },
  counts: {
    flexDirection: 'row',
    gap: adminTheme.spacing.md,
    marginBottom: adminTheme.spacing.lg,
  },
  countCard: {
    flex: 1,
    backgroundColor: adminTheme.colors.surface,
    borderColor: adminTheme.colors.border,
  },
  qrBox: {
    height: 200,
    borderRadius: adminTheme.radius.md,
    borderWidth: 1,
    borderColor: adminTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminTheme.spacing.md,
    marginBottom: adminTheme.spacing.md,
  },
  qrActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButton: {
    marginLeft: adminTheme.spacing.sm,
  },
  actions: {
    marginBottom: adminTheme.spacing.lg,
  },
  sectionHeader: {
    marginBottom: adminTheme.spacing.sm,
  },
  muted: {
    color: adminTheme.colors.textTertiary,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: adminTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminTheme.colors.border,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: adminTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminTheme.colors.border,
  },
  participantInfo: {
    flex: 1,
  },
  participantMeta: {
    alignItems: 'flex-end',
  },
});
