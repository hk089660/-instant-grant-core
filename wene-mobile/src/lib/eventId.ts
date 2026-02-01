/**
 * eventId の取得・バリデーション一元化
 */

export interface EventIdParseResult {
  valid: true;
  eventId: string;
}

export interface EventIdParseInvalid {
  valid: false;
}

export type EventIdParse = EventIdParseResult | EventIdParseInvalid;

/**
 * クエリ/ルートから取得した生の値をパース・検証
 *
 * @param raw useLocalSearchParams 等から取得した値
 * @param defaultValue 未指定時のデフォルト（scan 等で使用）
 * @returns valid: true なら eventId を返す。invalid なら valid: false
 */
export function parseEventId(raw: string | string[] | undefined, defaultValue?: string): EventIdParse {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s != null && typeof s === 'string') {
    const trimmed = s.trim();
    if (trimmed.length > 0) {
      return { valid: true, eventId: trimmed };
    }
  }
  if (defaultValue != null && typeof defaultValue === 'string' && defaultValue.trim().length > 0) {
    return { valid: true, eventId: defaultValue.trim() };
  }
  return { valid: false };
}
