# Android Emulator 開発フロー

Mac 上で Android Emulator を主軸にした開発・デバッグ手順です。

**前提**: GrapheneOS 実機はワイヤレス ADB が制限されるため、当面はエミュレータのみを対象とします。

---

## 1. 必要な環境

### Android Studio / SDK

```bash
# macOS (Homebrew)
brew install --cask android-commandlinetools
# または Android Studio をインストール（推奨: Device Manager で AVD 作成が簡単）

# 環境変数（~/.zshrc 等に追加）
export ANDROID_HOME=$HOME/Library/Android/sdk
# または Homebrew の場合
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

### Java 17

```bash
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

### AVD（エミュレータイメージ）作成

1. Android Studio → **Device Manager** を開く
2. **Create Device** → 例: Pixel 8, API 36 (UpsideDownCake)
3. システムイメージをダウンロードして完了

---

## 2. 推奨コマンド一覧

| 目的 | コマンド |
|------|----------|
| エミュレータ起動確認 | `npm run emulator:check` |
| エミュレータ起動 | `npm run emulator:start` |
| エミュレータ向け ADB | `npm run emulator:adb -- devices` |
| Expo 開発サーバー開始 | `npm start` |
| エミュレータでビルド＆起動 | `npm run android:emulator` |
| APK ビルド → エミュレータへインストール | `npm run deploy:adb` |
| クリーンインストール | `npm run deploy:adb:clean` |

---

## 3. 日常の開発フロー

### A. 開発サーバー + ホットリロード（推奨）

```bash
cd wene-mobile

# 1. エミュレータを起動（未起動の場合）
npm run emulator:start

# 2. 開発サーバーを起動
npm start

# 3. ターミナルで "a" を押して Android を選択
# または別ターミナルで:
npm run android:emulator
```

これで JS 変更がホットリロードで反映されます。

### B. APK ビルドしてインストール

```bash
cd wene-mobile

# エミュレータが起動していることを確認
npm run emulator:check

# ビルド → インストール（エミュレータのみ対象）
npm run deploy:adb
```

`deploy:adb` はデフォルトで **emulator-xxxx のみ** を対象とします。

### C. 実機向けに切り替える場合（USB 接続時）

```bash
WENE_EMULATOR_ONLY=0 npm run deploy:adb
```

---

## 4. ADB がエミュレータのみを対象にする理由

- **GrapheneOS**: ワイヤレス ADB が制限されており、USB 未接続時は実機が `adb devices` に表示されない
- **複数デバイス**: 実機とエミュレータが同時接続されている場合、意図しない実機にインストールするのを防ぐ
- **安定性**: 毎回同じ環境（エミュレータ）で動作確認できる

`scripts/emulator-adb.sh` が `emulator-` で始まるシリアルのデバイスのみを対象にします。

---

## 5. よくあるエラーと対処

### エミュレータが見つからない

```
エラー: 起動中の Android エミュレータが見つかりません。
```

**対処**:
```bash
npm run emulator:start
# 数十秒待ってから
npm run emulator:check
```

### Cold boot で起動が遅い・フリーズする

- Device Manager で AVD の **Wipe Data** を試す
- 別の AVD（例: API 34）で試す
- `emulator -avd <名前> -no-snapshot-load` でコールドブート起動

### GPU エラー（Black screen / クラッシュ）

```
emulator: ERROR: Emulator engine failed to initialize
```

**対処**: `emulator -avd <名前> -gpu swiftshader_indirect` でソフトウェアレンダリングを試す

### adb devices に device が表示されない

- エミュレータが完全に起動するまで待つ（1〜2分）
- `adb kill-server && adb start-server` で ADB を再起動
- エミュレータを再起動

### Gradle ビルドが失敗する

```bash
# 完全クリーン
npm run android:clean-rebuild

# さらに徹底する場合
npm run android:ultra-clean
```

### Metro bundler のキャッシュ問題

```bash
npm run start:reset
```

---

## 6. スクリプト一覧

| スクリプト | 説明 |
|-----------|------|
| `scripts/emulator-check.sh` | エミュレータ起動確認 |
| `scripts/emulator-start.sh` | エミュレータ起動 |
| `scripts/emulator-adb.sh` | エミュレータ専用 ADB ラッパー |
| `scripts/deploy-via-adb.sh` | APK ビルド＋インストール |

---

## 7. 環境変数

| 変数 | 説明 | デフォルト |
|------|------|------------|
| `WENE_EMULATOR_ONLY` | 1=エミュレータのみ, 0=全デバイス | 1 |
| `WENE_ADB_SERIAL` | 特定デバイス指定（例: emulator-5554） | 自動検出 |
| `WENE_AVD_NAME` | 起動する AVD 名 | 自動選択 |
| `ANDROID_HOME` | Android SDK パス | - |
