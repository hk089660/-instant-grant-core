# エミュレータ専用開発フロー 検証レポート

一時的なフォールバック運用の検証結果。最終的には USB 接続による実機デバッグに戻す前提。

---

## 1. 検証結果サマリ

| 項目 | 結果 | 備考 |
|------|------|------|
| emulator-check | ✓ | emulator-xxxx のみ検出、実機は無視 |
| emulator-start | ✓ | 起動済みなら何もしない |
| emulator-adb | ✓ | すべての adb に -s emulator-xxxx 付与 |
| deploy-via-adb | ✓ | デフォルトで emulator-adb を使用 |
| 実機参照の可能性 | なし | emulator- プレフィックスのみ対象 |

---

## 2. 実行される adb コマンド・分岐

### emulator-adb.sh

```
1. get_adb()          → adb パス解決
2. get_emulator_serial() → adb devices -l | awk '/^emulator-[0-9]+[[:space:]]+device/ {print $1; exit}'
3. check_emulator()   → シリアル取得、失敗時はエラーで exit 1
4. exec adb -s <serial> <引数>
```

**実機を参照する経路**: なし。awk が `emulator-` で始まる行のみマッチするため。

### deploy-via-adb.sh

```
EMULATOR_ONLY="${WENE_EMULATOR_ONLY:-1}"
[[ "$EMULATOR_ONLY" == "0" ]] || EMULATOR_ONLY=1   # 明示的 0 以外は 1

if EMULATOR_ONLY == "1":
  ADB_CMD = ./scripts/emulator-adb.sh
else:
  ADB_CMD = adb（全デバイス）

$ADB_CMD devices
$ADB_CMD uninstall jp.wene.app   # --clean 時
$ADB_CMD install ...
```

**実機を参照する経路**: `WENE_EMULATOR_ONLY=0` を明示した場合のみ。

---

## 3. 想定シーン別挙動

| シーン | 挙動 |
|--------|------|
| エミュレータ未起動 | emulator-check: exit 1 / emulator-adb: エラーメッセージで exit 1 |
| エミュレータ1台起動 | その1台を対象に -s emulator-5554 等で実行 |
| エミュレータ複数起動 | awk の `exit` により最初の1台のみ対象 |
| 実機のみ接続 | emulator-adb: マッチなし → エラー、実機には触れない |
| 実機+エミュレータ接続 | emulator-adb: エミュレータのみ対象、実機は無視 |

---

## 4. npm scripts 連携

| コマンド | 動作 |
|----------|------|
| `npm run emulator:check` | emulator-check.sh を実行、exit 0/1 |
| `npm run emulator:start` | emulator-check → 未起動なら emulator -avd & |
| `npm run emulator:adb -- devices` | emulator-adb.sh 経由で adb devices |
| `npm run android:emulator` | emulator-check && expo run:android |

**注意**: `expo run:android` は Expo の内部で adb を直接呼ぶ。エミュレータ1台のみ接続時は問題なし。実機が同時接続されている場合、Expo がどちらを選ぶかは未制御（現状の前提では USB 未接続のため該当しない）。

---

## 5. 実施した修正（最小差分）

1. **awk パターン**: `\t` → `[[:space:]]+`（adb devices はスペース区切りが仕様のため）
2. **EMULATOR_ONLY**: 明示的 `0` 以外は emulator 専用モードにするよう条件を厳格化

---

## 6. 実機デバッグに戻す場合

```bash
WENE_EMULATOR_ONLY=0 npm run deploy:adb
```

または環境変数を未設定にして `WENE_EMULATOR_ONLY=0` を export しておく。
