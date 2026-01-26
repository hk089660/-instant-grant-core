import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '../ui/components';
import { theme } from '../ui/theme';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HomeScreen.tsx:11',message:'HomeScreen mounted',data:{platform:Platform.OS,hasBuffer:typeof (global as any)?.Buffer!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
  }, []);
  // #endregion

  const handleStartReceive = () => {
    // デモ用: 実際にはQRコードスキャンやリンクから遷移
    router.push('/r/demo-campaign?code=demo-invite');
  };

  const handleDemoLink = () => {
    router.push('/r/demo-campaign?code=demo-invite');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <AppText variant="h1" style={styles.title}>
          We-ne
        </AppText>
        <AppText variant="bodyLarge" style={styles.description}>
          支援クレジットを受け取る
        </AppText>

        <Button
          title="受け取りを開始"
          onPress={handleStartReceive}
          variant="primary"
          disabled={false}
          style={styles.mainButton}
        />

        <TouchableOpacity onPress={handleDemoLink} style={styles.demoLink}>
          <AppText variant="small" style={styles.demoLinkText}>
            デモリンクを開く
          </AppText>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.md,
  },
  description: {
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  mainButton: {
    marginBottom: theme.spacing.md,
  },
  demoLink: {
    padding: theme.spacing.sm,
  },
  demoLinkText: {
    color: theme.colors.textTertiary,
    textDecorationLine: 'underline',
  },
});
