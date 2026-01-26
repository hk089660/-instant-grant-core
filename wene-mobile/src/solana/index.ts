/**
 * Solana Module Index
 * 
 * 【推奨インポート方法】
 * import { getConnection, getProgram, GRANT_PROGRAM_ID } from '@/solana';
 * 
 * 【安定性のポイント】
 * - singleton.ts の関数を優先的にエクスポート
 * - 後方互換性のために anchorClient.ts も維持
 */

// ============================================================
// 推奨: Singleton 関数（一度生成したら再利用）
// ============================================================
export {
  // Connection / Provider / Program
  getConnection,
  getProvider,
  getProgram,
  getReadonlyKeypair,
  // 定数
  CLUSTER,
  RPC_URL,
  // ステータス確認（デバッグ用）
  getSingletonStatus,
  resetSingletons,
} from './singleton';

// ============================================================
// 定数
// ============================================================
export { GRANT_PROGRAM_ID } from './config';

// ============================================================
// PDA 計算・トランザクション構築
// ============================================================
export {
  getGrantPda,
  getVaultPda,
  getReceiptPda,
  calculatePeriodIndex,
  buildClaimGrantTransaction,
  fetchGrantInfo,
} from './grantProgram';

// ============================================================
// トランザクション送信
// ============================================================
export { sendSignedTx } from './sendTx';

// ============================================================
// トランザクションビルダー
// ============================================================
export {
  buildClaimTx,
  buildUseTx,
  type BuildClaimTxParams,
  type BuildClaimTxResult,
  type BuildUseTxParams,
  type BuildUseTxResult,
} from './txBuilders';
