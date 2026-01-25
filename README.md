# we-ne

**すぐ届き、すぐ使える給付を、日本で現実に機能させるための Solana 基盤**

we-ne（ウィネー）は、日本社会における「給付」「支援」「分配」を、  
**即時性・低コスト・透明性**を重視して実行するためのオンチェーン基盤です。

本リポジトリは、既存の `solana-grant-program` を中核に据え、  
**SPL トークンによる固定レート型・定期給付（サブスク型）**を実際に動かす  
最小実装（MVP）をまとめたものです。

---

## 思想 / Philosophy

日本では、支援が必要だと分かってから実際に届くまでに、  
多くの時間・事務処理・中間コストが発生します。

- 手続きが重く、緊急性に対応できない  
- 少額支援ほどコスト負けしやすい  
- 実行の透明性が低く、検証が難しい

we-ne は、これらを **技術によって単純化する** ことを目指します。

> **支援は、思い立った瞬間に作れ、**  
> **条件を満たした人に、即座に届き、**  
> **その実行は誰でも検証できるべきである**

本プロジェクトは、投機や金融商品を目的としたものではありません。  
**生活支援・地域活動・実証実験**など、日本での現実的な利用を主眼に置いています。

---

## なぜ Solana なのか

給付や支援において最も重要なのは、  
**「届くまでの速さ」と「実際に使える距離」**です。

Solana は、この思想と非常に相性の良い特性を持っています。

- **高速な確定性**："申請中" ではなく "今、届いた" 体験を作れる  
- **低い手数料**：少額・高頻度の給付が成立する  
- **オンチェーン実行**：誰が・いつ・どの条件で配布されたかを検証できる  
- **グローバル基盤**：日本の小規模ユースケースでも成立する柔軟性

we-ne は、**給付を金融ではなく生活インフラとして扱う**ために Solana を採用しています。

---

## 現在できていること（MVP）

現在の we-ne は、以下の仕様で **実際に動作する MVP** になっています。

### スマートコントラクト（grant_program）

- SPL トークン限定の給付プログラム  
- 固定レート方式（例：1 トークン = 1 円相当として運用）  
- 定期給付（1 期間につき 1 回のみ受給可能）  
- 二重受給防止（period index + ClaimReceipt PDA）  
- 入金・受給・停止まで一通り実装済み

```text
Create Grant → Fund Grant → Periodic Claim → Pause / Resume
```

Anchor による `build / test` は通過済みです。

### モバイルアプリ（wene-mobile）

- React Native（Expo + TypeScript）による受給者向けUI
- Solanaウォレット連携（Phantom Wallet対応）
- 給付プログラムへの接続と受給機能
- Deep Link対応（`wene://r/<campaignId>` および `https://wene.app/r/<campaignId>`）
- iOS / Android 両対応

モバイルアプリの詳細は [`wene-mobile/README.md`](./wene-mobile/README.md) を参照してください。

---

## 定期給付（期間ベース）の考え方

we-ne は、月次給付に限らず、**日次・週次・月次といった定期的な給付**を  
同一の仕組みで扱えるように設計されています。

給付の頻度は、Grant 作成時に設定する `period_seconds` によって決まります。  
これは「給付を何日・何週間・何か月ごとに行うか」を秒単位で指定する方式です。

例：
- 日次給付：`period_seconds = 86,400`  
- 週次給付：`period_seconds = 604,800`  
- 月次給付（暫定）：`period_seconds = 2,592,000`

各期間ごとに `period_index` が計算され、  
`(grant, claimer, period_index)` をキーとした ClaimReceipt により、  
**同一期間内での二重受給が防止**されます。

この仕組みにより、we-ne は以下を実現します。

- 給付頻度を用途に応じて柔軟に変更できる  
- 実装を増やさずに日次・週次・月次へ拡張できる  
- 定期給付を「時間ベースのルール」として明確に説明できる

we-ne は、給付を特定の周期に縛るのではなく、  
**時間によって区切られた繰り返し給付のエンジン**として設計されています。

---

## 条件付き給付（Allowlist）の考え方

we-ne は、定期給付に **条件を組み合わせること** を前提に設計されています。

条件付き給付では、「誰が受け取れるか」を複雑なロジックで判定するのではなく、  
**事前に定義された対象リスト（Allowlist）** に基づいて制御します。

Allowlist は Merkle Tree を用いて Grant に紐づけられる想定です。

- Grant 作成時に Allowlist の Merkle Root を登録  
- Claim 時に、受給者が自分が対象であることを証明  
- 条件を満たさない場合は受給不可

この方式により、we-ne は以下を実現します。

- KYC や個人情報を扱わずに条件付き給付を行える  
- 学校・地域・団体などの名簿ベース運用と相性が良い  
- 定期給付（日次・週次・月次）と自然に組み合わせられる

we-ne は、条件を複雑化するのではなく、  
**「誰が対象か」を明示することで成立する給付**を重視しています。

---

## リポジトリ構成

```text
we-ne/
├─ README.md
├─ grant_program/          # Solana スマートコントラクト（Anchor）
│  ├─ Anchor.toml
│  ├─ programs/
│  │  └─ grant_program/
│  │     └─ src/
│  │        └─ lib.rs     # Grant / Claim / Allowlist / Receipt の中核実装
│  └─ tests/              # Anchor tests
└─ wene-mobile/           # モバイルアプリ（React Native + Expo）
   ├─ app/                # Expo Router による画面定義
   ├─ src/                # アプリケーションロジック
   │  ├─ solana/          # Solana クライアント実装
   │  ├─ screens/         # 画面コンポーネント
   │  └─ wallet/          # ウォレットアダプター
   └─ android/            # Android ネイティブプロジェクト
   └─ ios/                # iOS ネイティブプロジェクト
```

---

## 開発環境

### スマートコントラクト（grant_program）

- Rust  
- Solana CLI  
- Anchor  
- anchor-lang / anchor-spl

#### ビルド
```bash
cd grant_program
anchor build
```

#### テスト
```bash
cd grant_program
anchor test
```

### モバイルアプリ（wene-mobile）

- Node.js（推奨: v18以上）
- npm または yarn
- Expo CLI
- iOS開発: Xcode（macOSのみ）
- Android開発: Android Studio / Android SDK

#### セットアップ
```bash
cd wene-mobile
npm install
```

#### 開発サーバー起動
```bash
npm start
```

#### ビルド
```bash
# Android APK
npm run build:apk

# iOS Simulator
npm run build:ios
```

詳細な手順は [`wene-mobile/README.md`](./wene-mobile/README.md) を参照してください。

---

## セキュリティ・注意事項

- KYC / 本人確認は行いません（ウォレット単位）  
- スマートコントラクトの監査は未実施です  
- 本番運用を想定していません

**研究・検証目的でのみ利用してください。**

---

## Status

- Anchor build: ✅  
- Anchor test: ✅  
- SPL fixed-rate periodic grant (MVP): ✅
- Mobile app (React Native + Expo): ✅
- Wallet integration (Phantom): ✅
- Deep Link support: ✅

---

## コンタクト

Issue / Discussion を通じたフィードバックを歓迎します.