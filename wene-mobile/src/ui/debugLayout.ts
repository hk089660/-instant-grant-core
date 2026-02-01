/**
 * レイアウトデバッグ用スタイル（一時利用）
 *
 * __DEV__ かつ DEBUG_LAYOUT=true のとき、赤枠でコンテナ境界を可視化。
 * 問題特定後に削除すること。
 *
 * 使い方:
 *   import { debugLayout } from '../ui/debugLayout';
 *   <View style={[styles.container, debugLayout]}>
 */
declare const __DEV__: boolean;

export const DEBUG_LAYOUT =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  (process.env.EXPO_PUBLIC_DEBUG_LAYOUT === '1' || process.env.EXPO_PUBLIC_DEBUG_LAYOUT === 'true');

export const debugLayout = DEBUG_LAYOUT
  ? { borderWidth: 1, borderColor: 'red' as const }
  : {};
