# V7 セッション管理 — L1 要件を開発の観点で読む

> 対象: L1 要件 6 件 ／ 章の解説: [../chapters/V07-session-management.md](../chapters/V07-session-management.md)

## この章の要件を一言でいうと

「ログイン後にユーザーを識別し続ける仕組み」、つまりセッション ID の Cookie、JWT などのトークン、ログイン・ログアウト処理、アカウント無効化処理を書くときの話です。
L1 で求められるのは、**トークンはサーバー側で検証する / 固定の API キーをセッション代わりにしない / 推測できない値を使う / ログイン時に作り直す / ログアウトやアカウント無効化で本当に使えなくする** の 5 点に集約されます。
Cookie 属性（`Secure`・`HttpOnly`・`SameSite`）は V3 章、JWT の署名検証の詳細は V9 章の担当です。
ハンズオンは [labs/lab06_session](../../labs/lab06_session/) で試せます。

## 要件ごとの読み解き

### V7.2.1 セッショントークンは信頼できるバックエンドで検証する `L1`

> **原文**: Verify that the application performs all session token verification using a trusted, backend service.

**ひとことで**: 「このトークンは有効か、誰のものか」の判定は、すべてサーバー側（信頼できるバックエンド）で行う。

**開発の現場で言うと**: SPA やモバイルアプリで特に崩れやすい要件です。
- フロントで JWT を `jwt-decode` して `exp` や `role` を見て「ログイン済み」と判断し、API 側では検証していない
- Next.js の middleware で「セッション Cookie が**存在するか**」だけを見てページを出し分け、データ取得側で検証していない
- Firebase / Supabase / Auth0 のトークンを受け取った自前 API が、署名検証をせずにペイロードの `uid` を信じる

Django・Rails・Spring Security の標準セッションは、サーバー側でセッションストアや署名を確認するので通常は満たされます。崩れるのは「自前でトークンを扱う部分」です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | どのコンポーネントがトークンを検証するか（アプリ本体 / API ゲートウェイ / 認証サービス）を決め、そこを経由しないアクセス経路がないことを確認する |
| 実装 | すべての保護された API でサーバー側の検証ミドルウェアを通す。JWT なら署名・有効期限などを検証するライブラリ関数（`jwt.verify` 等）を使う |
| レビュー | `jwt.decode`（検証なしデコード）、`jwt-decode`、`verify=False`、`algorithms` 未指定、`atob(token.split('.')[1])` を grep。middleware で `cookies.has(` だけを見ていないか |
| テスト | 署名部分を改ざんしたトークン、ペイロードの `sub` を書き換えたトークン、ランダムな文字列のセッション Cookie で API を叩き、401 になること |

**誤解しやすいポイント**: 「フロントでログイン状態をチェックしてリダイレクトしている」のは UX のためで、検証ではありません。また「JWT をデコードしてユーザー ID を取り出している」のと「JWT を検証している」は別物です。デコードは誰でもできます。

---

### V7.2.2 静的な API キーではなく動的に生成したトークンを使う `L1`

> **原文**: Verify that the application uses either self-contained or reference tokens that are dynamically generated for session management, i.e. not using static API secrets and keys.

**ひとことで**: ユーザーのセッションには、ログインごとに動的に発行するトークン（セッション ID や JWT など）を使い、固定の API キーやシークレットを使い回さない。

**開発の現場で言うと**: 次のような実装が該当します。
- SPA のビルドに埋め込んだ固定の API キーを、ユーザー全員が同じ値で使っている
- ユーザーごとに一度だけ発行した「永続 API キー」を、ブラウザのログインセッションとして使っている
- 社内ツールで、全員共通の `Authorization: Bearer <固定値>` を配布している

固定値は失効・期限・ユーザーとの紐付けができず、漏れたら使われ放題です。サーバー間連携用の API キー（機械用の認証情報）自体を否定する要件ではなく、**ユーザーセッションの管理**にそれを流用しないことが趣旨です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | ユーザーのセッションはログイン時に発行するトークン方式（サーバー側セッション or 自己完結型トークン）にすると決める。API キーは機械間連携用と用途を分ける |
| 実装 | フレームワーク標準のセッション機構や認証ライブラリのトークン発行機能を使う |
| レビュー | フロントのコードや `.env` の `NEXT_PUBLIC_`・`VITE_`・`REACT_APP_` 系変数に API キーが入っていないか。`Authorization` ヘッダに定数を入れているコードがないか |
| テスト | 2 回ログインして、発行されるトークンが毎回異なること。別ユーザーでログインして値が異なること |

**誤解しやすいポイント**: 「API キーは HTTPS で送っているし、環境変数に入れているから安全」は、ブラウザに配信される時点で誰でも読めるので成り立ちません。フロントエンドのビルドに入った値は秘密ではありません。

---

### V7.2.3 参照トークンは CSPRNG で 128 ビット以上のエントロピー `L1`

