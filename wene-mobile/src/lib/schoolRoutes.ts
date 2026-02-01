/**
 * 学校フロー用ルートパス
 * 画面遷移の一貫性を保つため定数化
 */

export const schoolRoutes = {
  home: '/',
  events: '/u',
  scan: '/u/scan',
  confirm: (eventId: string) => `/u/confirm?eventId=${eventId}`,
  success: (eventId: string) => `/u/success?eventId=${eventId}`,
  schoolClaim: (eventId: string) => `/r/school/${eventId}`,
} as const;
