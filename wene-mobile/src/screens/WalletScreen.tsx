import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PublicKey } from '@solana/web3.js';
import { useRecipientStore } from '../store/recipientStore';
import { getConnection } from '../solana/singleton';
import {
  getSolBalance,
  getTokenBalances,
  formatMintShort,
  type TokenBalanceItem,
} from '../solana/wallet';
import { AppText, Card, Button } from '../ui/components';
import { theme } from '../ui/theme';

const LAMPORTS_PER_SOL = 1e9;

export const WalletScreen: React.FC = () => {
  const router = useRouter();
  const { walletPubkey } = useRecipientStore();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async (isRefresh = false) => {
    if (!walletPubkey) {
      setSolBalance(null);
      setTokens([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const connection = getConnection();
      const owner = new PublicKey(walletPubkey);
      const [sol, tokenList] = await Promise.all([
        getSolBalance(connection, owner),
        getTokenBalances(connection, owner),
      ]);
      setSolBalance(sol);
      setTokens(tokenList);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.length > 80 ? msg.slice(0, 80) + '…' : msg);
      setSolBalance(null);
      setTokens([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [walletPubkey]);

  useEffect(() => {
    fetchBalances(false);
  }, [fetchBalances]);

  const onRefresh = useCallback(() => {
    fetchBalances(true);
  }, [fetchBalances]);

  const showNoWallet = !walletPubkey;
  const showLoading = !showNoWallet && loading && !refreshing;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {showNoWallet ? (
        <View style={styles.center}>
          <AppText variant="h3" style={styles.title}>
            保有トークン一覧
          </AppText>
          <AppText variant="body" style={styles.muted}>
            Phantomに接続すると残高を表示できます
          </AppText>
          <Button
            title="ホームに戻る"
            onPress={() => router.replace('/')}
            variant="secondary"
            style={styles.topButton}
          />
        </View>
      ) : showLoading ? (
        <View style={styles.center}>
          <AppText variant="body" style={styles.muted}>
            読み込み中…
          </AppText>
        </View>
      ) : (
        <>
      <View style={styles.header}>
        <AppText variant="h2" style={styles.title}>
          保有トークン一覧
        </AppText>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <AppText variant="caption" style={styles.refreshText}>
            更新
          </AppText>
        </TouchableOpacity>
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <AppText variant="caption" style={styles.errorText}>
            {error}
          </AppText>
          <Button
            title="再試行"
            onPress={() => fetchBalances(false)}
            variant="secondary"
            style={styles.retryButton}
          />
        </Card>
      ) : null}

      <View style={styles.solCardWrap}>
        <Card style={styles.solCard}>
          <AppText variant="caption" style={styles.solLabel}>
            SOL 残高
          </AppText>
          <AppText variant="h1" style={styles.solValue}>
            {solBalance != null
              ? (solBalance / LAMPORTS_PER_SOL).toFixed(4)
              : '—'}{' '}
            SOL
          </AppText>
          <AppText variant="small" style={styles.pubkeyText}>
            {walletPubkey.slice(0, 8)}…{walletPubkey.slice(-8)}
          </AppText>
        </Card>
      </View>

      <AppText variant="caption" style={styles.sectionLabel}>
        トークン
      </AppText>
      <FlatList
        data={tokens}
        keyExtractor={(item) => item.ata ?? item.mint}
        contentContainerStyle={
          tokens.length === 0 ? styles.listEmpty : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyWrap}>
              <AppText variant="body" style={styles.emptyText}>
                トークンがありません
              </AppText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card style={styles.tokenCard}>
            <AppText variant="caption" style={styles.tokenMint}>
              {formatMintShort(item.mint)}
            </AppText>
            <AppText variant="h3" style={styles.tokenAmount}>
              {item.amount}
            </AppText>
            <AppText variant="small" style={styles.tokenDecimals}>
              decimals: {item.decimals}
            </AppText>
          </Card>
        )}
      />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  refreshButton: {
    padding: theme.spacing.sm,
  },
  refreshText: {
    color: theme.colors.textSecondary,
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
    marginBottom: theme.spacing.lg,
  },
  topButton: {
    marginTop: theme.spacing.md,
  },
  errorCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  retryButton: {
    marginTop: theme.spacing.sm,
  },
  solCardWrap: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  solCard: {
    alignItems: 'center',
  },
  solLabel: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  solValue: {
    textAlign: 'center',
  },
  pubkeyText: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.textTertiary,
  },
  sectionLabel: {
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  emptyWrap: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
  tokenCard: {
    marginBottom: theme.spacing.sm,
  },
  tokenMint: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  tokenAmount: {
    marginBottom: theme.spacing.xs,
  },
  tokenDecimals: {
    color: theme.colors.textTertiary,
  },
});
