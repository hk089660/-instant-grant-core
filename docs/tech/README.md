# Solana 技術検証ドキュメント

このディレクトリは、We-ne の **Solana / Phantom 技術検証** に関する技術ドキュメントをまとめたものです。

実運用（学校向け PoC）ではウォレット不要の参加券システムを使用します。  
将来メインネット接続時は `mode='solana'` に切り替えることでブロックチェーン連携が可能になります。

## 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [../PHANTOM_FLOW.md](../PHANTOM_FLOW.md) | Phantom ウォレット連携フロー（接続・署名） |
| [../PHANTOM_DEBUG.md](../PHANTOM_DEBUG.md) | Phantom デバッグ手順 |
| [../DEVNET_SETUP.md](../DEVNET_SETUP.md) | Devnet 接続設定 |
| [../DEVNET_CONNECTION_FACT_CHECK.md](../DEVNET_CONNECTION_FACT_CHECK.md) | Devnet 接続の検証 |
| [../DEVNET_MAINNET_FIX.md](../DEVNET_MAINNET_FIX.md) | Devnet / Mainnet 切り替え |
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | システム全体のアーキテクチャ |

## Claim モード

| モード | 用途 | 技術 |
|--------|------|------|
| `school` (デフォルト) | 生徒・教員向け実運用 | API 完結、ウォレット不要 |
| `solana` | 技術検証・将来のメインネット | Phantom、web3.js、sendSignedTx |

切り替え: `src/config/claimMode.ts` の `setClaimMode('solana')` で Solana モードを有効化。
