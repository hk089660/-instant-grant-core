# Cloudflare Pages デプロイ（固定HTTPS）

学校PoCを「当日運用できる」状態にするための、Cloudflare Pages での Web ホスト設定メモ。再現性のため環境変数と設定を固定する。

## プロジェクト設定

| 項目 | 値 |
|------|-----|
| **Root directory** | `wene-mobile` |
| **Build command** | `npm ci && npm run export:web` |
| **Output directory** | `dist` |

## 環境変数

| 変数 | 値 | 備考 |
|------|-----|------|
| `EXPO_PUBLIC_BASE_URL` | `https://<your-pages-domain>` | 末尾スラッシュなし。印刷QRのベースURLになる |
| `EXPO_PUBLIC_API_MODE` | `mock` または `http` | 本番は `http`（Workers API に接続） |
| `EXPO_PUBLIC_API_BASE_URL` | `https://<your-worker>.workers.dev` | **http モード時必須**。Cloudflare Workers API のベースURL（末尾スラッシュなし） |

> 補足: `EXPO_PUBLIC_SCHOOL_API_BASE_URL` または `EXPO_PUBLIC_API_BASE_URL` のいずれかが必須です。  
> `npm run export:web` は内部で `scripts/gen-redirects.js` を呼び出しており、これらの環境変数が未設定の場合は `exit 1` で失敗します（`dist/_redirects` が生成されない）。  
> 未設定のまま本番にデプロイすると、`/api/*` や `/v1/*` が Pages 側に当たり、`405 Method Not Allowed` になるトラップがあります。

### Pages + Workers で運用する場合

- **Pages** の環境変数に上記3つを設定する。
- **Workers**（`api-worker/`）を別途デプロイし、その URL を `EXPO_PUBLIC_API_BASE_URL` に指定する。
- Workers 側で CORS に Pages のドメイン（`EXPO_PUBLIC_BASE_URL`）を許可する（`CORS_ORIGIN` 変数）。

これにより、ローカルサーバなしで Pages 上の UI が Workers API からイベント一覧・claim を取得できる。

## 確実なデプロイ手順（wrangler pages deploy 推奨）

Cloudflare Pages の UI から ZIP を手動アップロードする運用は「別プロジェクトにアップロードしてしまう」「古い ZIP を選んでしまう」といった事故が起きやすいため、**基本的には `wrangler pages deploy` を使ったデプロイを推奨**する。

前提:

- Cloudflare アカウントにログイン済みで `wrangler` がセットアップされている（`npm i -g wrangler` など）。
- Pages プロジェクトの Root directory / Build command / Output directory は上記の通り設定済み。

### 1. web ビルドの作成（export:web）

`EXPO_PUBLIC_SCHOOL_API_BASE_URL` または `EXPO_PUBLIC_API_BASE_URL` を必ず指定した上で、Expo の web export を実行して `dist` を生成する。

本番向けの具体例（Workers 側が `https://we-ne-school-api.haruki-kira3.workers.dev` の場合）:

```bash
cd wene-mobile

EXPO_PUBLIC_BASE_URL="https://we-ne-school-ui.pages.dev" \
EXPO_PUBLIC_API_MODE="http" \
EXPO_PUBLIC_API_BASE_URL="https://we-ne-school-api.haruki-kira3.workers.dev" \
  npm run export:web
```

（`EXPO_PUBLIC_SCHOOL_API_BASE_URL` を使う場合は、`EXPO_PUBLIC_API_BASE_URL` の代わりにそちらを指定する）

これにより、`dist/_expo/static/js/web/index-*.js` や `dist/_redirects` を含む最新のビルド成果物が生成される。

### 2. Pages プロジェクト名の確認

`wrangler pages project list` で、実際に使われている Pages プロジェクト名を確認する。

```bash
cd wene-mobile
npx wrangler pages project list
```

出力例:

```text
┌───────────────┬─────────────────────────────┐
│ Name             │ Subdomain                │
├───────────────┼─────────────────────────────┤
│ we-ne-school-ui  │ we-ne-school-ui.pages.dev│
└───────────────┴─────────────────────────────┘
```

- `Subdomain` が `we-ne-school-ui.pages.dev` になっているプロジェクトを **Production 用** とみなす
- その行の `Name` を `--project-name` に指定する（例: `we-ne-school-ui`）

