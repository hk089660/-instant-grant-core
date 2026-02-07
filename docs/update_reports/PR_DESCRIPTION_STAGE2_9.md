# School MVP (Stage 2–9): Admin auth + claim/join token + participations + server persistence

## Summary

School MVP の Stage 2〜9 を main に取り込むための PR です。

- **Admin 認証**: 8桁パスコード + cookie セッション
- **Student claim/join**: 冪等な `/school/claim` API
- **join-token**: HMAC+TTL による発行・検証（API有効時はQRに付与）
- **participations API**: 一覧・イベント詳細・CSV ダウンロード
- **server 永続化**: events/participations を JSON で保存、再起動後も残る

---

## What changed

### Admin (Web)
- 8桁パスコード（`SCHOOL_ADMIN_PASSCODE`）によるログイン
- cookie ベースのセッション（HttpOnly, 8h）
- イベント作成・編集・QR印刷
- API有効時：QRに join-token 付きURL
- 参加者一覧（`/admin/participants`）、イベント別絞り込み
- CSV ダウンロード（Web のみ）

### Student (App)
- `/u/scan` → `/u/join` → claim フロー
- 冪等な claim（二重参加はスキップ）
- `SCHOOL_REQUIRE_JOIN_TOKEN=1` 時は token 必須（無しで 401）
- 401 時は `/admin/login` にリダイレクトしない（学生UX考慮）

### Server (`wene-mobile/server/`)
- Express API: auth, events, participations, claim, join-token
- JSON 永続化（`storage.js`）：再起動後も events/participations 保持
- 環境変数: `SCHOOL_ADMIN_PASSCODE`, `SCHOOL_ADMIN_WEB_ORIGIN`, `SCHOOL_JOIN_TOKEN_SECRET`, `SCHOOL_REQUIRE_JOIN_TOKEN`

### Docs
- `docs/update_reports/UPDATE_SUMMARY_STAGE2_9.md`
- `wene-mobile/docs/SCHOOL_POC_LAN_SETUP.md`
- `wene-mobile/docs/ADMIN_USER_LINKAGE.md`

---

## How to test (Web admin)

1. **Server**（`wene-mobile/server/`）:
   - `cd wene-mobile/server`
   - `SCHOOL_ADMIN_PASSCODE=12345678 SCHOOL_ADMIN_WEB_ORIGIN="http://localhost:8081" SCHOOL_JOIN_TOKEN_SECRET="dev-secret" SCHOOL_REQUIRE_JOIN_TOKEN=0 npm start`
   - ポート: 3000

2. **Client**:
   - `cd wene-mobile`
   - `EXPO_PUBLIC_SCHOOL_API_URL=http://localhost:3000/school npx expo start --web -c`

3. **手順**:
   - 未ログインで `/admin` → `/admin/login` へリダイレクト
   - 8桁パスコードでログイン
   - イベント作成 → 詳細 → 一覧に残る
   - `/admin/print/:eventId` で QR 表示
   - 学生側: `/u/scan` → join → claim 成功
   - `/admin/participants` に参加ログ
   - CSV ダウンロード（Web のみ）

---

## How to test (Student app)

1. 上記サーバー・クライアントを起動
2. `/u` → QR読み取り → `/u/scan`
3. QR スキャン or `/u/join?eventId=evt-xxx`
4. 参加確認 → claim
5. 「参加しました」表示
6. token 必須時: token 無しで claim → 401（リダイレクトなし）

---

## Security / Ops notes

- **Secrets はサーバー環境変数のみ**。`EXPO_PUBLIC_*` に含めない。
- **join-token**: HMAC-SHA256 + 有効期限
- **CORS**: `SCHOOL_ADMIN_WEB_ORIGIN` で許可オリジン指定
- **永続化**: JSON ファイル。本番では DB 等への置き換えを推奨。

---

## Screenshots (optional)

（必要に応じて追加）

---

## Checklist

- [x] Admin 認証（8桁パスコード + cookie）
- [x] イベント作成・編集・QR印刷
- [x] join-token 発行・検証
- [x] Student claim フロー（冪等）
- [x] participations 一覧・CSV
- [x] server 永続化
- [x] TypeScript 型チェック通過
- [x] ルート `npm run build` 通過
