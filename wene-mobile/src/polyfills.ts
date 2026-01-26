/**
 * React Native 用ポリフィル
 * @solana/web3.js 等が Buffer を参照するため、アプリ起動時に global に設定する
 * tweetnacl が crypto.getRandomValues を必要とするため、polyfill を追加
 * 
 * 注意: Buffer polyfillは app/_layout.tsx の最上部で設定されるため、
 * ここでは既に設定されていることを前提とする
 */
import { Buffer } from 'buffer';

// crypto.getRandomValues の polyfill (tweetnacl用)
// React Native では crypto.getRandomValues が利用できないため、polyfill を設定
if (typeof global !== 'undefined') {
  // Buffer の設定（既に _layout.tsx で設定されているが、念のため再設定）
  // Bufferがundefinedでないことを確認してから設定
  if (typeof Buffer !== 'undefined') {
    if (!(global as any).Buffer) {
      (global as typeof globalThis & { Buffer?: typeof Buffer }).Buffer = Buffer;
    }
    
    // globalThisにも設定（念のため）
    if (typeof globalThis !== 'undefined' && !(globalThis as any).Buffer) {
      (globalThis as any).Buffer = Buffer;
    }
  } else {
    console.error('[polyfills] Buffer is undefined - this should not happen if _layout.tsx is loaded first');
  }
  
  // crypto.getRandomValues の polyfill (tweetnacl用)
  if (!global.crypto) {
    (global as any).crypto = {} as Crypto;
  }
  
  if (!global.crypto.getRandomValues) {
    // React Native のランダム値生成を使用
    // Uint8Array, Uint16Array, Uint32Array に対応
    const getRandomValues = (array: Uint8Array | Uint16Array | Uint32Array): Uint8Array | Uint16Array | Uint32Array => {
      if (array instanceof Uint8Array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      } else if (array instanceof Uint16Array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 65536);
        }
      } else if (array instanceof Uint32Array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 4294967296);
        }
      }
      return array;
    };
    
    global.crypto.getRandomValues = getRandomValues;
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'polyfills.ts:15',message:'Buffer set on global',data:{hasBuffer:typeof (global as any).Buffer!=='undefined',bufferType:typeof (global as any).Buffer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
} else {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'polyfills.ts:18',message:'global is undefined',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
}
