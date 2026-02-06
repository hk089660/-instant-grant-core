import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText, Button, Card } from '../../ui/components';
import { theme } from '../../ui/theme';
import { schoolRoutes } from '../../lib/schoolRoutes';
import { useEventIdFromParams } from '../../hooks/useEventIdFromParams';

export const UserScanScreen: React.FC = () => {
  const router = useRouter();
  const { eventId: targetEventId } = useEventIdFromParams({ defaultValue: 'evt-001' });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <AppText variant="h2" style={styles.title}>
          QRを読み取る
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          受付のQRを読み取ってください
        </AppText>

        <Card style={styles.cameraBox}>
          <AppText variant="caption" style={styles.cameraText}>
            QRコードをスキャンしてください
          </AppText>
          <AppText variant="small" style={styles.cameraText}>
            （カメラ機能は準備中です）
          </AppText>
        </Card>

        <Button title="読み取り開始" onPress={() => targetEventId && router.push(schoolRoutes.confirm(targetEventId) as any)} />
        <Button
          title="もう一度読み取る"
          variant="secondary"
          onPress={() => targetEventId && router.replace(`${schoolRoutes.scan}?eventId=${targetEventId}` as any)}
          style={styles.secondaryButton}
        />

        {/* TODO: QR 期限切れ時のみ表示。現状はモックのため非表示 */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  cameraBox: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  cameraText: {
    color: theme.colors.textTertiary,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
  },
});
