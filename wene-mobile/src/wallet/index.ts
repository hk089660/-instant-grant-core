import { Platform } from 'react-native';
import { MockWalletAdapter } from './MockWalletAdapter';
import { PhantomWalletAdapter } from './PhantomWalletAdapter';
import type { WalletAdapter } from './WalletAdapter';

/**
 * 環境に応じたWalletAdapterを取得
 * - iOS Simulator / 開発環境: MockWalletAdapter
 * - 実機（iOS/Android）: PhantomWalletAdapter
 */
export function getWalletAdapter(): WalletAdapter {
  // 環境変数で強制的にMockを使用する場合
  if (process.env.EXPO_PUBLIC_USE_MOCK_WALLET === 'true') {
    return new MockWalletAdapter();
  }

  // iOS Simulatorの場合はMockを使用
  if (Platform.OS === 'ios' && __DEV__) {
    // Simulator判定（簡易版：実機がない場合のフォールバック）
    // 実際には、Phantomアプリがインストールされているかで判定する方が良い
    return new MockWalletAdapter();
  }

  // デフォルトはPhantom
  return new PhantomWalletAdapter();
}

export { MockWalletAdapter, PhantomWalletAdapter };
export type { WalletAdapter, WalletConnectResult } from './WalletAdapter';
