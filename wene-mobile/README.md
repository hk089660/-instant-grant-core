# We-ne Mobile

React Native（Expo + TypeScript）アプリ - 受給者向けUI  
Recipient-facing app built with React Native (Expo + TypeScript).

---

## Status / ステータス

**日本語**: このアプリはプロトタイプです。デモ・検証用であり、環境差によるビルド失敗や実行失敗は現時点では想定内です。失敗した場合は Issue や Discussions で状況を共有してもらえると助かります。

**English**: This app is a prototype for demo and validation. Build or run failures due to environment differences are expected at this stage. If something fails, sharing your setup in Issues or Discussions helps.

- **現在動作しているもの / What works now**: Phantom連携、Deep Link（`wene://r/<campaignId>`）、給付プログラムへの接続と受給フロー、Android / iOS 向けビルド。 — Phantom integration, deep links, grant connection and claim flow, Android / iOS builds.
- **未実装・今後の予定 / Not implemented (planned)**: 他ウォレット対応、管理者用画面、オフライン対応などは未対応です。 — Other wallets, admin screens, offline support are not yet available.

---

## Environment check (doctor) / 環境チェック（doctor）

**日本語**: 環境の違いでビルドや実行が失敗することがあるため、**セットアップ前**および**ビルドが通らないとき**に、環境チェック用の doctor スクリプトの実行を推奨します。

**English**: Because build or run can fail depending on your environment, run the doctor script **before setup** and **when a build fails**.

- **いつ実行するか / When to run**: 初回セットアップ時、`npm install` のあと。あるいは、`npm run build:prebuild` や `npm run build:apk` が失敗したときの原因切り分けとして。 — After first-time `npm install`, or when `npm run build:prebuild` / `npm run build:apk` fails, to narrow down the cause.
- **何をするか / What it does**: 依存関係の有無、必須ファイル・設定（例: `local.properties`、アイコンアセット）の有無、よくある不整合を検出します。`npm run doctor:fix` で自動修正できる項目もあります。 — Detects missing deps, required files/settings (e.g. `local.properties`, icon assets), and common issues. `npm run doctor:fix` can auto-fix some of them.
- **コマンド / Commands**: `npm run doctor`（チェックのみ / check only）、`npm run doctor:fix`（修正可能な項目を自動修正 / auto-fix when possible）。

**日本語**: doctor を実行すると、ビルド失敗の原因が「環境不足」か「コード・設定」かの切り分けがしやすくなります。

**English**: Running doctor helps tell whether a build failure is due to the environment or to code/config.

---

## セットアップ / Setup

**日本語**: 最小限の手順です。初回は環境チェック（上記 doctor）の実行を推奨します。

**English**: Minimal steps. Running the doctor script (above) on first setup is recommended.

```bash
# 依存関係のインストール
npm install

# （推奨）環境チェック。問題があれば npm run doctor:fix で修正を試す / (Recommended) Run doctor; use npm run doctor:fix if needed
npm run doctor

# アプリの起動 / Start app
npm start
```

**日本語**: ネイティブプロジェクト（Android/iOS）を生成してビルドする場合は、ルートの README の Quickstart または下記「APK の書き出し」を参照してください。

**English**: For native Android/iOS build, see the root README Quickstart or the "APK の書き出し" section below.

## ディレクトリ構成

```
wene-mobile/
├── app/
│   ├── _layout.tsx          # ルートレイアウト（Stack、header非表示）
│   ├── index.tsx            # 受給者ホーム画面
│   └── r/
│       └── [campaignId].tsx # 受給画面
├── app.config.ts            # Expo設定（deeplink含む）
├── package.json
└── tsconfig.json
```

## Deeplink

### Custom Scheme
- Scheme: `wene`
- 形式: `wene://r/<campaignId>?code=...`
- 例: `wene://r/demo-campaign?code=demo-invite`

