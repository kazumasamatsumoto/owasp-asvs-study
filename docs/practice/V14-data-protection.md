# V14 データ保護 — L1 要件を開発の観点で読む

> 対象: L1 要件 2 件 ／ 章の解説: [../chapters/V14-data-protection.md](../chapters/V14-data-protection.md)

## この章の要件を一言でいうと

機微なデータが **意図しない場所に残る・漏れる** のを防ぐ話です。L1 の 2 件は、どちらもクライアントとサーバーの間のやり取りに関するものです。
1 つ目は「機微データを URL に載せない」で、API の設計（エンドポイントやパラメータの形）、フロントエンドからの呼び出し方、メールや外部連携のリンク設計に関わります。
2 つ目は「ログアウトやセッション終了時に、ブラウザに残った認証済みデータを消す」で、SPA の状態管理、`localStorage` / IndexedDB の使い方、ログアウト処理の実装に関わります。
どちらも「暗号化」ではなく、データの **置き場所と寿命** を意識する要件です。

## 要件ごとの読み解き

### V14.2.1 機微データを URL・クエリ文字列に入れない `L1`

> **原文**: Verify that sensitive data is only sent to the server in the HTTP message body or header fields, and that the URL and query string do not contain sensitive information, such as an API key or session token.

**ひとことで**: API キー、セッショントークン、個人情報などの機微データは、リクエストボディかヘッダで送り、URL やクエリ文字列に含めない。

**開発の現場で言うと**: URL はアクセスログ、プロキシや CDN のログ、ブラウザ履歴、ブックマーク、`Referer` ヘッダ、エラー監視ツール（Sentry など）の記録、分析ツールのページビューなど、**多くの場所に自動的に記録・送信** されます。そこに秘密が入っていると、意図しない人やサービスに渡ります。
典型的な崩れ方は次のとおりです。

- `GET /api/export?api_key=xxx` のように API キーをクエリで受け付ける（「curl で試しやすいから」）。
- 検索画面を `GET` フォームで作り、氏名・電話番号・メールアドレスでの検索条件が URL に載る。
- WebSocket や SSE（`EventSource`）でカスタムヘッダを付けられないため、トークンをクエリ文字列に入れる。
- ファイルのダウンロード URL に長期間有効なトークンを入れる。

フレームワークがこれを自動で防ぐことはありません。API のパラメータ設計の段階で決める事項です。WebSocket では、Cookie ベースの認証にする、接続後の最初のメッセージで認証する、短命・1 回限りのチケットを使う、といった代替方式があります。パスワードリセットのようにメール内リンクにトークンを含める設計は広く使われていますが、その場合も短命・1 回限りにし、リンク先ページで `Referrer-Policy` を設定し、トークンを POST で送り直すなど、URL に残る影響を小さくする工夫が考えられます。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | API 仕様（OpenAPI など）で、認証情報は `Authorization` ヘッダ（または Cookie）、機微な検索条件は POST ボディ、と決める。URL パスに入れてよい識別子（推測困難な ID など）と入れてはいけない値を区別する。 |
| 実装 | 機微な条件を含む検索は POST にする。外部 API を呼ぶクライアントコードでも API キーはヘッダに付ける（連携先がクエリしか受け付けない場合は、その例外を文書化しログのマスキングを行う）。`Referrer-Policy` を設定する。 |
| レビュー | `?token=`、`?api_key=`、`?apikey=`、`access_token=`、`?session`、`?password=`、`?email=`、`req.query.token`、`request.GET["token"]`、`params[:token]`、`@RequestParam` で秘密を受けている箇所、`new WebSocket(` / `new EventSource(` の URL 組み立てを grep する。 |
| テスト | 主要な画面操作・API 呼び出しを行ったあと、アクセスログ・プロキシログ・ブラウザ履歴（またはブラウザの開発者ツールのネットワークタブ）を確認し、URL 部分にトークン・API キー・個人情報が出ていないこと。クエリでトークンを渡したリクエストが拒否される（受け付けない）こと。 |

**誤解しやすいポイント**: 「HTTPS だから URL も暗号化されている」は半分だけ正しい認識です。通信経路上ではパスとクエリも暗号化されますが、**送信元のブラウザと受信先のサーバー・ログ・分析ツール側では平文で記録** されます。この要件が防ぎたいのは通信路の盗聴ではなく、そうした「端点での残留」です。

