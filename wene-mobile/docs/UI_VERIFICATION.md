# UI 検証手順（Android Emulator）

一時的なフォールバック運用での UI 確認手順。実機との差は USB 接続時に最終確認する。

---

## 1. 起動手順

```bash
cd wene-mobile

# エミュレータ起動（未起動時）
npm run emulator:start

# 開発サーバー起動
npm start

# 別ターミナル、または Metro 起動後に "a" で Android を開く
# npm run android:emulator
```

---

## 2. 確認チェックリスト

### 画面表示

| 項目 | 確認方法 | 想定 |
|------|----------|------|
| アプリ起動 | npm start → "a" | ホーム画面が表示される |
| SafeArea | ノッチ・ステータスバー | コンテンツが隠れない |
| 背景色 | 全体 | 白背景（#ffffff） |

### 画面遷移（学校モード）

| フロー | 操作 | 想定 |
|--------|------|------|
| ホーム → 参加券 | 「参加を開始」 | /u（参加券一覧）へ |
| 参加券 → スキャン | 「参加する」 | /u/scan へ |
| スキャン → 確認 | 「読み取り開始」 | /u/confirm へ |
| 確認 → 完了 | 「参加する」 | /u/success へ |
| 完了 → 参加券 | 「完了」 | /u へ戻る |
| 直接参加 | /r/school/evt-001 | 学校参加画面 |

### Fast Refresh / Reload

| 操作 | 想定 |
|------|------|
| テキスト変更して保存 | 即時反映（Hot Reload） |
| スタイル変更して保存 | 即時反映 |
| 新規コンポーネント追加 | 即時反映または Reload で反映 |

### レイアウト

| 項目 | 確認箇所 |
|------|----------|
| ボタン押下領域 | 56px 以上、誤タップしにくい |
| カード余白 | Card 内 padding が一貫 |
| スクロール | 長いコンテンツでスクロール可能 |
| 下部余白 | 最後のボタンが SafeArea に隠れない |

### ダークモード・回転

- **ダークモード**: `userInterfaceStyle: 'light'` で固定のため未対応
- **画面回転**: `orientation: 'portrait'` で縦固定
- 実機でシステム設定を変えた場合の挙動は要確認

---

## 3. レイアウトデバッグ（任意）

境界線を表示してレイアウト崩れを特定する:

```bash
EXPO_PUBLIC_DEBUG_LAYOUT=1 npm start
```

または `.env.local` に追加:
```
EXPO_PUBLIC_DEBUG_LAYOUT=1
```

コンポーネントで使用:
```tsx
import { debugLayout } from '../ui/debugLayout';

<View style={[styles.container, debugLayout]}>
```

問題特定後は `DEBUG_LAYOUT` を無効化すること。

---

## 4. 実施した修正（事前対応）

| 修正 | 内容 |
|------|------|
| 常時表示のメッセージ削除 | UserScanScreen / UserConfirmScreen の「期限切れ」「受付時間外」を非表示（TODO で将来実装） |
| EventRow 表記統一 | host に「主催: 」を付与 |
| ScrollView 下部余白 | contentContainerStyle に paddingBottom を追加 |

---

## 5. 想定される差分（実機確認推奨）

- フォントレンダリング
- タッチフィードバック
- アニメーションのなめらかさ
- カメラ（QR スキャン実装時）
