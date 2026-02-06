# 学校向けPoC: LAN環境でのBASE_URL設定ガイド

## 目標

管理者がWebブラウザからQRコードを印刷し、学生がスマートフォンアプリでスキャンしてイベントに参加するワークフローを実現します。

## 要件

**重要**: Admin PCと学生のスマートフォンは**同じネットワーク（LAN/Wi-Fi）**上にある必要があります。

## Admin Webの開き方

Admin Webは以下のようなURLパターンでアクセスできます：

### ローカル開発環境
```
http://localhost:8081
http://127.0.0.1:8081
```

### LAN環境（同一ネットワーク内の他のデバイスから）
```
http://<Admin PCのIPアドレス>:8081
例: http://192.168.1.100:8081
```

### IPアドレスの確認方法

**Windows:**
```cmd
ipconfig
```
「IPv4 アドレス」を確認

**macOS/Linux:**
```bash
ifconfig
# または
ip addr show
```
`inet` の値を確認（通常は `192.168.x.x` または `10.x.x.x`）

## QR URLの形成方法

QRコードに含まれるURLは以下の形式で生成されます：

```
<origin>/u/join?eventId=<eventId>&token=<token>
```

- `<origin>`: Admin Webが開かれているURLのベース部分（例: `http://192.168.1.100:8081`）
- `eventId`: イベントID
- `token`: 認証トークン

### 例
```
http://192.168.1.100:8081/u/join?eventId=event-123&token=abc123xyz
```

## トラブルシューティングチェックリスト

QRコードをスキャンしても接続できない場合、以下を確認してください：

### 1. ネットワーク接続の確認

- [ ] Admin PCと学生のスマートフォンが**同じWi-Fiネットワーク**に接続されている
- [ ] 両方のデバイスでWi-Fi接続が有効になっている
- [ ] モバイルデータ通信がオフになっている（Wi-Fiが優先されるように）

### 2. ホスト/IPアドレスの到達性確認

**スマートフォンから確認:**
- ブラウザで `http://<Admin PCのIP>:8081` にアクセスできるか確認
- アクセスできない場合、IPアドレスが正しいか再確認

**Admin PCから確認:**
- ファイアウォールがポート8081をブロックしていないか確認
- 他のデバイスからアクセス可能か確認

### 3. ファイアウォール設定

**Windows:**
1. 「Windows Defender ファイアウォール」を開く
2. 「詳細設定」→「受信の規則」→「新しい規則」
3. ポート8081を許可する規則を追加

**macOS:**
```bash
# 一時的にファイアウォールを無効化してテスト
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**Linux (ufw):**
```bash
sudo ufw allow 8081/tcp
```

### 4. ポート転送（必要に応じて）

通常のLAN環境では不要ですが、複雑なネットワーク構成の場合は以下を確認：

- [ ] ルーターのポート転送設定でポート8081が転送されているか
- [ ] NAT設定が正しいか

### 5. BASE_URL設定の確認

**Web版（Admin）:**
- Webブラウザでは自動的に `window.location.origin` が使用されるため、追加設定は不要

**ネイティブ版（Admin）:**
- ネイティブアプリでAdmin Print機能を使用する場合、`EXPO_PUBLIC_BASE_URL` 環境変数の設定が必要
- `EXPO_PUBLIC_BASE_URL` が設定されていない場合、QRコードは表示されず、設定が必要な旨のメッセージが表示されます

## 注意事項

### ネイティブAdmin PrintでのQRコード表示

**設計上の制約**: ネイティブアプリでAdmin Print機能を使用する場合、`EXPO_PUBLIC_BASE_URL` 環境変数が設定されていないと、QRコードは**意図的に非表示**になります。

これは、ネイティブ環境では `window.location.origin` が利用できないため、BASE_URLを明示的に設定する必要があるためです。

**対処法:**
- `.env` ファイルに `EXPO_PUBLIC_BASE_URL=http://<Admin PCのIP>:8081` を設定
- または、Web版のAdmin Printを使用する（推奨）

## 推奨構成

学校環境でのPoCでは、以下の構成を推奨します：

1. **Admin側**: WebブラウザでAdmin Print画面を開く（`window.location.origin`が自動的に使用されるため設定不要）
2. **学生側**: スマートフォンアプリでQRコードをスキャン
3. **ネットワーク**: 学校のWi-Fiネットワークを使用（すべてのデバイスが同じネットワークに接続）

この構成により、追加の設定なしでQRコードの印刷とスキャンが可能になります。