> **原文**: Verify that if reference tokens are used to represent user sessions, they are unique and generated using a cryptographically secure pseudo-random number generator (CSPRNG) and possess at least 128 bits of entropy.

**ひとことで**: サーバー側でセッションを引くための ID（参照トークン）は、暗号論的に安全な乱数で 128 ビット以上のランダムさを持ち、一意であること。

**開発の現場で言うと**: Django・Rails・express-session・Spring（サーブレットコンテナ）などの標準セッション ID は CSPRNG で生成されるので、**標準機能を使う限り**通常は問題になりません。崩れるのは、自前でセッション ID・リメンバーミートークン・API トークンを生成するコードです。
「128 ビットのエントロピー」は「長さ」ではありません。32 文字でも、16 進の時刻やユーザー ID を並べただけならエントロピーはほとんどありません。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 自前でトークンを生成する箇所を洗い出し、可能ならフレームワーク標準に寄せる |
| 実装 | Python `secrets.token_urlsafe(32)`、Node `crypto.randomBytes(32)`、Java `SecureRandom`、Ruby `SecureRandom.urlsafe_base64(32)` など。32 バイト（256 ビット）にしておけば余裕がある。DB にユニーク制約を付ける |
| レビュー | `Math.random`、`random.random`/`random.choice`（Python の `random` モジュール）、`rand(`、`uniqid(`、`uuid1`、`Date.now()`・`time()`・連番・ユーザー ID のハッシュからの生成を grep |
| テスト | 多数のトークンを発行して重複がないこと、長さ（バイト数）が想定どおりであることを確認。生成関数が CSPRNG を使っていることはコードで確認する（出力を見ただけでは判定できない） |

**誤解しやすいポイント**: 「`md5(user_id + timestamp)` で 128 ビットになる」は誤りです。ハッシュの出力長が 128 ビットでも、入力が推測できればエントロピーは入力分しかありません。「UUID だから大丈夫」も、v4 で CSPRNG を使う実装かどうかに依存します（UUID v4 のランダム部分は 122 ビットである点にも注意）。

```python
# ❌ 推測可能
token = hashlib.md5(f"{user.id}{time.time()}".encode()).hexdigest()
# ✅ CSPRNG で 256 ビット
token = secrets.token_urlsafe(32)
```

---

### V7.2.4 ログイン（再認証含む）時にセッショントークンを新しくする `L1`

> **原文**: Verify that the application generates a new session token on user authentication, including re-authentication, and terminates the current session token.

**ひとことで**: ログインや再認証が成功したら新しいセッショントークンを発行し、それまでのトークンは使えなくする。

**開発の現場で言うと**: これを怠ると **セッション固定攻撃** が成立します。攻撃者が自分で取得したセッション ID を被害者に使わせ、被害者がログインした後に同じ ID でアクセスする手口です。
フレームワーク標準のログイン関数は対応していることが多い一方（例: Django の `login()` はセッションキーを入れ替える、Spring Security は既定でセッション固定対策を行う）、**自前のログイン処理**や、express-session で `req.session.userId = ...` と書くだけの実装では入れ替わりません（express-session では `req.session.regenerate()` を自分で呼ぶ）。Rails も自前認証なら `reset_session` を呼ぶ必要があります。
「再認証」も対象です。重要操作の前のパスワード再入力、MFA の 2 段目の成功、権限昇格（sudo モード）のタイミングでも作り直します。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | どのイベントでトークンを再発行するかを列挙する（ログイン、MFA 完了、再認証、権限変更など） |
| 実装 | ログイン成功時に旧セッションを破棄して新しい ID を発行する。ログイン前のセッションに入っていたデータ（カートなど）を引き継ぐ場合も、ID は新しくする |
| レビュー | ログイン処理で `session[...] = user.id` のように**値の書き込みだけ**していないか。`regenerate`・`cycle_key`・`reset_session`・`changeSessionId` の呼び出しがあるか |
| テスト | ログイン前のセッション Cookie 値を記録 → ログイン → Cookie 値が変わっていること、かつ**記録した旧値を使うと認証済みとして扱われない**こと |

**誤解しやすいポイント**: 「ログイン後に新しい Cookie が返ってきているから OK」で終わらせず、**旧トークンがサーバー側で無効になっているか**まで確認します。原文は「新しいトークンの生成」と「現在のトークンの終了」の両方を求めています。

---

### V7.4.1 ログアウト・期限切れ後はセッションを二度と使えなくする `L1`

> **原文**: Verify that when session termination is triggered (such as logout or expiration), the application disallows any further use of the session. For reference tokens or stateful sessions, this means invalidating the session data at the application backend. Applications using self-contained tokens will need a solution such as maintaining a list of terminated tokens, disallowing tokens produced before a per-user date and time or rotating a per-user signing key.

**ひとことで**: ログアウトや期限切れでセッションを終えたら、同じトークンでは以後一切アクセスできないようにする。サーバー側セッションならバックエンドで破棄し、JWT などの自己完結型トークンなら失効させる仕組みを用意する。

