// ライブラリのimportを正規化（React Native / Expo / Hermes環境で確実に動く形）
import * as nacl from 'tweetnacl';
import { Linking } from 'react-native';
import { Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { setPendingSignTx, resolvePendingSignTx, rejectPendingSignTx } from './phantomSignTxPending';
import { openPhantomConnect } from '../wallet/openPhantom';

// Bufferを使用したBase64/UTF8エンコード・デコード（tweetnacl-utilの代替）
// Hermesでundefinedになりやすいtweetnacl-utilは使用禁止
function decodeBase64(b64: string): Uint8Array {
  if (typeof (globalThis as any)?.Buffer === 'undefined') {
    throw new Error('Buffer is not available');
  }
  return Uint8Array.from((globalThis as any).Buffer.from(b64, 'base64'));
}

function encodeBase64(bytes: Uint8Array): string {
  if (typeof (globalThis as any)?.Buffer === 'undefined') {
    throw new Error('Buffer is not available');
  }
  return (globalThis as any).Buffer.from(bytes).toString('base64');
}

function decodeUTF8(bytes: Uint8Array): string {
  if (typeof (globalThis as any)?.Buffer === 'undefined') {
    throw new Error('Buffer is not available');
  }
  return (globalThis as any).Buffer.from(bytes).toString('utf8');
}

function encodeUTF8(str: string): Uint8Array {
  if (typeof (globalThis as any)?.Buffer === 'undefined') {
    throw new Error('Buffer is not available');
  }
  return Uint8Array.from((globalThis as any).Buffer.from(str, 'utf8'));
}

export interface PhantomConnectParams {
  dappEncryptionPublicKey: string;
  redirectLink: string;
  cluster?: 'devnet' | 'mainnet-beta';
  appUrl: string;
}

export interface PhantomConnectResult {
  publicKey: string;
  session: string;
}

/**
 * Base64エンコード（Buffer使用）
 * tweetnacl-utilの代替として、Bufferを使用
 */
const base64Encode = (bytes: Uint8Array): string => {
  return encodeBase64(bytes);
};

/**
 * Base64デコード（Buffer使用）
 * tweetnacl-utilの代替として、Bufferを使用
 */
const base64Decode = (str: string): Uint8Array => {
  return decodeBase64(str);
};

/**
 * Phantom Connect用の暗号化キーペアを生成
 */
export const generateEncryptionKeyPair = (): nacl.BoxKeyPair => {
  return nacl.box.keyPair();
}

/**
 * Phantom Connect URLを生成
 */
export const buildPhantomConnectUrl = (params: PhantomConnectParams): string => {
  const { dappEncryptionPublicKey, redirectLink, cluster = 'devnet', appUrl } = params;
  
  console.log('[buildPhantomConnectUrl] Input params:', {
    dappEncryptionPublicKey: dappEncryptionPublicKey.substring(0, 50) + '...',
    redirectLink,
    cluster,
    appUrl,
    dappKeyLength: dappEncryptionPublicKey.length
  });
  
  // dapp_encryption_public_keyの形式を確認（bs58エンコードされたCurve25519公開鍵）
  // nacl.box.keyPair()で生成される公開鍵は32バイト、bs58エンコードで約44文字
  // bs58文字列はBase58文字（1-9, A-H, J-N, P-Z, a-k, m-z）のみ
  const isValidBs58 = /^[1-9A-HJ-NP-Za-km-z]+$/.test(dappEncryptionPublicKey);
  if (!isValidBs58) {
    console.error('[buildPhantomConnectUrl] Invalid bs58 format for dapp_encryption_public_key');
  }
  
  // URLSearchParamsを使用してURLを生成（手連結/二重encode禁止）
  const url = new URL('https://phantom.app/ul/v1/connect');
  
  // パラメータをPhantomのドキュメントに従って設定
  // 1. dapp_encryption_public_key（必須、bs58エンコードされたCurve25519公開鍵）
  url.searchParams.set('dapp_encryption_public_key', dappEncryptionPublicKey);
  
  // 2. redirect_link（必須、カスタムスキームまたはHTTPS URL）
  // searchParams.setが自動的にURLエンコードする（二重encodeを防ぐ）
  url.searchParams.set('redirect_link', redirectLink);
  
  // 3. app_url（必須、HTTPSスキーム）
  url.searchParams.set('app_url', appUrl);
  
  // 4. cluster（オプション、devnetまたはmainnet-beta、デフォルトはdevnet）
  url.searchParams.set('cluster', cluster);
  
  const finalUrl = url.toString();
  console.log('[buildPhantomConnectUrl] ===== CONNECT URL GENERATED =====');
  console.log('[buildPhantomConnectUrl] Final URL (decoded for debugging):');
  console.log('[buildPhantomConnectUrl]   dapp_encryption_public_key (bs58):', dappEncryptionPublicKey.substring(0, 50) + '...', `(length: ${dappEncryptionPublicKey.length})`);
  console.log('[buildPhantomConnectUrl]   redirect_link:', redirectLink);
  console.log('[buildPhantomConnectUrl]   app_url:', appUrl);
  console.log('[buildPhantomConnectUrl]   cluster:', cluster);
  console.log('[buildPhantomConnectUrl] Final URL (encoded):', finalUrl.substring(0, 300) + '...');
  console.log('[buildPhantomConnectUrl] ===================================');
  
  return finalUrl;
};

/**
 * PhantomからのリダイレクトURLを解析
 * 形式: wene://phantom/connect?data=...&nonce=...&phantom_encryption_public_key=...
 * React NativeではカスタムスキームのURLをnew URL()でパースできない場合があるため、
 * 手動でパースする
 */
export const parsePhantomRedirect = (url: string): { data: string; nonce: string } | null => {
  try {
    console.log('[parsePhantomRedirect] Full URL:', url);
    console.log('[parsePhantomRedirect] URL length:', url.length);
    
    // URLからフラグメント（#）を除去
    const urlWithoutFragment = url.split('#')[0];
    
    // カスタムスキーム（wene://）の場合、手動でパース
    if (urlWithoutFragment.startsWith('wene://')) {
      // wene://phantom/connect?data=...&nonce=... の形式
      const queryIndex = urlWithoutFragment.indexOf('?');
      if (queryIndex === -1) {
        console.error('[parsePhantomRedirect] No query string found in URL:', urlWithoutFragment);
        return null;
      }
      
      const queryString = urlWithoutFragment.substring(queryIndex + 1);
      console.log('[parsePhantomRedirect] Query string:', queryString.substring(0, 200));
      
      // URLSearchParamsを使用してパース
      const params = new URLSearchParams(queryString);
      
      // すべてのパラメータをログ出力
      const allParams: Record<string, string> = {};
      params.forEach((value, key) => {
        allParams[key] = value.substring(0, 50) + (value.length > 50 ? '...' : '');
      });
      console.log('[parsePhantomRedirect] All params keys:', Object.keys(allParams));
      console.log('[parsePhantomRedirect] All params (truncated):', allParams);
      
      const data = params.get('data');
      const nonce = params.get('nonce');
      
      console.log('[parsePhantomRedirect] Extracted params:', { 
        hasData: !!data, 
        hasNonce: !!nonce,
        dataLength: data?.length || 0,
        nonceLength: nonce?.length || 0,
        dataPreview: data ? data.substring(0, 50) + '...' : null,
        noncePreview: nonce ? nonce.substring(0, 50) + '...' : null
      });
      
      if (!data) {
        console.error('[parsePhantomRedirect] Missing data parameter');
        return null;
      }
      
      if (!nonce) {
        console.error('[parsePhantomRedirect] Missing nonce parameter');
        return null;
      }
      
      return { data, nonce };
    }
    
    // HTTPSスキームの場合、通常のURLパースを使用
    try {
      const parsed = new URL(urlWithoutFragment);
      const data = parsed.searchParams.get('data');
      const nonce = parsed.searchParams.get('nonce');
      
      console.log('[parsePhantomRedirect] HTTPS scheme - Extracted params:', { 
        hasData: !!data, 
        hasNonce: !!nonce,
        dataLength: data?.length || 0,
        nonceLength: nonce?.length || 0
      });
      
      if (!data || !nonce) {
        console.error('[parsePhantomRedirect] Missing data or nonce in parsed URL');
        return null;
      }
      
      return { data, nonce };
    } catch (urlError) {
      console.error('[parsePhantomRedirect] Error parsing HTTPS URL:', urlError);
      return null;
    }
  } catch (error) {
    console.error('[parsePhantomRedirect] Error parsing URL:', error);
    console.error('[parsePhantomRedirect] Error stack:', error instanceof Error ? error.stack : String(error));
    return null;
  }
};

/**
 * Phantomからの暗号化データを復号
 * 
 * @param encryptedData - bs58エンコードされた暗号化データ
 * @param nonce - bs58エンコードされたnonce
 * @param dappSecretKey - dApp側の秘密鍵（Uint8Array）
 * @param phantomPublicKey - Phantom側の公開鍵（bs58エンコード）
 */
export const decryptPhantomResponse = (
  encryptedData: string,
  nonce: string,
  dappSecretKey: Uint8Array,
  phantomPublicKey: string
): PhantomConnectResult | null => {
  // typeofログを追加（undefinedな関数を特定するため）
  console.log('[decryptPhantomResponse] ===== TYPE CHECK START =====');
  console.log('[decryptPhantomResponse] typeof bs58:', typeof bs58);
  console.log('[decryptPhantomResponse] typeof bs58.decode:', typeof (bs58?.decode));
  console.log('[decryptPhantomResponse] typeof nacl:', typeof nacl);
  console.log('[decryptPhantomResponse] typeof nacl.box:', typeof (nacl?.box));
  console.log('[decryptPhantomResponse] typeof nacl.box.open:', typeof (nacl?.box?.open));
  console.log('[decryptPhantomResponse] typeof TextDecoder:', typeof TextDecoder);
  console.log('[decryptPhantomResponse] typeof JSON:', typeof JSON);
  console.log('[decryptPhantomResponse] typeof JSON.parse:', typeof JSON?.parse);
  console.log('[decryptPhantomResponse] typeof globalThis:', typeof globalThis);
  console.log('[decryptPhantomResponse] typeof globalThis.Buffer:', typeof (globalThis as any)?.Buffer);
  console.log('[decryptPhantomResponse] ===== TYPE CHECK END =====');
  
  try {
    console.log('[decryptPhantomResponse] Starting decryption...');
    console.log('[decryptPhantomResponse] encryptedData length:', encryptedData.length);
    console.log('[decryptPhantomResponse] nonce length:', nonce.length);
    console.log('[decryptPhantomResponse] phantomPublicKey length:', phantomPublicKey.length);
    
    // Phantomからのレスポンスはbs58エンコードされている
    // dataとnonceはbs58、phantom_encryption_public_keyもbs58
    if (typeof bs58 === 'undefined' || typeof bs58.decode !== 'function') {
      throw new Error('bs58.decode is not available');
    }
    
    const encrypted = bs58.decode(encryptedData);
    const nonceBytes = bs58.decode(nonce);
    const phantomPubkeyBytes = bs58.decode(phantomPublicKey);
    
    if (typeof nacl === 'undefined' || typeof nacl.box === 'undefined' || typeof nacl.box.open !== 'function') {
      throw new Error('nacl.box.open is not available');
    }
    
    console.log('[decryptPhantomResponse] Decoded lengths:', {
      encrypted: encrypted.length,
      nonce: nonceBytes.length,
      phantomPubkey: phantomPubkeyBytes.length
    });
    
    // 復号（nacl.box.open）
    const decrypted = nacl.box.open(encrypted, nonceBytes, phantomPubkeyBytes, dappSecretKey);
    
    if (!decrypted) {
      console.error('[decryptPhantomResponse] Failed to decrypt - nacl.box.open returned null');
      return null;
    }
    
    console.log('[decryptPhantomResponse] Decryption successful, decrypted length:', decrypted.length);
    
    // JSONパース（TextDecoderの代わりにBufferを使用）
    const result = JSON.parse(decodeUTF8(decrypted));
    console.log('[decryptPhantomResponse] Parsed result keys:', Object.keys(result));
    
    return {
      publicKey: result.public_key || result.publicKey,
      session: result.session,
    };
  } catch (error) {
    console.error('[decryptPhantomResponse] Failed to decrypt Phantom response:', error);
    console.error('[decryptPhantomResponse] Error details:', {
      encryptedDataLength: encryptedData?.length,
      nonceLength: nonce?.length,
      phantomPublicKeyLength: phantomPublicKey?.length,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
};

/**
 * Phantom Connectを開始
 */
export const initiatePhantomConnect = async (
  dappEncryptionPublicKey: string,
  dappSecretKey: Uint8Array,
  redirectLink: string = 'wene://phantom/connect',
  cluster: 'devnet' | 'mainnet-beta' = 'devnet',
  appUrl: string = 'https://wene.app'
): Promise<void> => {
  const url = buildPhantomConnectUrl({
    dappEncryptionPublicKey,
    redirectLink,
    cluster,
    appUrl,
  });
  
  // openPhantomConnectを使用（canOpenURL依存を排除）
  await openPhantomConnect(url);
};

// --- signTransaction ---

export interface PhantomSignTransactionParams {
  tx: Transaction;
  session: string;
  dappEncryptionPublicKey: string;
  dappSecretKey: Uint8Array;
  phantomEncryptionPublicKey: string;
  redirectLink?: string;
  cluster?: 'devnet' | 'mainnet-beta';
  appUrl?: string;
}

/**
 * Phantom signTransaction URL を生成
 * payload: { transaction: base64, session } を暗号化して base58
 */
export const buildPhantomSignTransactionUrl = (params: PhantomSignTransactionParams): string => {
  const {
    tx,
    session,
    dappEncryptionPublicKey,
    dappSecretKey,
    phantomEncryptionPublicKey,
    redirectLink = 'wene://phantom/signTransaction',
    cluster = 'devnet',
    appUrl = 'https://wene.app',
  } = params;

  const nonce = nacl.randomBytes(24);
  const phantomPk = bs58.decode(phantomEncryptionPublicKey);

  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const transactionBase64 = base64Encode(new Uint8Array(serialized));
  const payloadJson = JSON.stringify({ transaction: transactionBase64, session });
  // TextEncoderの代わりにBufferを使用
  const payloadBytes = encodeUTF8(payloadJson);

  const encrypted = nacl.box(
    payloadBytes,
    nonce,
    phantomPk,
    dappSecretKey
  );

  if (!encrypted) {
    throw new Error('Failed to encrypt signTransaction payload');
  }

  const url = new URL('https://phantom.app/ul/v1/signTransaction');
  url.searchParams.set('dapp_encryption_public_key', dappEncryptionPublicKey);
  url.searchParams.set('nonce', bs58.encode(nonce));
  url.searchParams.set('redirect_link', redirectLink);
  url.searchParams.set('payload', bs58.encode(encrypted));
  url.searchParams.set('app_url', appUrl);
  url.searchParams.set('cluster', cluster);

  return url.toString();
};

/**
 * Phantom signTransaction リダイレクトの復号
 * 応答: { signed_transaction: base64 }
 */
export const decryptPhantomSignTransactionResponse = (
  encryptedData: string,
  nonce: string,
  dappSecretKey: Uint8Array,
  phantomPublicKey: string
): Transaction | null => {
  // typeofログを追加（undefinedな関数を特定するため）
  console.log('[decryptPhantomSignTransactionResponse] ===== TYPE CHECK START =====');
  console.log('[decryptPhantomSignTransactionResponse] typeof base64Decode:', typeof base64Decode);
  console.log('[decryptPhantomSignTransactionResponse] typeof bs58:', typeof bs58);
  console.log('[decryptPhantomSignTransactionResponse] typeof bs58.decode:', typeof (bs58?.decode));
  console.log('[decryptPhantomSignTransactionResponse] typeof nacl:', typeof nacl);
  console.log('[decryptPhantomSignTransactionResponse] typeof nacl.box:', typeof (nacl?.box));
  console.log('[decryptPhantomSignTransactionResponse] typeof nacl.box.open:', typeof (nacl?.box?.open));
  console.log('[decryptPhantomSignTransactionResponse] typeof Transaction:', typeof Transaction);
  console.log('[decryptPhantomSignTransactionResponse] typeof Transaction.from:', typeof (Transaction?.from));
  console.log('[decryptPhantomSignTransactionResponse] typeof TextDecoder:', typeof TextDecoder);
  console.log('[decryptPhantomSignTransactionResponse] typeof JSON:', typeof JSON);
  console.log('[decryptPhantomSignTransactionResponse] typeof JSON.parse:', typeof JSON?.parse);
  console.log('[decryptPhantomSignTransactionResponse] ===== TYPE CHECK END =====');
  
  try {
    // 注意: signTransactionのレスポンスはbase64エンコードされている可能性がある
    // ただし、connectのレスポンスはbs58なので、統一する必要があるかもしれない
    // まずはbase64で試す
    if (typeof base64Decode !== 'function') {
      throw new Error('base64Decode is not available');
    }
    
    const encrypted = base64Decode(encryptedData);
    const nonceBytes = base64Decode(nonce);
    const phantomPk = base64Decode(phantomPublicKey);

    if (typeof nacl === 'undefined' || typeof nacl.box === 'undefined' || typeof nacl.box.open !== 'function') {
      throw new Error('nacl.box.open is not available');
    }

    const decrypted = nacl.box.open(encrypted, nonceBytes, phantomPk, dappSecretKey);
    if (!decrypted) {
      return null;
    }
    
    if (typeof JSON === 'undefined' || typeof JSON.parse !== 'function') {
      throw new Error('JSON.parse is not available');
    }

    // TextDecoderの代わりにBufferを使用
    const result = JSON.parse(decodeUTF8(decrypted));
    const signedB64 = result.signed_transaction ?? result.signedTransaction;
    if (!signedB64) {
      return null;
    }

    const signedBuf = base64Decode(signedB64);
    
    if (typeof Transaction === 'undefined' || typeof Transaction.from !== 'function') {
      throw new Error('Transaction.from is not available');
    }
    
    return Transaction.from(signedBuf);
  } catch (error) {
    console.error('[decryptPhantomSignTransactionResponse] Failed to decrypt signTransaction response:', error);
    console.error('[decryptPhantomSignTransactionResponse] Error details:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
};

/**
 * Phantom signTransaction を開始
 * リダイレクト待ちの Promise を返す。handleRedirect で resolve/reject される。
 */
export const signTransaction = async (
  params: PhantomSignTransactionParams
): Promise<Transaction> => {
  const url = buildPhantomSignTransactionUrl(params);

  return new Promise<Transaction>((resolve, reject) => {
    setPendingSignTx(resolve, reject);

    // openPhantomConnectを使用（canOpenURL依存を排除）
    openPhantomConnect(url)
      .then(() => {
        // 成功時は何もしない（リダイレクト待ち）
      })
      .catch((err) => {
        rejectPendingSignTx(err instanceof Error ? err : new Error(String(err)));
      });
  });
};

/**
 * signTransaction リダイレクト処理
 * URL を解析し、復号して signed Transaction を取得し、待機中 Promise を resolve/reject する。
 * action=signTransaction のときだけ呼ぶ。
 */
export const handleRedirect = (
  url: string,
  dappSecretKey: Uint8Array
): { ok: true; tx: Transaction } | { ok: false; error: string } => {
  // 【対応2】phantom.handleRedirect 冒頭で犯人特定ログを出す
  console.log('[phantom] handleRedirect called with url:', url);
  console.log('[phantom] typeof Buffer:', typeof (globalThis as any)?.Buffer);
  console.log('[phantom] typeof nacl.box.open:', typeof nacl?.box?.open);
  console.log('[phantom] typeof bs58.encode:', typeof bs58?.encode);
  console.log('[phantom] typeof bs58.decode:', typeof bs58?.decode);
  console.log('[phantom] typeof base64Decode:', typeof base64Decode);
  console.log('[phantom] typeof parsePhantomRedirect:', typeof parsePhantomRedirect);
  console.log('[phantom] typeof decryptPhantomSignTransactionResponse:', typeof decryptPhantomSignTransactionResponse);
  console.log('[phantom] typeof Transaction:', typeof Transaction);
  console.log('[phantom] typeof Transaction.from:', typeof Transaction?.from);
  
  const parsed = parsePhantomRedirect(url);
  if (!parsed) {
    return { ok: false, error: 'Invalid redirect URL' };
  }

  // URLからphantom_encryption_public_keyを取得
  let phantomPublicKey: string | null = null;
  try {
    if (url.startsWith('wene://')) {
      // カスタムスキームの場合、手動でパース
      const queryString = url.split('?')[1];
      if (queryString) {
        const params = new URLSearchParams(queryString);
        phantomPublicKey = params.get('phantom_encryption_public_key');
      }
    } else {
      // HTTPSスキームの場合
      const urlObj = new URL(url);
      phantomPublicKey = urlObj.searchParams.get('phantom_encryption_public_key');
    }
  } catch (error) {
    console.error('[handleRedirect] Error parsing URL for phantom_encryption_public_key:', error);
    return { ok: false, error: 'Failed to parse URL' };
  }
  
  if (!phantomPublicKey) {
    return { ok: false, error: 'Phantom public key not found' };
  }

  const tx = decryptPhantomSignTransactionResponse(
    parsed.data,
    parsed.nonce,
    dappSecretKey,
    phantomPublicKey
  );

  if (!tx) {
    rejectPendingSignTx(new Error('Failed to decrypt signed transaction'));
    return { ok: false, error: 'Failed to decrypt signed transaction' };
  }

  resolvePendingSignTx(tx);
  return { ok: true, tx };
};
