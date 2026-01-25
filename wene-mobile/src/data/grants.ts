import type { Grant } from '../types/grant';

/**
 * campaignId → Grant マップ
 * サーバなしでローカルデータを返す実装
 */
export const grantsByCampaignId: Record<string, Grant> = {
  'demo-campaign': {
    campaignId: 'demo-campaign',
    title: 'デモ支援クレジット',
    description: 'We-ne のデモ用支援クレジットです。',
    issuerName: 'We-ne',
    goalDeadlineJst: '2025-12-31',
    balance: 1,
    usageHint: '本デモは開発・検証用です。実際の利用には本番キャンペーンをご利用ください。',
  },
  'demo-invite': {
    campaignId: 'demo-invite',
    title: '招待デモ',
    description: '招待コード付きデモキャンペーン。',
    issuerName: 'We-ne',
    goalDeadlineJst: '2025-06-30',
    balance: 1,
    usageHint: '招待専用のデモキャンペーンです。',
  },
};