**開発の現場で言うと**: よくある不備は「ログアウトでブラウザの Cookie や localStorage を消すだけ」です。トークンを控えておいた攻撃者（または盗んだ人）は、ログアウト後もそれを使えます。
- サーバー側セッション: Django の `logout()` はセッションを破棄します。express-session なら `req.session.destroy()` を呼ぶ必要があります
- JWT: 署名が正しく期限内なら検証は通ってしまうため、原文が挙げる方法（失効リスト、ユーザーごとの「この時刻より前に発行されたトークンは無効」、ユーザーごとの署名鍵のローテーション）のいずれかを実装します

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | トークン方式に応じた失効方法を決める。JWT を使うなら、失効をどこで判定するか（全 API で失効リストを引くのか等）と、そのコストを設計に入れる |
| 実装 | ログアウト API でサーバー側のセッションデータを削除する。JWT なら `jti` を失効リストに入れる、またはユーザーの `tokens_valid_after` を更新して検証時に `iat` と比較する |
| レビュー | ログアウト処理が `clearCookie`・`localStorage.removeItem`・`delete cookies[...]` だけで終わっていないか。JWT 検証ミドルウェアに失効判定があるか |
| テスト | ログイン → トークン（Cookie 値）を控える → ログアウト → 控えたトークンで保護 API を叩き 401 になること。期限切れ後も同様 |

**誤解しやすいポイント**: 「JWT の有効期限を短くしているからログアウト処理は不要」は、この要件を満たしません。原文は自己完結型トークンでも「終了したら使えなくする」仕組みを求めています。短い期限は被害時間を縮める補助策です。

```python
# JWT: ユーザーごとの「この時刻より前の発行は無効」
def verify(token):
    claims = jwt.decode(token, KEY, algorithms=["ES256"], audience=AUD)
    user = User.get(claims["sub"])
    if claims["iat"] < user.tokens_valid_after.timestamp():
        raise Unauthorized()
    return user
# ログアウト時: user.tokens_valid_after = now()
```

---

### V7.4.2 アカウントの無効化・削除時に全セッションを終了する `L1`

> **原文**: Verify that the application terminates all active sessions when a user account is disabled or deleted (such as an employee leaving the company).

**ひとことで**: アカウントを無効化・削除したら、そのユーザーのすべての有効なセッション（全端末）を即座に終了させる。

**開発の現場で言うと**: 「退職者のアカウントを管理画面で無効化した」「不正利用が発覚して凍結した」「ユーザーが退会した」ときに、すでにログイン中のブラウザやスマホアプリのセッションが生きたままになる問題です。
多くのフレームワークは、「無効化したら既存セッションも消す」ところまでは自動ではやってくれません。例えば Django の `is_active=False` は新規ログインを防ぎますが、既存セッションの扱いは認証バックエンドやミドルウェアの構成に依存するので、実際に試して確認してください。
**ユーザー ID からそのユーザーのセッション一覧を引けない**構成（Cookie 署名だけのセッション、ユーザーと紐付けていないセッションストア、JWT）では、設計段階で手当てが必要です。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | ユーザー → セッションの対応を引ける仕組み（セッションテーブルにユーザー ID を持つ、ユーザーごとの `tokens_valid_after` など）を用意する。SSO を使う場合は IdP 側の無効化との連携も決める |
| 実装 | 無効化・削除処理の中で、そのユーザーの全セッション削除（または失効時刻の更新）を同じトランザクション／処理の流れで実行する。加えて、リクエストごとの認証でアカウント状態（有効か）を確認する |
| レビュー | `is_active = False`、`disabled`、`deleted_at`、`destroy` などのアカウント無効化・削除処理に、セッション削除の呼び出しがあるか。リフレッシュトークンも失効させているか |
| テスト | ユーザー A で 2 つのブラウザからログイン → 管理者が A を無効化 → 両方のブラウザで次のリクエストが 401／ログイン画面になること。リフレッシュトークンで新しいアクセストークンが取れないこと |

**誤解しやすいポイント**: 「無効化したユーザーはログインできないから大丈夫」は、**すでにログイン済み**のセッションを考慮していません。リフレッシュトークンや「ログイン状態を保持する」Cookie が数週間有効な設計だと、退職者がその間ずっとアクセスできることになります。

---

## この章のまとめ: PR レビューで聞く質問

- トークンの検証はすべてサーバー側で行っていますか？ フロントでデコードした値や Cookie の存在だけで認可していませんか？
- 自前でトークンや ID を生成している箇所は、CSPRNG（`secrets`・`crypto.randomBytes`・`SecureRandom`）で 128 ビット以上ですか？
- ログイン・再認証・MFA 完了のタイミングでセッション ID を作り直し、古い ID を無効にしていますか？
- ログアウトでクライアント側のトークンを消すだけでなく、サーバー側でも使えなくしていますか？（JWT ならどう失効させますか？）
- アカウントの無効化・削除で、そのユーザーの全端末のセッションとリフレッシュトークンを終了させていますか？
