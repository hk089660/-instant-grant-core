/**
 * 学校向け参加券 API
 *
 * ウォレット不要で QR → eventId → 端末ID + eventId で重複参加防止。
 * 成功時は「参加完了」を返す（tx なし）。
 *
 * 実装は schoolClaimClient で差し替え可能。
 */

import type { SchoolClaimResult } from '../types/school';
import { createMockSchoolClaimClient } from './schoolClaimClient.mock';
import { schoolEventProvider } from './schoolEvents';

const client = createMockSchoolClaimClient(schoolEventProvider);

/**
 * 学校参加券を送信
 *
 * @param eventId QR から取得したイベントID（parseEventId で検証済みを推奨）
 * @returns 成功/失敗を統一形式で返す
 */
export async function submitSchoolClaim(eventId: string): Promise<SchoolClaimResult> {
  try {
    if (!eventId || typeof eventId !== 'string' || !eventId.trim()) {
      return {
        success: false,
        error: { code: 'invalid_input', message: 'イベントIDが無効です' },
      };
    }
    return await client.submit(eventId.trim());
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      error: { code: 'retryable', message: msg || '参加に失敗しました' },
    };
  }
}

export type { SchoolClaimResult } from '../types/school';