### 3. wrangler で Pages にデプロイ

`dist` ディレクトリをそのまま Cloudflare Pages の本番プロジェクトにデプロイする。

```bash
cd wene-mobile
npx wrangler pages deploy dist --project-name <PROJECT_NAME>
```

- `<PROJECT_NAME>` には、前のステップで確認した `Name` を入れる
- Production domain が `we-ne-school-ui.pages.dev` になっているプロジェクトを選ぶ

### 4. verify-pages-build.sh / npm run verify:pages で本番とローカル dist を比較

`scripts/verify-pages-build.sh` を使って、「本番が本当にローカル `dist` の成果物を配っているか」「API が Workers に到達しているか」を機械的に検証する。

```bash
cd wene-mobile

# 固定ドメイン向け（本番ドメインが we-ne-school-ui.pages.dev の場合）
npm run verify:pages

# 任意の Pages ドメインを検証したい場合
bash scripts/verify-pages-build.sh "https://<your-pages-domain>"
```

このスクリプトは次をチェックする:

- ローカル `dist/_expo/static/js/web/index-*.js` と、本番 `/admin` から参照されている `/_expo/static/js/web/index-*.js` の **SHA256 が一致するか**
  - 一致しない場合は、ローカル・本番それぞれの **JS パスと SHA256** を出力した上で **即座に FAIL（終了コード 1）** になる
- `GET /v1/school/events` が **HTTP 200 かつ `Content-Type` に `application/json` を含むか**
  - `text/html` など JSON 以外の場合は **FAIL**
- `POST /api/users/register` が **HTTP 405（Pages 側の 405）になっていないか**
  - 405 の場合は **FAIL**。200/400/401 等、**Workers に到達していると推定できるステータスなら OK** とみなす

### 5. OK 時に期待される挙動

`verify-pages-build.sh` が OK を返しているとき、期待される挙動は次の通り:

- `https://<domain>/v1/school/events`
  - ステータスコード: 200
  - `Content-Type: application/json`（Workers API にプロキシされている）
- `https://<domain>/api/users/register`
  - ステータスコード: 200（最終的な本番仕様として想定）
  - 少なくとも 405（Pages の固定レスポンス）ではない

これらが満たされていれば、「Pages が最新の `dist` を配っている」「API 経路が Workers に向いている」と判断できる。

## 確認（直アクセスが 404 にならないこと）

次の3URLを直アクセスして、いずれも 404 にならないことを確認する。

1. `https://<domain>/admin`
2. `https://<domain>/admin/print/evt-001`
3. `https://<domain>/u/confirm?eventId=evt-001`

`dist/_redirects` に `/* /index.html 200` が含まれていれば SPA リライトが効く。

なお、Pages の `_redirects` は URL で直接取得しようとすると 404 を返す場合があるが、その場合でもリダイレクト設定自体は有効なことがある。

- `/_redirects` が 404 だからといって「設定されていない」とは限らない
- 代わりに、`/admin` や `/u/confirm` が 404 にならずに表示されるか、`/v1/school/events` が JSON を返すか、といった **挙動ベースで判断する**

## （参考）手動 ZIP アップロードについて

Cloudflare ダッシュボードから ZIP を手動アップロードしてデプロイする方法は、次の理由から **非推奨**:

- 別の Pages プロジェクトを選択してしまう
- 古い ZIP ファイルを誤って選んでしまう
- CI やローカルの `dist` と、本番の中身がずれる

それでも手動でアップロードする場合は、少なくとも次のような方法で「ZIP が正しく展開されているか」を確認すること:

- `https://<domain>/metadata.json` など、`dist` にのみ存在するファイルが **200 で返ること**
- 上記の `verify-pages-build.sh` / `npm run verify:pages` を併用し、**本番の JS バンドルとローカル `dist` の SHA256 が一致していること** を確認する

とはいえ、これらの確認も含めて **最短で確実なのは `wrangler pages deploy dist --project-name <name>` で毎回同じ手順を踏むこと** である。

## 関連

* README_SCHOOL.md の「Cloudflare Pages でのデプロイ」「デプロイURLでの最終確認」も参照。
