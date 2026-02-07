import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText, Button, Card } from '../../ui/components';
import { adminTheme } from '../../ui/adminTheme';

export const AdminLoginScreen: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <AppText variant="h2" style={styles.title}>
          管理者モード
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          先生のPCで操作する前提です
        </AppText>

        <Card style={styles.card}>
          <AppText variant="caption" style={styles.cardText}>
            ログインはモックです（後で認証を実装）
          </AppText>
        </Card>

        <Button
          title="管理者として続行"
          variant="secondary"
          onPress={() => router.replace('/admin' as any)}
        />
        <Button
          title="閲覧モードで開く"
          variant="secondary"
          onPress={() => router.replace('/admin' as any)}
          style={styles.secondaryButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminTheme.colors.background,
  },
  content: {
    flex: 1,
    padding: adminTheme.spacing.lg,
  },
  title: {
    color: adminTheme.colors.text,
    marginBottom: adminTheme.spacing.xs,
  },
  subtitle: {
    color: adminTheme.colors.textSecondary,
    marginBottom: adminTheme.spacing.lg,
  },
  card: {
    backgroundColor: adminTheme.colors.surface,
    borderColor: adminTheme.colors.border,
    marginBottom: adminTheme.spacing.lg,
  },
  cardText: {
    color: adminTheme.colors.textSecondary,
  },
  secondaryButton: {
    marginTop: adminTheme.spacing.sm,
  },
});
