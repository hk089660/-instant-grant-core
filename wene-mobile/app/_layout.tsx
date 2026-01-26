// Buffer polyfillを最上流で設定（import順が重要）
// react-native-get-random-valuesを最初にインポート（crypto.getRandomValues用）
import 'react-native-get-random-values';
// Buffer polyfillを設定
import { Buffer } from 'buffer';
// globalThisにBufferを設定（他のモジュールが読み込まれる前に必要）
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}
if (typeof global !== 'undefined') {
  (global as any).Buffer = Buffer;
}

// 既存のpolyfillsをインポート（crypto.getRandomValues等の追加設定）
import '../src/polyfills';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Platform, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

// 処理済みURLを記録するSet（コンポーネント外で永続化、同じURLは1回だけ処理）
// useEffect内で定義すると再レンダリング時にリセットされるため、外に移動
const globalHandledUrls = new Set<string>();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  
  // Phantomリダイレクトの処理（グローバルリスナー）
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      // wene://phantom/ で始まるURLのみ対象
      if (!url.startsWith('wene://phantom/')) {
        return;
      }
      
      // 既に処理したURLはスキップ（揺れ防止）
      if (globalHandledUrls.has(url)) {
        console.log('[RootLayout] URL already handled (global), skipping:', url.substring(0, 100));
        return;
      }
      
      // URLを処理済みとして記録（エラーが起きても再実行しない）
      globalHandledUrls.add(url);
      console.log('[RootLayout] URL marked as handled (global), total handled:', globalHandledUrls.size);
      console.log('[RootLayout] Deep link received (new):', url);
      console.log('[RootLayout] Deep link received (first 200 chars):', url.substring(0, 200));
      
      // wene://phantom/ で始まるURLの場合、phantomルートに遷移
      try {
        console.log('[RootLayout] Phantom redirect detected');
        
        // カスタムスキームの場合、手動でパース
        let action: string | null = null;
        if (url.startsWith('wene://')) {
          // wene://phantom/connect?data=... の形式
          const match = url.match(/wene:\/\/phantom\/([^?]+)/);
          if (match) {
            action = match[1];
          }
        } else {
          // HTTPSスキームの場合
          try {
            const urlObj = new URL(url);
            const path = urlObj.pathname; // /phantom/connect または /phantom/signTransaction
            action = path.split('/').pop() || null; // connect または signTransaction
          } catch (e) {
            console.error('[RootLayout] Error parsing URL:', e);
          }
        }
        
        if (action) {
          console.log('[RootLayout] Navigating to phantom route:', `/phantom/${action}`);
          console.log('[RootLayout] Full URL for navigation:', url);
          
          // 現在のルートがphantomルートでない場合のみ遷移
          // URL全体を渡すことで、クエリパラメータも保持される
          if (!segments.includes('phantom')) {
            console.log('[RootLayout] Navigating to phantom route (not on phantom route yet)');
            // URL全体を渡す（Expo Routerがクエリパラメータを処理する）
            router.push(url as any);
          } else {
            console.log('[RootLayout] Already on phantom route - skipping navigation, URL will be handled by phantom screen');
            // 既にphantomルートにいる場合は、遷移しない（画面の震えを防ぐ）
            // app/phantom/[action].tsxのLinking.addEventListenerで処理される
          }
        } else {
          console.error('[RootLayout] Could not extract action from URL:', url);
        }
      } catch (error) {
        console.error('[RootLayout] Error in handleDeepLink:', error);
        // エラーが発生した場合でも、URLは既に処理済みとして記録されている（再実行を防ぐ）
      }
    };

    // 初期URLをチェック
    Linking.getInitialURL().then((url) => {
      console.log('[RootLayout] getInitialURL result:', url);
      if (url && url.startsWith('wene://phantom/')) {
        handleDeepLink(url).catch((error) => {
          console.error('[RootLayout] Error handling initial URL:', error);
          // エラーが発生した場合でも、URLは既に処理済みとして記録されている（再実行を防ぐ）
        });
      }
    }).catch((error) => {
      console.error('[RootLayout] Error getting initial URL:', error);
    });

    // URLイベントリスナーを設定
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('[RootLayout] URL event received:', event.url);
      if (event.url.startsWith('wene://phantom/')) {
        handleDeepLink(event.url).catch((error) => {
          console.error('[RootLayout] Error handling URL event:', error);
          // エラーが発生した場合でも、URLは既に処理済みとして記録されている（再実行を防ぐ）
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router, segments]);
  
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="r/[campaignId]" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="use/[campaignId]" />
        <Stack.Screen name="phantom/[action]" />
      </Stack>
    </SafeAreaProvider>
  );
}
