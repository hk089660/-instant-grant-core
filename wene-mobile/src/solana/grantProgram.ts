// Anchor Program SDK
// 注意: 実際の実装では、IDLファイルを読み込んでProgramインスタンスを作成する必要があります
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';

// Program ID
import { GRANT_PROGRAM_ID } from './config';

// IDL型定義（簡易版 - 実際のIDLから生成することを推奨）
export interface GrantProgram {
  version: string;
  name: string;
  instructions: Array<{
    name: string;
    accounts: Array<any>;
    args: Array<any>;
  }>;
  accounts: Array<any>;
  types: Array<any>;
}

/**
 * Grant PDAを計算
 */
export const getGrantPda = (
  authority: PublicKey,
  mint: PublicKey,
  grantId: bigint,
  programId: PublicKey = GRANT_PROGRAM_ID
): [PublicKey, number] => {
  // Bufferが利用可能であることを確認
  if (typeof Buffer === 'undefined' || !Buffer.alloc) {
    throw new Error('Buffer is not available. Make sure Buffer polyfill is loaded.');
  }
  
  const grantIdBytes = Buffer.alloc(8);
  grantIdBytes.writeBigUInt64LE(grantId, 0);
  
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('grant'),
      authority.toBuffer(),
      mint.toBuffer(),
      grantIdBytes,
    ],
    programId
  );
};

/**
 * Vault PDAを計算
 */
export const getVaultPda = (
  grant: PublicKey,
  programId: PublicKey = GRANT_PROGRAM_ID
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), grant.toBuffer()],
    programId
  );
};

/**
 * Receipt PDAを計算
 */
export const getReceiptPda = (
  grant: PublicKey,
  claimer: PublicKey,
  periodIndex: bigint,
  programId: PublicKey = GRANT_PROGRAM_ID
): [PublicKey, number] => {
  // Bufferが利用可能であることを確認
  if (typeof Buffer === 'undefined' || !Buffer.alloc) {
    throw new Error('Buffer is not available. Make sure Buffer polyfill is loaded.');
  }
  
  const periodIndexBytes = Buffer.alloc(8);
  periodIndexBytes.writeBigUInt64LE(periodIndex, 0);
  
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('receipt'),
      grant.toBuffer(),
      claimer.toBuffer(),
      periodIndexBytes,
    ],
    programId
  );
};

/**
 * 現在のperiod_indexを計算
 */
export const calculatePeriodIndex = (
  startTs: bigint,
  periodSeconds: bigint,
  currentTs?: bigint
): bigint => {
  const now = currentTs || BigInt(Math.floor(Date.now() / 1000));
  const elapsed = now - startTs;
  if (elapsed < 0) {
    return BigInt(0);
  }
  return elapsed / periodSeconds;
};

/**
 * Claim Grantトランザクションを構築
 * 注意: 署名は呼び出し側で行う（Phantomなど）
 */
export const buildClaimGrantTransaction = async (
  connection: Connection,
  claimer: PublicKey,
  params: {
    authority: PublicKey;
    mint: PublicKey;
    grantId: bigint;
    periodIndex: bigint;
  }
): Promise<Transaction> => {
  const { authority, mint, grantId, periodIndex } = params;
  
  // PDAを計算
  const [grantPda] = getGrantPda(authority, mint, grantId);
  const [vaultPda] = getVaultPda(grantPda);
  const [receiptPda] = getReceiptPda(grantPda, claimer, periodIndex);
  
  // 受給者のATAを取得/作成
  const claimerAta = await getAssociatedTokenAddress(mint, claimer);
  
  // ATAが存在しない場合は作成命令を追加
  const transaction = new Transaction();
  try {
    await getAccount(connection, claimerAta);
  } catch {
    // ATAが存在しない場合は作成命令を追加
    transaction.add(
      createAssociatedTokenAccountInstruction(
        claimer,
        claimerAta,
        claimer,
        mint
      )
    );
  }
  
  // 注意: 実際の実装では、Anchor ProgramのIDLを使って
  // program.methods.claimGrant(periodIndex).accounts({...}).instruction()
  // を呼び出す必要があります。
  // ここではスタブとして、空のトランザクションを返します。
  
  // TODO: Anchor ProgramのIDLを読み込んで、実際のinstructionを構築
  // const program = new Program(idl, GRANT_PROGRAM_ID, provider);
  // const instruction = await program.methods
  //   .claimGrant(new BN(periodIndex.toString()))
  //   .accounts({
  //     grant: grantPda,
  //     mint,
  //     vault: vaultPda,
  //     claimer,
  //     claimerAta,
  //     receipt: receiptPda,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     systemProgram: SystemProgram.programId,
  //     rent: SYSVAR_RENT_PUBKEY,
  //   })
  //   .instruction();
  // transaction.add(instruction);
  
  return transaction;
};

/**
 * Grant情報を取得（簡易版）
 */
export const fetchGrantInfo = async (
  connection: Connection,
  authority: PublicKey,
  mint: PublicKey,
  grantId: bigint
): Promise<{
  grant: PublicKey;
  vault: PublicKey;
  amountPerPeriod: bigint;
  periodSeconds: bigint;
  startTs: bigint;
  expiresAt: bigint;
} | null> => {
  try {
    const [grantPda] = getGrantPda(authority, mint, grantId);
    const [vaultPda] = getVaultPda(grantPda);
    
    // 注意: 実際の実装では、Anchor Programのaccount.fetch()を使う
    // const program = new Program(idl, GRANT_PROGRAM_ID, provider);
    // const grantAccount = await program.account.grant.fetch(grantPda);
    
    // スタブ: ダミーデータを返す
    return {
      grant: grantPda,
      vault: vaultPda,
      amountPerPeriod: BigInt(1000), // ダミー
      periodSeconds: BigInt(2592000), // 30日
      startTs: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1日前
      expiresAt: BigInt(0), // 無期限
    };
  } catch {
    return null;
  }
};
