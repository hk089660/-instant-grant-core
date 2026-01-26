import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRecipientStore } from '../../src/store/recipientStore';
import { usePhantomStore } from '../../src/store/phantomStore';
import {
  parsePhantomRedirect,
  decryptPhantomResponse,
  handleRedirect as handleSignTransactionRedirect,
} from '../../src/utils/phantom';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import { AppText, Loading } from '../../src/ui/components';
import { theme } from '../../src/ui/theme';

export default function PhantomRedirectScreen() {
  const params = useLocalSearchParams<{ 
    action: string; 
    data?: string; 
    nonce?: string; 
    phantom_encryption_public_key?: string;
    errorCode?: string;
    errorMessage?: string;
  }>();
  const { action } = params;
  const router = useRouter();
  const { setWalletPubkey, setPhantomSession, setState, setError, campaignId } = useRecipientStore();
  const { dappSecretKey, loadKeyPair, setPhantomEncryptionPublicKey } = usePhantomStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 処理済みURLを記録するRef（useEffect内でリセットされないようにする）
  const processedUrlsRef = useRef<Set<string>>(new Set<string>());
  const processedSignTxUrlsRef = useRef<Set<string>>(new Set<string>());
  const isProcessingRef = useRef<boolean>(false);
  
  // 状態更新の重複を防ぐためのRef
  const statusRef = useRef<'processing' | 'success' | 'error'>('processing');
  const hasProcessedRef = useRef<boolean>(false);
  
  // 安全なsetStatus（重複更新を防ぐ）
  const safeSetStatus = (newStatus: 'processing' | 'success' | 'error') => {
    if (statusRef.current === newStatus) {
      console.log(`[phantom] Status already ${newStatus}, skipping update`);
      return;
    }
    console.log(`[phantom] Status change: ${statusRef.current} -> ${newStatus}`);
    statusRef.current = newStatus;
    setStatus(newStatus);
  };
  
  // Expo RouterのパラメータからURLを再構築
  const reconstructUrlFromParams = (): string | null => {
    if (params.data && params.nonce) {
      const url = `wene://phantom/${action}?data=${encodeURIComponent(params.data)}&nonce=${encodeURIComponent(params.nonce)}`;
      if (params.phantom_encryption_public_key) {
        return `${url}&phantom_encryption_public_key=${encodeURIComponent(params.phantom_encryption_public_key)}`;
      }
      return url;
    }
    return null;
  };

  useEffect(() => {
    // 初期状態を設定
    statusRef.current = 'processing';
    hasProcessedRef.current = false;
    
    console.log('[phantom] PhantomRedirectScreen mounted, action:', action);
    
    if (action !== 'connect' && action !== 'signTransaction') {
      console.log('[phantom] Invalid action:', action);
      return;
    }
    
    // 既に処理済みの場合は何もしない（画面の震えを防ぐ）
    if (hasProcessedRef.current) {
      console.log('[phantom] Already processed, skipping');
      return;
    }

    let listener: ReturnType<typeof Linking.addEventListener> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const processConnectUrl = async (url: string, secretKey: Uint8Array) => {
      // 既に処理中の場合はスキップ（画面の震えを防ぐ）
      if (isProcessingRef.current) {
        console.log('[processConnectUrl] Already processing, skipping:', url.substring(0, 100));
        return;
      }
      
      // 既に処理済みのURLはスキップ（画面の震えを防ぐ）
      if (processedUrlsRef.current.has(url)) {
        console.log('[processConnectUrl] URL already processed, skipping:', url.substring(0, 100));
        return;
      }
      
      // 既に成功状態の場合は処理しない（画面の震えを防ぐ）
      if (statusRef.current === 'success') {
        console.log('[processConnectUrl] Already in success state, skipping:', url.substring(0, 100));
        return;
      }
      
      // 処理中フラグを設定
      isProcessingRef.current = true;
      // URLを処理済みとして記録（エラーが起きても再実行しない）
      processedUrlsRef.current.add(url);
      console.log('[processConnectUrl] Processing URL (new):', url.substring(0, 100));
      
      try {
        if (typeof parsePhantomRedirect !== 'function') {
          throw new Error('parsePhantomRedirect is not available');
        }
        
        const parsed = parsePhantomRedirect(url);
        if (!parsed) {
          console.error('[phantom] Failed to parse redirect URL. URL was:', url);
          throw new Error('Invalid redirect URL');
        }
        console.log('[phantom] Successfully parsed redirect URL');

        // URLからphantom_encryption_public_keyを取得（bs58エンコード）
        let phantomPublicKey: string | null = null;
        if (url.startsWith('wene://')) {
          // カスタムスキームの場合、手動でパース
          const queryString = url.split('?')[1];
          if (queryString) {
            const params = new URLSearchParams(queryString);
            phantomPublicKey = params.get('phantom_encryption_public_key');
          }
        } else {
          // HTTPSスキームの場合、通常のURLパースを使用
          const urlObj = new URL(url);
          phantomPublicKey = urlObj.searchParams.get('phantom_encryption_public_key');
        }
        
        if (!phantomPublicKey) {
          console.error('[phantom] Phantom public key not found in URL. URL was:', url);
          throw new Error('Phantom public key not found');
        }
        console.log('[phantom] Found phantom public key (bs58):', phantomPublicKey.substring(0, 20) + '...', `(length: ${phantomPublicKey.length})`);

        console.log('[phantom] Decrypting response...');
        
        if (typeof decryptPhantomResponse !== 'function') {
          throw new Error('decryptPhantomResponse is not available');
        }
        
        const result = decryptPhantomResponse(
          parsed.data,
          parsed.nonce,
          secretKey,
          phantomPublicKey
        );

        if (!result) {
          console.error('[phantom] Failed to decrypt response');
          throw new Error('Failed to decrypt Phantom response');
        }

        console.log('[phantom] Connection successful, setting wallet pubkey:', result.publicKey.substring(0, 8) + '...');
        
        // 既に成功状態の場合は状態更新をスキップ（画面の震えを防ぐ）
        if (statusRef.current !== 'success' && !hasProcessedRef.current) {
          hasProcessedRef.current = true;
          setWalletPubkey(result.publicKey);
          setPhantomSession(result.session);
          setPhantomEncryptionPublicKey(phantomPublicKey);
          setState('Connected');
          safeSetStatus('success');

          // 受給画面に戻る
          setTimeout(() => {
            if (campaignId) {
              router.replace(`/r/${campaignId}` as any);
            } else {
              router.replace('/');
            }
          }, 500);
        } else {
          console.log('[phantom] Already in success state, skipping state update');
        }
      } catch (error) {
        console.error('[phantom] processConnectUrl error:', error);
        // 既に成功状態の場合はエラー状態にしない（画面の震えを防ぐ）
        if (statusRef.current !== 'success') {
          safeSetStatus('error');
          const errorMsg = error instanceof Error ? error.message : 'Failed to process Phantom response';
          setErrorMessage(errorMsg);
          setError(errorMsg);
        } else {
          console.log('[phantom] Error occurred but already in success state, ignoring error');
        }
      } finally {
        // 処理中フラグをリセット
        isProcessingRef.current = false;
      }
    };

    const processSignTransactionUrl = (url: string, secretKey: Uint8Array) => {
      // 既に処理中の場合はスキップ（画面の震えを防ぐ）
      if (isProcessingRef.current) {
        console.log('[processSignTransactionUrl] Already processing, skipping:', url.substring(0, 100));
        return;
      }
      
      // 既に処理済みのURLはスキップ（画面の震えを防ぐ）
      if (processedSignTxUrlsRef.current.has(url)) {
        console.log('[processSignTransactionUrl] URL already processed, skipping:', url.substring(0, 100));
        return;
      }
      
      // 既に成功状態の場合は処理しない（画面の震えを防ぐ）
      if (statusRef.current === 'success') {
        console.log('[processSignTransactionUrl] Already in success state, skipping');
        return;
      }
      
      // 処理中フラグを設定
      isProcessingRef.current = true;
      // URLを処理済みとして記録
      processedSignTxUrlsRef.current.add(url);
      
      try {
        const result = handleSignTransactionRedirect(url, secretKey);
        if (result.ok) {
        // 既に成功状態の場合は状態更新をスキップ（画面の震えを防ぐ）
        if (statusRef.current !== 'success' && !hasProcessedRef.current) {
          hasProcessedRef.current = true;
          safeSetStatus('success');
          // 遷移は Receive の handleClaim 側（sendSignedTx → replace /wallet）で行う
          if (campaignId) {
            setTimeout(() => router.replace(`/r/${campaignId}` as any), 50);
          }
        } else {
          console.log('[processSignTransactionUrl] Already processed, skipping state update');
        }
        } else {
          // 既に成功状態の場合はエラー状態にしない（画面の震えを防ぐ）
          if (statusRef.current !== 'success') {
            safeSetStatus('error');
            setErrorMessage(result.error);
            setError(result.error);
          } else {
            console.log('[processSignTransactionUrl] Error occurred but already in success state, ignoring error');
          }
        }
      } finally {
        // 処理中フラグをリセット
        isProcessingRef.current = false;
      }
    };

    const run = async () => {
      try {
        console.log('[phantom] run() started, action:', action);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'phantom/[action].tsx:95',message:'phantom route run start',data:{action,platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        console.log('[phantom] Loading key pair...');
        const keyPair = await loadKeyPair();
        if (!keyPair || !dappSecretKey) {
          console.error('[phantom] Key pair not found', { hasKeyPair: !!keyPair, hasSecretKey: !!dappSecretKey });
          throw new Error('Encryption key pair not found');
        }
        console.log('[phantom] Key pair loaded successfully');

        // Expo RouterのパラメータからURLを再構築してみる
        console.log('[phantom] Checking params from Expo Router:', Object.keys(params));
        console.log('[phantom] Params values:', {
          action: params.action,
          hasData: !!params.data,
          hasNonce: !!params.nonce,
          hasPhantomKey: !!params.phantom_encryption_public_key,
          errorCode: params.errorCode,
          errorMessage: params.errorMessage
        });
        
        // エラーパラメータをチェック（Phantomから戻ったURLのerrorCode/errorMessageを可視化）
        if (params.errorCode || params.errorMessage) {
          const errorCode = params.errorCode;
          const errorMsg = params.errorMessage || `Phantom error: ${errorCode || 'Unknown error'}`;
          
          // エラー情報を詳細にログ出力
          console.error('[phantom] ===== PHANTOM ERROR DETECTED =====');
          console.error('[phantom] Error Code:', errorCode);
          console.error('[phantom] Error Message:', errorMsg);
          console.error('[phantom] Full params:', JSON.stringify(params, null, 2));
          console.error('[phantom] ====================================');
          
          // エラーコードに応じたメッセージを設定
          let userFriendlyMessage = `エラーコード: ${errorCode || 'Unknown'}\n\n${errorMsg}`;
          if (errorCode === '-32603') {
            userFriendlyMessage = `エラーコード: ${errorCode}\n\n${errorMsg}\n\n考えられる原因:\n1. dapp_encryption_public_keyの形式が正しくない\n2. redirect_linkの形式が正しくない\n3. app_urlがブロックリストに載っている\n4. Phantom Portalへの登録が必要`;
          } else if (errorCode === '-32000') {
            userFriendlyMessage = `エラーコード: ${errorCode}\n\n無効なパラメータが送信されました。\n\n${errorMsg}`;
          } else if (errorCode === '4001') {
            userFriendlyMessage = `エラーコード: ${errorCode}\n\nユーザーが接続を拒否しました。`;
          }
          
          safeSetStatus('error');
          setErrorMessage(userFriendlyMessage);
          setError(userFriendlyMessage);
          return;
        }
        
        // 処理済みURLを記録するSet（同じURLは1回だけ処理）
        // 注意: このSetはuseEffect内で定義されているため、コンポーネントが再マウントされるとリセットされる
        // ただし、同じURLが複数回処理されることを防ぐため、この関数内でのみ有効
        const handledUrlsInRun = new Set<string>();
        
        // URLが既に取得できている場合の処理
        const processUrlIfAvailable = async (urlToProcess: string | null): Promise<boolean> => {
          if (!urlToProcess) return false;
          
          // wene://phantom/ で始まるURLのみ処理
          if (!urlToProcess.startsWith('wene://phantom/')) {
            return false;
          }
          
          // 既に処理したURLはスキップ（揺れ防止）
          if (handledUrlsInRun.has(urlToProcess)) {
            console.log('[phantom] URL already handled in run, skipping:', urlToProcess.substring(0, 100));
            return false;
          }
          
          // URLを処理済みとして記録（エラーが起きても再実行しない）
          handledUrlsInRun.add(urlToProcess);
          console.log('[phantom] Processing URL (new):', urlToProcess.substring(0, 100));
          
          try {
            if (action === 'signTransaction') {
              processSignTransactionUrl(urlToProcess, dappSecretKey);
              return true;
            } else if (action === 'connect') {
              await processConnectUrl(urlToProcess, dappSecretKey);
              return true;
            }
          } catch (error) {
            console.error('[phantom] Error in processUrlIfAvailable:', error);
            // エラーが発生した場合でも、URLは既に処理済みとして記録されている（再実行を防ぐ）
            return false;
          }
          return false;
        };
        
        const reconstructedUrl = reconstructUrlFromParams();
        if (reconstructedUrl) {
          console.log('[phantom] Reconstructed URL from params:', reconstructedUrl.substring(0, 200));
          if (await processUrlIfAvailable(reconstructedUrl)) {
            return;
          }
        }
        
        // リダイレクトURLを取得（getInitialURLとイベントリスナーの両方を使用）
        console.log('[phantom] Getting initial URL...');
        let url: string | null = await Linking.getInitialURL();
        console.log('[phantom] getInitialURL result:', url ? url.substring(0, 100) : 'null');
        
        // URLからerrorCode/errorMessageを抽出してログ出力（可視化）
        if (url) {
          try {
            const urlObj = url.startsWith('wene://') 
              ? { searchParams: new URLSearchParams(url.split('?')[1] || '') }
              : new URL(url);
            const errorCode = urlObj.searchParams.get('errorCode');
            const errorMessage = urlObj.searchParams.get('errorMessage');
            if (errorCode || errorMessage) {
              console.error('[phantom] ===== ERROR IN INITIAL URL =====');
              console.error('[phantom] Error Code:', errorCode);
              console.error('[phantom] Error Message:', errorMessage);
              console.error('[phantom] Full URL:', url);
              console.error('[phantom] =================================');
            }
          } catch (e) {
            console.error('[phantom] Failed to parse initial URL for errors:', e);
          }
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'phantom/[action].tsx:102',message:'getInitialURL result',data:{hasUrl:url!==null,url:url?.substring(0,50)||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        // 既にURLが取得できている場合は処理
        if (await processUrlIfAvailable(url)) {
          return;
        }

        // URLが取得できていない場合、イベントリスナーを設定
        // 処理済みURLを記録するSet（同じURLは1回だけ処理）
        const handledUrlsInScreen = new Set<string>();
        
        console.log('[phantom] Setting up URL event listener...');
        listener = Linking.addEventListener('url', async (event) => {
          // wene://phantom/ で始まるURLのみ処理
          if (!event.url.startsWith('wene://phantom/')) {
            return;
          }
          
          // 既に処理したURLはスキップ（揺れ防止）
          if (handledUrlsInScreen.has(event.url)) {
            console.log('[phantom] URL already handled in screen, skipping:', event.url.substring(0, 100));
            return;
          }
          
          // URLを処理済みとして記録（エラーが起きても再実行しない）
          handledUrlsInScreen.add(event.url);
          
          console.log('[phantom] URL event received in phantom screen, full URL:', event.url);
          console.log('[phantom] URL event received, first 500 chars:', event.url.substring(0, 500));
          console.log('[phantom] URL event received, URL length:', event.url.length);
          
          // URLからerrorCode/errorMessageを抽出してログ出力（可視化）
          try {
            const urlObj = event.url.startsWith('wene://') 
              ? { searchParams: new URLSearchParams(event.url.split('?')[1] || '') }
              : new URL(event.url);
            const errorCode = urlObj.searchParams.get('errorCode');
            const errorMessage = urlObj.searchParams.get('errorMessage');
            if (errorCode || errorMessage) {
              console.error('[phantom] ===== ERROR IN URL EVENT =====');
              console.error('[phantom] Error Code:', errorCode);
              console.error('[phantom] Error Message:', errorMessage);
              console.error('[phantom] Full URL:', event.url);
              console.error('[phantom] ===============================');
            }
          } catch (e) {
            console.error('[phantom] Failed to parse URL event for errors:', e);
          }
          
          if (listener) {
            listener.remove();
            listener = null;
          }
          if (timeoutId) clearTimeout(timeoutId);
          
          try {
            if (action === 'signTransaction') {
              processSignTransactionUrl(event.url, dappSecretKey);
            } else if (action === 'connect') {
              await processConnectUrl(event.url, dappSecretKey);
            }
          } catch (error) {
            console.error('[phantom] Error processing URL:', error);
            // エラーが発生した場合でも、URLは既に処理済みとして記録されている（再実行を防ぐ）
          }
        });
        console.log('[phantom] URL event listener set up');

        // タイムアウト設定
        const timeoutDuration = action === 'signTransaction' ? 60000 : 30000;
        timeoutId = setTimeout(() => {
          if (listener) listener.remove();
          if (statusRef.current === 'processing') {
            const msg = 'Phantomからのリダイレクトがタイムアウトしました';
            setError(msg);
            setErrorMessage(msg);
            safeSetStatus('error');
          }
        }, timeoutDuration);
      } catch (error) {
        if (statusRef.current !== 'success') {
          safeSetStatus('error');
          const msg = error instanceof Error ? error.message : 'Phantom処理に失敗しました';
          setErrorMessage(msg);
          setError(msg);
        }
      }
    };

    run();

    return () => {
      if (listener) listener.remove();
      if (timeoutId) clearTimeout(timeoutId);
      // クリーンアップ時に処理中フラグをリセット
      isProcessingRef.current = false;
    };
  }, [action]); // 依存配列を最小限に（actionのみ）

  const loadingMessage =
    action === 'signTransaction' ? '署名を待っています...' : 'Phantomから戻ってきています...';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {status === 'processing' && <Loading message={loadingMessage} />}
      {status === 'error' && (
        <View style={styles.errorContainer}>
          <AppText variant="h3" style={styles.errorTitle}>
            {action === 'signTransaction' ? '署名エラー' : '接続エラー'}
          </AppText>
          <AppText variant="body" style={styles.errorMessage}>
            {errorMessage || 'Phantomへの接続に失敗しました'}
          </AppText>
          {errorMessage && errorMessage.includes('Phantom Portal') && (
            <AppText variant="body" style={[styles.errorMessage, { marginTop: theme.spacing.md, fontSize: 12 }]}>
              サポート: https://portal.phantom.app/
            </AppText>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorTitle: {
    marginBottom: theme.spacing.md,
  },
  errorMessage: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
