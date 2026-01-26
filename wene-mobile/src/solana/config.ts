/**
 * Solana Configuration
 * 
 * 【安定性のポイント】
 * - Program ID は一箇所で定義（Anchor.toml, declare_id!() と一致）
 * - Cluster は devnet 固定（環境変数で切り替えない）
 * - Connection は singleton.ts で管理
 */

import { PublicKey, Cluster, clusterApiUrl } from '@solana/web3.js';

// ============================================================
// Program ID（固定）
// ============================================================

/**
 * Grant Program ID
 * 
 * 【一致確認済み】
 * - Anchor.toml: grant_program = "8SVRtAyWXcd47PKeeMSGpC1oQFNt2yM865M46QgjKUZ"
 * - declare_id!("8SVRtAyWXcd47PKeeMSGpC1oQFNt2yM865M46QgjKUZ")
 * - IDL address: "8SVRtAyWXcd47PKeeMSGpC1oQFNt2yM865M46QgjKUZ"
 */
export const GRANT_PROGRAM_ID = new PublicKey(
  '8SVRtAyWXcd47PKeeMSGpC1oQFNt2yM865M46QgjKUZ'
);

// ============================================================
// Cluster 設定（devnet 固定）
// ============================================================

/**
 * Cluster は devnet 固定
 * 環境変数や条件分岐で切り替えない
 */
export const CLUSTER: Cluster = 'devnet';

/**
 * RPC URL（devnet 固定）
 */
export const RPC_URL: string = clusterApiUrl(CLUSTER);

// ============================================================
// 後方互換性のための関数（非推奨）
// ============================================================

/**
 * @deprecated singleton.ts の getConnection() を使用してください
 */
export const getRpcUrl = (): string => RPC_URL;

/**
 * @deprecated CLUSTER 定数を直接使用してください
 */
export const getCluster = (): Cluster => CLUSTER;
