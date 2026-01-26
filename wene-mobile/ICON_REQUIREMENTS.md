# アイコン画像を差し替えるための条件

## 必須条件

### 1. ファイル形式
- **PNG形式**のみ対応（JPEG、SVG、WEBPは不可）
- 透明背景に対応（アルファチャンネル対応）

### 2. サイズ
- **推奨: 1024x1024ピクセル**
- 最小: 512x512ピクセル（動作する可能性はあるが、Expoは1024x1024を推奨）
- 正方形である必要がある（アスペクト比1:1）

### 3. ファイル名と配置場所
- **ファイル名**: `icon.png`
- **配置場所**: `wene-mobile/assets/icon.png`
- 既存のファイルを上書きする

### 4. 設定ファイル
- `app.config.ts`で既に設定済み:
  ```typescript
  icon: './assets/icon.png',
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff',
    },
  }
  ```

## 差し替え手順

### 方法1: 画像を直接配置（推奨）
1. 提供された画像を`wene-mobile/assets/icon.png`に配置
2. サイズが1024x1024でない場合、リサイズ:
   ```bash
   sips -z 1024 1024 your-image.png --out assets/icon.png
   ```
3. `npx expo prebuild --platform android --clean`を実行（ネイティブプロジェクトを再生成）
4. ビルドしてインストール

### 方法2: 現在の画像を確認して差し替え
現在の`assets/icon.png`を確認:
```bash
cd wene-mobile/assets
file icon.png
sips -g pixelWidth -g pixelHeight icon.png
```

## 注意事項

1. **透明背景**: アイコンの周囲が透明な場合は、PNGのアルファチャンネルが必要
2. **角丸**: AndroidのadaptiveIconは中央部分のみ表示されるため、重要な要素は中央に配置
3. **色**: 背景色が白の場合、`backgroundColor: '#ffffff'`が適切
4. **prebuildの実行**: アイコンを変更した後は`npx expo prebuild --platform android --clean`を実行してネイティブプロジェクトを再生成する必要がある

## 現在の設定状況

- ✅ `app.config.ts`で`icon: './assets/icon.png'`が設定済み
- ✅ `app.config.ts`で`adaptiveIcon.foregroundImage: './assets/icon.png'`が設定済み
- ✅ 現在の`assets/icon.png`は1024x1024のPNG形式

## 差し替え後の確認

1. ファイルが正しく配置されているか:
   ```bash
   ls -lh assets/icon.png
   file assets/icon.png
   ```

2. prebuildを実行:
   ```bash
   npx expo prebuild --platform android --clean
   ```

3. ビルドして確認:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
