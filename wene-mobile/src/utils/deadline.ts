import type { Grant } from '../types/grant';

/**
 * 期限を JST 表記で返す
 * goalDeadlineJst がなければ「期限なし」
 * 形式: YYYY/MM/DD 23:59
 */
export function formatDeadlineJst(grant: Grant): string {
  const d = grant.goalDeadlineJst;
  if (!d) return '期限なし';
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return '期限なし';
  return `${y}/${m}/${day} 23:59`;
}

/**
 * 残り時間の表示用文字列
 * timerDays / timerHours があればそれを使用、なければ goalDeadlineJst から算出
 */
export function formatRemainingTime(grant: Grant): string {
  if (grant.timerDays != null && grant.timerHours != null) {
    if (grant.timerDays > 0) return `残り ${grant.timerDays}日 ${grant.timerHours}時間`;
    return `残り ${grant.timerHours}時間`;
  }
  const d = grant.goalDeadlineJst;
  if (!d) return '期限なし';
  try {
    const end = new Date(d + 'T23:59:59+09:00');
    const endTime = end.getTime();
    if (isNaN(endTime)) return '期限なし';
    const now = new Date();
    const nowTime = now.getTime();
    if (isNaN(nowTime)) return '期限なし';
    const diff = endTime - nowTime;
    if (isNaN(diff) || diff <= 0) return '期限切れ';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `残り ${days}日 ${hours}時間`;
    return `残り ${hours}時間`;
  } catch {
    return '期限なし';
  }
}

/**
 * 期限切れかどうか
 */
export function isExpired(grant: Grant): boolean {
  const d = grant.goalDeadlineJst;
  if (!d) return false;
  try {
    const end = new Date(d + 'T23:59:59+09:00');
    const endTime = end.getTime();
    if (isNaN(endTime)) return false;
    return Date.now() > endTime;
  } catch {
    return false;
  }
}
