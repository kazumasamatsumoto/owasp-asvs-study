# Lab 06: セッション管理と Cookie 属性（V7.2〜V7.4 / V3.3）

## 対応する ASVS 要件
- **V7.2.3 (L1)** 参照トークンは CSPRNG で生成し 128 ビット以上のエントロピー
- **V7.2.4 (L1)** 認証時に新しいセッショントークンを発行し、古いトークンを無効化（セッション固定対策）
- **V7.3.1 / V7.3.2 (L2)** 無操作タイムアウトと絶対的な最大セッション寿命
- **V7.4.1 (L1)** ログアウト・期限切れ後はセッションを使えない（サーバー側で無効化）
- **V7.4.2 (L1)** アカウント無効化・削除時に全セッションを終了
- **V3.3.1 / V3.3.3 (L1/L2)** Cookie に `Secure` と `__Host-` プレフィックス
- **V3.3.2 (L2)** 用途に応じた `SameSite`
- **V3.3.4 (L2)** スクリプトから読む必要のない Cookie には `HttpOnly`

## 課題
`exercise.py` の `SessionStore` と `build_session_cookie()` を修正してください。

- 無操作タイムアウト: 30 分（`IDLE_TIMEOUT`）、絶対寿命: 12 時間（`ABSOLUTE_TIMEOUT`）
- `login(user_id, old_token=None)` は**必ず新しいトークン**を返し、`old_token` は無効化
- `revoke_user(user_id)` はそのユーザーの全セッションを無効化
- `build_session_cookie(token)` は `Set-Cookie` ヘッダの値を返す。名前は `__Host-session`、`Secure; HttpOnly; SameSite=Lax; Path=/` を付与（`Domain` は付けない）

## 実行
```bash
python3 labs/run.py lab06
```
