/**
 * Anchor Client
 * 
 * 【安定性のポイント】
 * - Connection / Provider / Program は singleton.ts で管理
 * - IDL は静的 import（自動 fetch しない）
 * - デバッグログ削除
 * 
 * このファイルは後方互換性のために残しているが、
 * 新規コードでは singleton.ts を直接使用することを推奨
 */

import { Connection } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import {
  getConnection as getSingletonConnection,
  getProvider as getSingletonProvider,
  getProgram as getSingletonProgram,
} from './singleton';

// ============================================================
// 後方互換性のための re-export
// ============================================================

/**
 * Solana接続を取得（シングルトン）
 * 
 * @deprecated singleton.ts の getConnection() を直接使用してください
 */
export const getConnection = (): Connection => {
  return getSingletonConnection();
};

/**
 * Anchor Providerを取得（シングルトン、readonly wallet）
 * 
 * @deprecated singleton.ts の getProvider() を直接使用してください
 */
export const getProvider = (): AnchorProvider => {
  return getSingletonProvider();
};

/**
 * Grant Programインスタンスを取得（シングルトン）
 * 
 * @deprecated singleton.ts の getProgram() を直接使用してください
 */
export const getProgram = (): Program => {
  return getSingletonProgram();
};

// IDL の型定義をエクスポート（必要に応じて）
export type GrantProgram = Program;
