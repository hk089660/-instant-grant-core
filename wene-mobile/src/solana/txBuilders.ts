import { Transaction, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  createBurnInstruction,
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { GRANT_PROGRAM_ID } from './config';
import { getConnection, getProgram } from './anchorClient';
import { getGrantPda, getVaultPda, getReceiptPda, calculatePeriodIndex } from './grantProgram';

/**
 * Claim Transaction 構築パラメータ
 */
export interface BuildClaimTxParams {
  campaignId: string;
  code?: string;
  recipientPubkey: PublicKey;
}

/**
 * Claim Transaction 構築結果
 */
export interface BuildClaimTxResult {
  tx: Transaction;
  meta: {
    feePayer: PublicKey | null;
    recentBlockhash: string | null;
    instructionCount: number;
    grantPda: PublicKey;
    vaultPda: PublicKey;
    receiptPda: PublicKey;
    claimerAta: PublicKey;
    periodIndex: bigint;
  };
}

/**
 * Claim Grant トランザクションを構築
 * 
 * 注意: 署名・送信は行わない。構築のみ。
 * 
 * TODO: campaignId/code から authority/mint/grantId を取得するAPIが必要
 * 現時点では、これらの情報を取得する方法が未確定のため、
 * パラメータとして直接受け取る形に変更する可能性がある
 */
export async function buildClaimTx(
  params: BuildClaimTxParams
): Promise<BuildClaimTxResult> {
  // typeofチェックを追加（undefinedな関数を特定するため）
  console.log('[buildClaimTx] ===== TYPE CHECK START =====');
  console.log('[buildClaimTx] typeof PublicKey:', typeof PublicKey);
  console.log('[buildClaimTx] typeof Transaction:', typeof Transaction);
  console.log('[buildClaimTx] typeof SystemProgram:', typeof SystemProgram);
  console.log('[buildClaimTx] typeof SYSVAR_RENT_PUBKEY:', typeof SYSVAR_RENT_PUBKEY);
  console.log('[buildClaimTx] typeof TOKEN_PROGRAM_ID:', typeof TOKEN_PROGRAM_ID);
  console.log('[buildClaimTx] typeof getAssociatedTokenAddress:', typeof getAssociatedTokenAddress);
  console.log('[buildClaimTx] typeof createAssociatedTokenAccountInstruction:', typeof createAssociatedTokenAccountInstruction);
  console.log('[buildClaimTx] typeof getAccount:', typeof getAccount);
  console.log('[buildClaimTx] typeof getConnection:', typeof getConnection);
  console.log('[buildClaimTx] typeof getProgram:', typeof getProgram);
  console.log('[buildClaimTx] typeof getGrantPda:', typeof getGrantPda);
  console.log('[buildClaimTx] typeof getVaultPda:', typeof getVaultPda);
  console.log('[buildClaimTx] typeof getReceiptPda:', typeof getReceiptPda);
  console.log('[buildClaimTx] typeof calculatePeriodIndex:', typeof calculatePeriodIndex);
  console.log('[buildClaimTx] ===== TYPE CHECK END =====');
  
  const { campaignId, recipientPubkey } = params;
  
  // PublicKeyとTransactionが利用可能であることを確認
  if (typeof PublicKey === 'undefined' || typeof Transaction === 'undefined') {
    throw new Error('PublicKey or Transaction is not available. Make sure @solana/web3.js is properly imported.');
  }
  
  const connection = getConnection();
  const program = getProgram();

  // TODO: campaignId から Grant 情報（authority, mint, grantId）を取得
  // 現時点では、ダミー値を使用（実際の実装では API から取得）
  // 例: const grantInfo = await fetchGrantInfoByCampaignId(campaignId);
  console.log('[buildClaimTx] Creating PublicKey instances...');
  console.log('[buildClaimTx] typeof PublicKey before new:', typeof PublicKey);
  console.log('[buildClaimTx] PublicKey constructor:', PublicKey?.constructor?.name);
  
  if (typeof PublicKey !== 'function') {
    throw new Error('PublicKey is not a constructor. typeof PublicKey: ' + typeof PublicKey);
  }
  
  const dummyAuthority = new PublicKey('11111111111111111111111111111111');
  const dummyMint = new PublicKey('So11111111111111111111111111111111111111112'); // SOL (devnet)
  const dummyGrantId = BigInt(1);
  
  console.log('[buildClaimTx] PublicKey instances created successfully');

  // Grant アカウントを取得して period_index を計算
  // TODO: 実際の実装では、Grant アカウントを fetch して start_ts, period_seconds を取得
  const [grantPda] = getGrantPda(dummyAuthority, dummyMint, dummyGrantId);
  
  // スタブ: ダミー値で period_index を計算
  const dummyStartTs = BigInt(Math.floor(Date.now() / 1000) - 86400); // 1日前
  const dummyPeriodSeconds = BigInt(2592000); // 30日
  const periodIndex = calculatePeriodIndex(dummyStartTs, dummyPeriodSeconds);

  // PDA を計算
  const [vaultPda] = getVaultPda(grantPda);
  const [receiptPda] = getReceiptPda(grantPda, recipientPubkey, periodIndex);

  // 受給者の ATA を取得
  const claimerAta = await getAssociatedTokenAddress(dummyMint, recipientPubkey);

  // トランザクションを作成
  console.log('[buildClaimTx] Creating Transaction...');
  console.log('[buildClaimTx] typeof Transaction before new:', typeof Transaction);
  console.log('[buildClaimTx] Transaction constructor:', Transaction?.constructor?.name);
  
  if (typeof Transaction !== 'function') {
    throw new Error('Transaction is not a constructor. typeof Transaction: ' + typeof Transaction);
  }
  
  const tx = new Transaction();
  console.log('[buildClaimTx] Transaction created successfully');

  // ATA が存在しない場合は作成命令を追加
  try {
    await getAccount(connection, claimerAta);
  } catch {
    // ATA が存在しない場合は作成命令を追加
    tx.add(
      createAssociatedTokenAccountInstruction(
        recipientPubkey,
        claimerAta,
        recipientPubkey,
        dummyMint
      )
    );
  }

  // claim_grant instruction を構築
  const instruction = await program.methods
    .claimGrant(new BN(periodIndex.toString()))
    .accounts({
      grant: grantPda,
      mint: dummyMint,
      vault: vaultPda,
      claimer: recipientPubkey,
      claimerAta: claimerAta,
      receipt: receiptPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  tx.add(instruction);

  // recentBlockhash を取得（送信しないが、tx の完全性のために）
  let recentBlockhash: string | null = null;
  try {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    recentBlockhash = blockhash;
    tx.recentBlockhash = blockhash;
  } catch (error) {
    console.warn('Failed to get recent blockhash:', error);
  }

  // feePayer を設定（送信しないが、tx の完全性のために）
  tx.feePayer = recipientPubkey;

  return {
    tx,
    meta: {
      feePayer: recipientPubkey,
      recentBlockhash,
      instructionCount: tx.instructions.length,
      grantPda,
      vaultPda,
      receiptPda,
      claimerAta,
      periodIndex,
    },
  };
}

// ===== Use Transaction =====

/**
 * Use Transaction 構築パラメータ
 */
export interface BuildUseTxParams {
  campaignId: string;
  recipientPubkey: PublicKey;
  amount?: bigint; // 使用量（未指定時は全残高）
}

/**
 * Use Transaction 構築結果
 */
export interface BuildUseTxResult {
  tx: Transaction;
  meta: {
    feePayer: PublicKey | null;
    recentBlockhash: string | null;
    instructionCount: number;
    mint: PublicKey;
    userAta: PublicKey;
    amount: bigint;
  };
}

/**
 * Use（消費）トランザクションを構築
 * SPL Token の burn 操作を使用
 * 
 * 注意: 署名・送信は行わない。構築のみ。
 * 
 * TODO: campaignId から Grant 情報（mint）を取得するAPIが必要
 */
export async function buildUseTx(
  params: BuildUseTxParams
): Promise<BuildUseTxResult> {
  const { campaignId, recipientPubkey, amount } = params;
  const connection = getConnection();

  // TODO: campaignId から Grant 情報（mint）を取得
  // 現時点では、ダミー値を使用（実際の実装では API から取得）
  const dummyMint = new PublicKey('So11111111111111111111111111111111111111112'); // SOL (devnet)

  // ユーザーの ATA を取得
  const userAta = await getAssociatedTokenAddress(dummyMint, recipientPubkey);

  // トランザクションを作成
  const tx = new Transaction();

  // ATA の残高を取得して使用量を決定
  let burnAmount: bigint;
  if (amount !== undefined) {
    burnAmount = amount;
  } else {
    try {
      const account = await getAccount(connection, userAta);
      burnAmount = BigInt(account.amount.toString());
      if (burnAmount < 0) {
        burnAmount = BigInt(0);
      }
    } catch (error) {
      // ATA が存在しない場合は 0
      console.warn('ATA not found or error getting account:', error);
      burnAmount = BigInt(0);
    }
  }

  // burn 命令を追加（残高が 0 より大きい場合のみ）
  if (burnAmount > 0) {
    try {
      tx.add(
        createBurnInstruction(
          userAta, // account: 燃やすトークンアカウント
          dummyMint, // mint: トークンのmint
          recipientPubkey, // owner: トークンアカウントの所有者（signer）
          Number(burnAmount), // amount (u64)
          [], // multiSigners（単一署名者の場合は空）
          TOKEN_PROGRAM_ID
        )
      );
    } catch (error) {
      console.error('Failed to create burn instruction:', error);
      throw new Error('Burn命令の作成に失敗しました');
    }
  }

  // recentBlockhash を取得
  let recentBlockhash: string | null = null;
  try {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    recentBlockhash = blockhash;
    tx.recentBlockhash = blockhash;
  } catch (error) {
    console.warn('Failed to get recent blockhash:', error);
  }

  // feePayer を設定
  tx.feePayer = recipientPubkey;

  return {
    tx,
    meta: {
      feePayer: recipientPubkey,
      recentBlockhash,
      instructionCount: tx.instructions.length,
      mint: dummyMint,
      userAta,
      amount: burnAmount,
    },
  };
}
