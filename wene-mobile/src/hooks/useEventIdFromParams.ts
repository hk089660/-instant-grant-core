/**
 * クエリ/ルートから eventId を取得・検証
 * 画面ごとの eventId 取り回しを一元化
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { parseEventId } from '../lib/eventId';
import { schoolRoutes } from '../lib/schoolRoutes';

export interface UseEventIdFromParamsOptions {
  /** 未指定時のデフォルト（scan 等で使用） */
  defaultValue?: string;
  /** 無効時に events へリダイレクトするか */
  redirectOnInvalid?: boolean;
}

export interface UseEventIdFromParamsResult {
  eventId: string | null;
  isValid: boolean;
}

/**
 * useLocalSearchParams から eventId を取得し検証
 * redirectOnInvalid: true のとき、無効なら /u へ replace
 */
export function useEventIdFromParams(options?: UseEventIdFromParamsOptions): UseEventIdFromParamsResult {
  const { eventId: raw } = useLocalSearchParams<{ eventId?: string }>();
  const router = useRouter();
  const { defaultValue, redirectOnInvalid = false } = options ?? {};
  const parsed = parseEventId(raw, defaultValue);

  useEffect(() => {
    if (redirectOnInvalid && !parsed.valid) {
      router.replace(schoolRoutes.events as any);
    }
  }, [redirectOnInvalid, parsed.valid, router]);

  if (parsed.valid) {
    return { eventId: parsed.eventId, isValid: true };
  }
  return { eventId: null, isValid: false };
}
