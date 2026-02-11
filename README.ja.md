# We-ne (instant-grant-core)

We-ne は、Solana 上で非保管型の支援配布と参加券運用を検証するための、オープンソースのプロトタイプ/評価キットです。receipt 記録を使った第三者検証性と重複受取防止を重視しています。

> ステータス（2026年2月11日時点）: **PoC / devnet-first**。本番 mainnet 運用ではなく、再現性と審査向け検証を目的にしています。

[English README](./README.md) | [Architecture](./docs/ARCHITECTURE.md) | [Devnet Setup](./docs/DEVNET_SETUP.md) | [Security](./docs/SECURITY.md)

## このプロトタイプが解決すること

- 非保管型配布: 受取者が自分のウォレットで署名し、アプリは秘密鍵を保持しない。
- 監査可能性: tx/receipt を Solana Explorer で独立に検証できる。
- 重複受取対策: receipt ロジックで 1 回受取を強制し、学校フローの再申請は二重支払いではなく `already joined` 完了扱いになる。

## 現在の PoC ステータス

- Devnet E2E claim フローが利用可能（wallet sign -> send -> Explorer 検証）。
- 学校イベント QR フローが利用可能（`/admin` -> 印刷 QR -> `/u/scan` -> `/u/confirm` -> `/u/success`）。
- Success 画面で tx signature + receipt pubkey + Explorer リンク（devnet）を確認できる。
- 再申請は `already joined` の運用完了として扱われ、二重支払いはしない。

## クイックスタート（ローカル）

```bash
cd wene-mobile
npm i
npm run dev:full
```

起動後の確認先:

- 管理画面一覧: `http://localhost:8081/admin`
- 利用者スキャン導線: `http://localhost:8081/u/scan?eventId=evt-001`

## クイックスタート（Cloudflare Pages）

このモノレポの Cloudflare Pages 設定:

- Root directory: `wene-mobile`
- Build command: `npm ci && npm run export:web`
- Output directory: `dist`

`export:web` の必須条件:

- `EXPO_PUBLIC_API_BASE_URL`（または `EXPO_PUBLIC_SCHOOL_API_BASE_URL`）に Worker URL を設定する。
- 未設定だと `scripts/gen-redirects.js` が失敗する。proxy 用リダイレクトが生成されない場合、`/api/*` と `/v1/*` が Pages に直接当たり `405` や HTML を返すことがある。

コピペ用デプロイコマンド:

```bash
cd wene-mobile
EXPO_PUBLIC_API_BASE_URL="https://<your-worker>.workers.dev" npm run export:web
npm run deploy:pages
npm run verify:pages
```

## デモ / 再現手順（1ページ）

1. 管理者イベント一覧を開く: `/admin`
2. イベント詳細を開く: `/admin/events/<eventId>`（例: `evt-001`、state は `published` 推奨）。
3. 詳細画面の「印刷用PDF」から印刷画面へ遷移: `/admin/print/<eventId>`。
4. 印刷 QR のリンク先が `/u/scan?eventId=<eventId>` であることを確認。
5. 利用者側で QR URL を開く -> `/u/confirm?eventId=<eventId>` -> claim -> `/u/success?eventId=<eventId>`。
6. Success 画面で tx signature と receipt pubkey の Explorer リンクを確認:
- `https://explorer.solana.com/tx/<signature>?cluster=devnet`
- `https://explorer.solana.com/address/<receiptPubkey>?cluster=devnet`
7. 同じ QR で再度 claim: 期待挙動は `already joined` の運用完了扱い（重複支払いなし）。

## 検証コマンド

Pages 検証チェーン:

```bash
cd wene-mobile
npm run export:web
npm run deploy:pages
npm run verify:pages
```

`verify:pages` の確認項目:

- `/admin` の配信 bundle SHA256 がローカル `dist` と一致する。
- `GET /v1/school/events` が `200` かつ `application/json` を返す。
- `POST /api/users/register` が **`405 Method Not Allowed` ではない**。

手動スポットチェック:

```bash
BASE="https://<your-pages-domain>"

curl -sS -D - "$BASE/v1/school/events" -o /tmp/wene_events.json | sed -n '1p;/content-type/p'
curl -sS -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'Content-Type: application/json' \
  -d '{}' \
  "$BASE/api/users/register"
```

## トラブルシューティング / 既知の挙動

- `/v1/school/events` が HTML を返す: `_redirects` proxy が未適用、または誤った成果物をデプロイしている。
- `/_redirects` を直 fetch して 404: Pages では正常な場合がある。`/v1` が JSON か、`/api` が非 405 かで実行時挙動を確認する。
- ログイン/利用者状態はブラウザや端末ストレージに保持される想定。共用端末テストではプライベートブラウズ推奨。
- Web の `/u/scan` カメラ UI は現状モック。推奨導線は、印刷 QR をスマホカメラ/QR リーダーで読み取り `/u/scan?eventId=...` を開くこと。

## 詳細ドキュメント

- 学校 PoC ガイド: `./wene-mobile/README_SCHOOL.md`
- Cloudflare Pages デプロイメモ: `./wene-mobile/docs/CLOUDFLARE_PAGES.md`
- Worker API 詳細: `./api-worker/README.md`
- Devnet セットアップ: `./docs/DEVNET_SETUP.md`

## 審査向けコンテキスト

このリポジトリは助成金/PoC 審査向けのプロトタイプ評価キットです。優先事項は機能の宣伝ではなく、再現性と独立検証（特に Explorer 証跡）です。
