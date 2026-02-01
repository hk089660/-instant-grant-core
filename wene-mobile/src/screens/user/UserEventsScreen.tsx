import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { AppText, Button, EventRow, StatusDot } from '../../ui/components';
import { theme } from '../../ui/theme';
import { getParticipations } from '../../data/participationStore';
import { useRecipientTicketStore } from '../../store/recipientTicketStore';
import { getClaimMode } from '../../config/claimMode';
import { getAllSchoolEvents } from '../../api/schoolEvents';
import { schoolRoutes } from '../../lib/schoolRoutes';

export const UserEventsScreen: React.FC = () => {
  const router = useRouter();
  const [startedIds, setStartedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const { tickets, loadTickets, isJoined } = useRecipientTicketStore();
  const isSchoolMode = getClaimMode() === 'school';

  const loadParticipations = useCallback(async () => {
    if (isSchoolMode) {
      await loadTickets();
    }
    const records = await getParticipations();
    setStartedIds(records.filter((r) => r.state === 'started').map((r) => r.eventId));
    if (!isSchoolMode) {
      setCompletedIds(records.filter((r) => r.state === 'completed').map((r) => r.eventId));
    }
  }, [isSchoolMode, loadTickets]);

  useFocusEffect(
    useCallback(() => {
      loadParticipations().catch(() => {});
    }, [loadParticipations])
  );

  const events = getAllSchoolEvents();
  const pendingEvents = events.filter(
    (event) => startedIds.includes(event.id) && !(isSchoolMode && isJoined(event.id))
  );
  const completedEvents = events.filter(
    (event) => (isSchoolMode ? isJoined(event.id) : completedIds.includes(event.id))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="h2" style={styles.title}>
          参加券
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          未完了と完了済みを分けて表示
        </AppText>

        <Button
          title="参加する"
          onPress={() => router.push(schoolRoutes.scan as any)}
          variant="primary"
          style={styles.mainButton}
        />

        <View style={styles.section}>
          <AppText variant="h3">未完了</AppText>
          {pendingEvents.length === 0 ? (
            <AppText variant="caption" style={styles.emptyText}>
              未完了の参加券はありません
            </AppText>
          ) : (
            pendingEvents.map((event) => (
              <EventRow
                key={event.id}
                title={event.title}
                datetime={event.datetime}
                host={event.host}
                leftSlot={<StatusDot color="#f5c542" />}
                onPress={() => router.push(schoolRoutes.confirm(event.id) as any)}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <AppText variant="h3">完了済み</AppText>
          {completedEvents.length === 0 ? (
            <AppText variant="caption" style={styles.emptyText}>
              完了済みの参加券はありません
            </AppText>
          ) : (
            completedEvents.map((event) => (
              <EventRow
                key={event.id}
                title={event.title}
                datetime={event.datetime}
                host={event.host}
                leftSlot={<StatusDot color="#38b000" />}
                onPress={() => router.push(schoolRoutes.success(event.id) as any)}
              />
            ))
          )}
        </View>

        <AppText variant="small" style={styles.helper}>
          黄色の・は未完了、緑の・は完了済みです
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  mainButton: {
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.sm,
  },
  helper: {
    color: theme.colors.textTertiary,
  },
});
