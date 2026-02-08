# 管理者・利用者データ同期

## 概要

利用者側で参加完了（claim）すると、`recipientTicketStore` にチケットが記録される。管理者側はこの store を読み、リアルタイム参加数（rtCount）・参加者一覧を表示する。同一アプリ内で Zustand + AsyncStorage を共有するため、即時に反映される。

## データフロー

```
利用者: QR スキャン → 確認 → 参加 → schoolClaimClient.submit()
                                    ↓
                         recipientTicketStore.addTicket()
                                    ↓
管理者: useSyncedAdminData() → recipientTicketStore.tickets を読み取り
                                    ↓
                         syncedEvents (rtCount 更新)
                         getParticipantsForEvent()
                         participantLogs
```

## 主要ファイル

| ファイル | 役割 |
|---------|------|
| `src/data/adminUserSync.ts` | 同期レイヤー。`useSyncedAdminData` フックで管理者画面に同期データを提供 |
| `src/store/recipientTicketStore.ts` | 参加チケットの永続化（AsyncStorage） |
| `src/api/schoolClaimClient.mock.ts` | 利用者の claim 時に `addTicket` を呼び出す |
| `src/screens/admin/*` | `useSyncedAdminData` を利用してイベント・参加者を表示 |

## 同期されるデータ

- **rtCount**: イベントごとの参加完了数（recipientTicketStore のチケット数で算出）
- **participants**: イベント詳細の参加者一覧（チケットから変換）
- **participantLogs**: 参加者検索画面のログ（全イベント横断）

## 将来の拡張

- 本番では `SchoolClaimClient` を fetch ベースの API に差し替え
- バックエンドと同期する場合は、claim 時に POST、管理者ロード時に GET で同期
