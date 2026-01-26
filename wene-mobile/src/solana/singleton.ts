/**
 * Solana Singleton Manager
 * 
 * Connection / Provider / Program を単一インスタンスで管理し、
 * Hot Reload や re-render で再生成されることを防ぐ。
 * 
 * 【安定性のポイント】
 * - モジュールスコープでインスタンスを保持
 * - 一度生成したら再利用（lazy singleton）
 * - cluster は devnet 固定（環境変数で切り替えない）
 */

import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { GRANT_PROGRAM_ID } from './config';
import idl from '../idl/grant_program.json';

// ============================================================
// 定数（固定値）
// ============================================================

/** 
 * Cluster は devnet 固定
 * 環境変数や条件分岐で切り替えない
 */
export const CLUSTER = 'devnet' as const;

/**
 * RPC URL は devnet 固定
 * clusterApiUrl を使用して公式エンドポイントを取得
 */
export const RPC_URL = clusterApiUrl(CLUSTER);

// ============================================================
// Singleton インスタンス（モジュールスコープで保持）
// ============================================================

let _connection: Connection | null = null;
let _provider: AnchorProvider | null = null;
let _program: Program | null = null;
let _readonlyKeypair: Keypair | null = null;

// ============================================================
// Getter 関数（遅延初期化 + 再利用）
// ============================================================

/**
 * Connection を取得（シングルトン）
 * 
 * 【安定性】
 * - 一度生成したら同じインスタンスを返す
 * - Hot Reload でも再生成されない
 */
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_URL, {
      commitment: 'confirmed',
      // WebSocket の自動再接続を有効化
      wsEndpoint: RPC_URL.replace('https://', 'wss://'),
    });
  }
  return _connection;
}

/**
 * 読み取り専用 Keypair を取得（シングルトン）
 * 
 * 【安定性】
 * - 署名不要な操作用のダミーキーペア
 * - 毎回 Keypair.generate() しないことでオーバーヘッド削減
 */
export function getReadonlyKeypair(): Keypair {
  if (!_readonlyKeypair) {
    _readonlyKeypair = Keypair.generate();
  }
  return _readonlyKeypair;
}

/**
 * AnchorProvider を取得（シングルトン）
 * 
 * 【安定性】
 * - Connection と Keypair を再利用
 * - 署名が必要な場合は別途 Phantom で行う
 */
export function getProvider(): AnchorProvider {
  if (!_provider) {
    const connection = getConnection();
    const keypair = getReadonlyKeypair();
    const wallet = new Wallet(keypair);
    _provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
  }
  return _provider;
}

/**
 * Grant Program インスタンスを取得（シングルトン）
 * 
 * 【安定性】
 * - IDL は静的 import（自動 fetch しない）
 * - Program ID は IDL 内の address と一致を検証
 */
export function getProgram(): Program {
  if (!_program) {
    const provider = getProvider();
    
    // IDL 内の address と GRANT_PROGRAM_ID の一致を検証
    const idlAddress = (idl as any).address;
    if (idlAddress !== GRANT_PROGRAM_ID.toBase58()) {
      console.warn(
        `[singleton] IDL address mismatch: IDL=${idlAddress}, config=${GRANT_PROGRAM_ID.toBase58()}`
      );
    }
    
    _program = new Program(idl as any, provider);
  }
  return _program;
}

// ============================================================
// 状態確認・リセット（デバッグ/テスト用）
// ============================================================

/**
 * シングルトンの状態を確認
 */
export function getSingletonStatus(): {
  hasConnection: boolean;
  hasProvider: boolean;
  hasProgram: boolean;
  rpcUrl: string;
  cluster: string;
  programId: string;
} {
  return {
    hasConnection: _connection !== null,
    hasProvider: _provider !== null,
    hasProgram: _program !== null,
    rpcUrl: RPC_URL,
    cluster: CLUSTER,
    programId: GRANT_PROGRAM_ID.toBase58(),
  };
}

/**
 * シングルトンをリセット（テスト用、本番では使用しない）
 */
export function resetSingletons(): void {
  _connection = null;
  _provider = null;
  _program = null;
  _readonlyKeypair = null;
}