---

### V14.3.1 セッション終了時にクライアント側の認証済みデータを消す `L1`

> **原文**: Verify that authenticated data is cleared from client storage, such as the browser DOM, after the client or session is terminated. The 'Clear-Site-Data' HTTP response header field may be able to help with this but the client-side should also be able to clear up if the server connection is not available when the session is terminated.

**ひとことで**: ログアウトやセッション終了のとき、ブラウザの画面（DOM）やストレージに残っているログイン後のデータを消す。サーバーに繋がらない場合でもクライアント側だけで消せるようにする。

**開発の現場で言うと**: 共有 PC や貸し出し端末で、ログアウト後に「戻る」ボタンや別タブ、開発者ツールから前のユーザーの情報が見えてしまうケースが対象です。
SPA（React / Vue / Next.js など）では、ログイン後に取得したユーザー情報や一覧データが、状態管理ストア（Redux、Zustand、Pinia、React Query / SWR のキャッシュ）、`localStorage`、`sessionStorage`、IndexedDB、Service Worker のキャッシュに残ります。**サーバー側でセッションを破棄しても、これらは自動では消えません**。
サーバーレンダリング中心のアプリ（Django / Rails のテンプレート）でも、ブラウザキャッシュや bfcache（戻る・進むキャッシュ）で前の画面が表示されることがあります。
`Clear-Site-Data: "cache", "cookies", "storage"` ヘッダをログアウトのレスポンスで返すと、対応ブラウザではそのオリジンのデータを消去できます。ただしブラウザごとの対応状況には差があるため事前に確認が必要で、また要件が書いているとおり、ネットワーク切断中やセッションタイムアウト時にはヘッダを受け取れないので、**クライアント側のコードでも消去する** 必要があります。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 「クライアントのどこに何を保存しているか」を一覧化する（ストア、各ストレージ、Service Worker キャッシュ、Cookie）。セッション終了のトリガー（明示ログアウト、タイムアウト、API が 401 を返した、別タブでログアウト）ごとに消去処理を呼ぶと決める。 |
| 実装 | 共通の `clearClientState()` を作り、ストアのリセット、`localStorage` / `sessionStorage` の関連キー削除、IndexedDB の削除、データ取得ライブラリのキャッシュクリア、Service Worker キャッシュの削除を行う。ログアウト API の成否にかかわらず実行する。複数タブは `storage` イベントや `BroadcastChannel` で同期する。ログアウト応答に `Clear-Site-Data` を付ける。 |
| レビュー | `localStorage.setItem` / `sessionStorage.setItem` / `indexedDB` / `caches.open` の使用箇所と、それに対応する削除処理がログアウト経路にあるかを照合する。ログアウト処理が `await fetch('/logout')` の成功後にだけ消去していないか（失敗時に残る）を見る。 |
| テスト | ログインして個人情報を表示 → ログアウト → 開発者ツールの Application タブで各ストレージが空であること、「戻る」ボタンで個人情報が表示されないこと。ネットワークをオフラインにしてからログアウトしても消えること。ログアウト応答ヘッダに `Clear-Site-Data` があること（採用した場合）。 |

**誤解しやすいポイント**: 「ログアウトでセッション Cookie を消してサーバー側のセッションも破棄しているから十分」は不十分です。それで防げるのは **以後のサーバーへのアクセス** で、**すでにブラウザに届いているデータ** は残り続けます。この要件はまさにその残留データを対象にしています。

```js
async function logout() {
  try { await fetch("/logout", { method: "POST" }); } catch (_) { /* オフラインでも続行 */ }
  clearClientState(); // ストア・ストレージ・キャッシュを必ず消す
  location.replace("/login");
}
```

---

## この章のまとめ: PR レビューで聞く質問

- トークン・API キー・個人情報をクエリ文字列や URL パスで受け渡ししている箇所はありませんか？
- 機微な条件を含む検索やフォームは POST になっていますか？ WebSocket / SSE の認証はクエリ以外の方法ですか？
- クライアントのどこ（ストア、各ストレージ、キャッシュ）に認証後のデータを置いているか、一覧化されていますか？
- ログアウト・タイムアウト・401 受信のすべての経路で、クライアント側の消去処理が呼ばれますか？ サーバーに繋がらなくても消えますか？
- ログアウト応答で `Clear-Site-Data` を使うか検討しましたか？
