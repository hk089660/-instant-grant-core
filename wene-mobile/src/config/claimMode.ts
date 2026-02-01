/**
 * Claim モード設定
 *
 * - school: ウォレット不要の参加券システム（生徒・教員向け実運用）
 * - solana: Phantom / Solana 技術検証用（既存実装）
 *
 * デフォルトは school。将来メインネット接続時は solana に切り替え可能。
 */
export type ClaimMode = 'school' | 'solana';

let _claimMode: ClaimMode = 'school';

export const CLAIM_MODE_SCHOOL: ClaimMode = 'school';
export const CLAIM_MODE_SOLANA: ClaimMode = 'solana';

/**
 * 現在の Claim モードを取得
 */
export function getClaimMode(): ClaimMode {
  return _claimMode;
}

/**
 * Claim モードを設定（デバッグ・将来の切り替え用）
 */
export function setClaimMode(mode: ClaimMode): void {
  _claimMode = mode;
}