### Universal Links / App Links (HTTPS)
- URL: `https://wene.app/r/<campaignId>?code=...`
- 例: `https://wene.app/r/demo-campaign?code=demo-invite`
- iOS: Universal Links（associatedDomains設定済み）
- Android: App Links（intentFilters設定済み）

## Universal Links / App Links の設定

### iOS: Apple App Site Association (AASA)

**必要な理由:**
iOSでUniversal Linksを動作させるには、ドメイン（wene.app）のルートにAASAファイルを配置する必要があります。iOSがこのファイルを検証して、アプリがそのドメインのリンクを処理できることを確認します。

**配置場所:**
- `https://wene.app/.well-known/apple-app-site-association`
- HTTPSでアクセス可能である必要があります
- Content-Type: `application/json` で配信する必要があります

**必要な値:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.jp.wene.app",
        "paths": ["/r/*"]
      }
    ]
  }
}
```
- `TEAM_ID`: Apple DeveloperアカウントのTeam ID（10文字の英数字）
- `paths`: アプリで処理するパスパターン（`/r/*`で/r/で始まるすべてのパスを処理）

### Android: Digital Asset Links (assetlinks.json)

**必要な理由:**
AndroidでApp Linksを動作させるには、ドメイン（wene.app）のルートにassetlinks.jsonファイルを配置する必要があります。Androidがこのファイルを検証して、アプリがそのドメインのリンクを処理できることを確認します。

**配置場所:**
- `https://wene.app/.well-known/assetlinks.json`
- HTTPSでアクセス可能である必要があります
- Content-Type: `application/json` で配信する必要があります

**必要な値:**
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "jp.wene.app",
    "sha256_cert_fingerprints": [
      "SHA256_FINGERPRINT"
    ]
  }
}]
```
- `package_name`: app.config.tsで設定した`jp.wene.app`
- `sha256_cert_fingerprints`: アプリの署名証明書のSHA256フィンガープリント（リリースビルド用とデバッグビルド用の両方を設定可能）

**フィンガープリントの取得方法:**
```bash
# リリースキーストアの場合
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias

# デバッグキーストアの場合
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**注意事項:**
- AASAとassetlinks.jsonは、HTTPSで配信され、正しいContent-Typeヘッダーが必要です
- ファイルはリダイレクトなしで直接アクセス可能である必要があります
- iOSはAASAファイルをキャッシュするため、変更後は反映に時間がかかる場合があります
- AndroidはApp Linksの検証を実行時に行うため、初回起動時にインターネット接続が必要です

## 画面仕様

### ホーム画面（app/index.tsx）
- 白背景
- タイトル「We-ne」
- 説明文「支援クレジットを受け取る」
- デモリンクボタン

### 受給画面（app/r/[campaignId].tsx）
- URLパラメータから `campaignId` と `code` を取得
- カード形式で情報を表示
- 「受け取る（仮）」ボタン

## デザインルール

- 白黒＋グレーのみ
- 影は使わない
- 角丸はやや大きめ（16px）
- 1画面1アクション

## APK の書き出し

### 前提条件

- **Java 17**: Gradle 8 は Java 25 非対応のため、Java 17 を使用してください。
  - macOS (Homebrew): `brew install openjdk@17`
- **Android SDK**: `platform-tools`, `platforms;android-36`, `build-tools;36.0.0` が必要です。
  - macOS (Homebrew): `brew install --cask android-commandlinetools` ののち、`sdkmanager` で上記をインストール。
- 未導入時は `ANDROID_HOME` と `JAVA_HOME` をそれぞれ設定してください。

### 手順

```bash
# 1. 初回のみ: ネイティブ Android プロジェクトを生成
npm run build:prebuild

# 2. APK をビルド（Java 17 と Android SDK を使用）
npm run build:apk
```

出力先: `android/app/build/outputs/apk/release/app-release.apk`

Homebrew で Java 17 と Android コマンドラインツールを入れている場合は、そのまま `npm run build:apk` でビルドできます。別のパスを使う場合は、ビルド前に `JAVA_HOME` と `ANDROID_HOME` を設定してください。

### ターミナルが落ちる／ビルドを再試行したい場合

**新しいターミナル**を開き、以下を実行してください。

```bash
cd wene-mobile
./scripts/build-apk.sh
# または
npm run build:apk
```

### APK インストール時の注意点

**更新が反映されない場合:**

1. **既存のアプリをアンインストール**
   - 設定 > アプリ > wene-mobile（または jp.wene.app）> アンインストール
   - または `adb uninstall jp.wene.app`（USB接続時）

2. **新しいAPKをインストール**
   - ファイルマネージャーでAPKを開く
   - または `adb install android/app/build/outputs/apk/release/app-release.apk`

**理由:**
- `versionCode` が同じ場合、Androidは更新と認識しません
- 異なる署名（例：Expo Go経由でインストール）の場合、上書きインストールできません
- `app.config.ts` で `versionCode` を自動更新するように設定済みですが、既存のアプリが古い `versionCode` の場合はアンインストールが必要です

## iOS ローカルビルド（Simulator）

### 前提条件

- **Xcodeアプリ**がインストールされている必要があります（App Storeからインストール、約12GB）
- Command Line Toolsだけでは不十分です
- インストール後: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` を実行

**確認方法:**
```bash
xcode-select -p
# 正しい場合: /Applications/Xcode.app/Contents/Developer
# 間違っている場合: /Library/Developer/CommandLineTools（Xcodeアプリが必要）
```

### ローカルビルド手順

```bash
cd wene-mobile
./scripts/build-ios.sh
# または
npm run build:ios
```

- 初回は `expo prebuild --platform ios --clean` 相当の処理が走ります（`ios/` がない場合）。
- その後 `expo run:ios` で Simulator にビルド・起動します。

**ターミナルが落ちる／再試行したい場合:** 新しいターミナルを開き、上記コマンドを再実行してください。

### Xcodeがインストールされていない場合

**EAS Build（クラウドビルド）を使用:**
```bash
# 1. EAS CLIのインストールとログイン
npm install -g eas-cli
eas login

# 2. EASプロジェクトの初期化（初回のみ）
eas init

# 3. iOS Simulator用ビルド
eas build --platform ios --profile development
```

詳細は `DEBUG_REPORT.md` の「iOS Simulator対応」セクションを参照してください。

## トラブルシューティング

### Expo GoでAndroid上に更新が反映されない場合

以下の手順を順番に試してください：

#### 方法1: キャッシュをクリア（推奨）
```bash
npm run start:clear
# または
npm run android:clear
```

#### 方法2: 完全リセット（方法1で解決しない場合）
```bash
npm run start:reset
# または
npm run android:reset
```

#### 方法3: すべてのキャッシュを削除（方法2で解決しない場合）
```bash
npm run clean
```

その後、Androidデバイスで：
1. **Expo Goアプリを完全に閉じる**
   - 最近使用したアプリ一覧からExpo Goをスワイプして閉じる
   - または、設定 > アプリ > Expo Go > 強制停止

2. **Expo Goアプリを再起動**
   - アプリを開き直し、QRコードをスキャンして再接続

3. **手動でリロード**
   - Expo Goアプリ内で、デバイスをシェイクするか、メニューから「Reload」を選択

#### 方法4: ネットワーク接続を確認
- Androidデバイスと開発マシンが同じWi-Fiネットワークに接続されていることを確認
- ファイアウォールやVPNが開発サーバーへの接続をブロックしていないか確認
- USBデバッグ経由で接続する場合：`adb reverse tcp:8081 tcp:8081` を実行

#### 方法5: 開発サーバーのログを確認
- 開発サーバーのターミナルでエラーメッセージがないか確認
- AndroidデバイスでExpo Goアプリのログを確認（設定 > デバッグ > ログを表示）

#### 補足情報
- `app.config.ts`は開発時に自動的にバージョンが更新されるため、手動で変更する必要はありません
- それでも更新されない場合は、Expo Goアプリ自体を再インストールしてみてください
