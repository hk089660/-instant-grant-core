import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipientStore } from '../store/recipientStore';
import { getGrantByCampaignId } from '../api/getGrant';
import type { Grant } from '../types/grant';
import { formatDeadlineJst, formatRemainingTime, isExpired as checkExpired } from '../utils/deadline';
import { AppText, Card, Pill, Button } from '../ui/components';
import { theme } from '../ui/theme';

export const WalletScreen: React.FC = () => {
  const router = useRouter();
  const { walletPubkey, campaignId, isUsed, checkUsed } = useRecipientStore();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setGrant(null);
      setLoading(false);
      setNotFound(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    getGrantByCampaignId(campaignId)
      .then((g) => {
        if (g) {
          setGrant(g);
          setNotFound(false);
        } else {
          setGrant(null);
          setNotFound(true);
        }
      })
      .catch(() => {
        setGrant(null);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
    
    if (campaignId && walletPubkey) {
      checkUsed(campaignId, walletPubkey);
    }
  }, [campaignId, walletPubkey, checkUsed]);

  const isExpired = grant ? checkExpired(grant) : false;
  const balance = isUsed ? 0 : (grant?.balance ?? 0);
  const canUse = !!campaignId && !!grant && !notFound && !isUsed && !isExpired;

  if (loading && campaignId) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <AppText variant="body" style={styles.muted}>
            読み込み中…
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <AppText variant="h2" style={styles.title}>
            ウォレット
          </AppText>

          {grant && (
            <AppText variant="caption" style={styles.grantTitle}>
              {grant.title}
            </AppText>
          )}

          <Card style={styles.balanceCard}>
            <AppText variant="caption" style={styles.balanceLabel}>
              残高
            </AppText>
            <AppText variant="h1" style={styles.balanceValue}>
              {balance} Credit
            </AppText>
            {walletPubkey && (
              <AppText variant="small" style={styles.pubkeyText}>
                {walletPubkey.slice(0, 8)}...{walletPubkey.slice(-8)}
              </AppText>
            )}
          </Card>

          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <AppText variant="caption" style={styles.infoLabel}>
                期限
              </AppText>
              <AppText variant="body" style={styles.infoValue}>
                {grant ? formatDeadlineJst(grant) : '—'}
              </AppText>
            </View>

            <View style={styles.infoRow}>
              <AppText variant="caption" style={styles.infoLabel}>
                残り時間
              </AppText>
              <AppText variant="body" style={styles.infoValue}>
                {grant ? formatRemainingTime(grant) : '—'}
              </AppText>
            </View>

            <View style={styles.statusRow}>
              <AppText variant="caption" style={styles.infoLabel}>
                ステータス
              </AppText>
              <Pill
                label={isUsed ? '使用済み' : isExpired ? '期限切れ' : '有効'}
                variant={isUsed ? 'active' : isExpired ? 'expired' : 'active'}
              />
            </View>
          </Card>

          <Button
            title={isUsed ? '使用済み' : '使う'}
            onPress={() => {
              if (canUse && campaignId) {
                router.push(`/use/${campaignId}` as any);
              }
            }}
            variant="primary"
            disabled={!canUse}
            style={styles.useButton}
          />

          {!canUse && !isUsed && !isExpired && (
            <AppText variant="small" style={styles.disabledNote}>
              準備中
            </AppText>
          )}
          {isUsed && (
            <AppText variant="small" style={styles.disabledNote}>
              このクレジットは使用済みです
            </AppText>
          )}
          {isExpired && !isUsed && (
            <AppText variant="small" style={styles.disabledNote}>
              期限切れのため使用できません
            </AppText>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.lg,
  },
  balanceCard: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  balanceLabel: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  balanceValue: {
    textAlign: 'center',
  },
  pubkeyText: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.textTertiary,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    marginBottom: theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  infoLabel: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    color: theme.colors.text,
  },
  useButton: {
    marginTop: theme.spacing.md,
  },
  disabledNote: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    color: theme.colors.textTertiary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  muted: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  grantTitle: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
});
