# Phantom接続エラー（-32603）の解決方法

## エラーの概要

エラーコード`-32603`（Unexpected error）は、Phantom側の内部エラーを示しています。URLの生成は正しく行われていますが、Phantom側でエラーが発生しています。

## 解決方法

### 1. Phantom Portalへの登録（推奨）

Phantom Portalにアプリを登録することで、`app_url`と`redirect_link`が許可されます。

1. https://portal.phantom.app/ にアクセス
2. アプリを登録
3. `app_url`（`https://wene.app`）と`redirect_link`（`wene://phantom/connect`）を登録

### 2. app_urlの検証問題の解決

`app_url`がブロックリストに載っている可能性があります。以下を確認してください：

- `https://wene.app`が実際に存在し、アクセス可能か確認
- 一時的に別のドメイン（例: `https://example.com`）でテスト
- Phantomサポートに問い合わせて、`app_url`がブロックされていないか確認

### 3. Phantomアプリのバージョン確認

古いバージョンのPhantomアプリで問題が発生している可能性があります。

- Google Play StoreまたはApp StoreでPhantomアプリを最新版に更新
- 最新版でも問題が発生する場合は、Phantomサポートに問い合わせ

### 4. パラメータの形式の確認

現在の実装では、以下のパラメータが正しく設定されています：

- `app_url`: `https://wene.app`（URLエンコード済み）
- `dapp_encryption_public_key`: Base64エンコードされたx25519公開鍵（44文字）
- `redirect_link`: `wene://phantom/connect`（URLエンコード済み）
- `cluster`: `devnet`

### 5. Phantomサポートへの問い合わせ

上記の方法で解決しない場合は、Phantomサポートに問い合わせてください：

- サポートフォーム: https://docs.google.com/forms/d/e/1FAIpQLSeHWETFkEJbHQCF-lnl1AHmVQPuyfC0HbnxjDjIp6VYV1sBZQ/viewform
- 問い合わせ時に含める情報:
  - エラーコード: `-32603`
  - `app_url`: `https://wene.app`
  - `redirect_link`: `wene://phantom/connect`
  - 使用しているPhantomアプリのバージョン

## 一時的な回避策

開発環境では、一時的に別の`app_url`を使用することも検討できます：

```typescript
// 一時的なテスト用（本番環境では使用しない）
const appUrl = 'https://example.com'; // または実際に存在する別のドメイン
```

ただし、本番環境では、実際のドメイン（`https://wene.app`）を使用する必要があります。

## 参考資料

- Phantom Connect ドキュメント: https://docs.phantom.com/phantom-deeplinks/provider-methods/connect
- Phantom Portal: https://portal.phantom.app/
- Phantom サポート: https://docs.phantom.com/introduction
