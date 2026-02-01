/**
 * 学校参加券 API クライアント
 *
 * インターフェースを定義し、実装は差し替え可能。
 * PoC: mock。将来は fetch によるサーバ API に差し替え。
 */

import type { SchoolClaimResult } from '../types/school';
import type { SchoolEvent } from '../types/school';

export interface SchoolClaimClient {
  submit(eventId: string): Promise<SchoolClaimResult>;
}

export interface SchoolEventProvider {
  getById(eventId: string): SchoolEvent | null;
  getAll(): SchoolEvent[];
}
