# V4 API と Web サービス — L1 要件を開発の観点で読む

> 対象: L1 要件 2 件 ／ 章の解説: [../chapters/V04-api-and-web-service.md](../chapters/V04-api-and-web-service.md)

## この章の要件を一言でいうと

「API（REST / JSON、XML、GraphQL、WebSocket）のレスポンスや通信路を設定するとき」の話です。
L1 は 2 件だけで、①レスポンスの `Content-Type` を中身と一致させ文字コードを明示する、②WebSocket は必ず TLS（`wss://`）で使う、という「API の基本的な衛生管理」です。
原文が強調しているとおり、API にも認証（V6）、セッション（V7）、入力検証（V2）などの他章の要件がそのまま適用されます。この章だけを見て API のセキュリティが足りていると判断しないでください。

## 要件ごとの読み解き

### V4.1.1 Content-Type を中身と一致させ、charset を明示する `L1`

> **原文**: Verify that every HTTP response with a message body contains a Content-Type header field that matches the actual content of the response, including the charset parameter to specify safe character encoding (e.g., UTF-8, ISO-8859-1) according to IANA Media Types, such as "text/", "/+xml" and "/xml".

**ひとことで**: 本文のあるレスポンスには、実際の中身に合った `Content-Type` を付け、テキスト系や XML 系のメディアタイプでは `charset` も指定すること。

**開発の現場で言うと**: ブラウザやクライアントは `Content-Type` を見て「どう解釈するか」を決めます。ずれていると、JSON のつもりで返した文字列が HTML として描画される（XSS）、文字コードの推測によって想定外の解釈をされる、といった問題が起きます。原文の例示はテキスト系（`text/*`）や XML 系（`*/xml`、`*+xml`）のメディアタイプで、これらは IANA の定義上 `charset` パラメータを持つため、`text/html; charset=utf-8` のように明示します。
フレームワークの「デフォルトで守られる部分」と「崩れる部分」:
- Express の `res.json()`、Django の `JsonResponse`、Rails の `render json:`、Spring の `@RestController` + Jackson などは、JSON 用の `Content-Type` を自動で付けます
- 崩れるのは、**文字列をそのまま返す**場合です。たとえば Express の `res.send("文字列")` や、Flask でビュー関数が文字列を返す場合、多くは `text/html` 扱いになります。API のエラーハンドラで `res.send("Invalid id: " + id)` のように入力値を返すと、そのまま HTML として解釈されえます
- CSV / Excel のエクスポート、ファイルダウンロード、プロキシして外部のレスポンスを返す処理、`204` 以外で本文を返すヘルスチェックなど、自分でヘッダを組み立てる場所

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | エンドポイントごとに返すメディアタイプを API 仕様（OpenAPI の `content`）に明記する。文字コードは UTF-8 に統一する方針を決める |
| 実装 | JSON はフレームワークの JSON レスポンス関数で返す。文字列を返す場合は `Content-Type: text/plain; charset=utf-8` などを明示する。ファイル配信では拡張子やアップロード時の申告値ではなく、サーバーが決めた型を設定する。共通のエラーハンドラも JSON 型で返す |
| レビュー | `res.send(`、`res.end(`、`return "..."`（Flask）、`HttpResponse(`（`content_type` 指定なし）、`render plain:` / `render html:`、`@ResponseBody String`、`setContentType(` / `setHeader("Content-Type"` の値に `charset` があるか、エラーハンドラ・404 ハンドラの返し方 |
| テスト | 全エンドポイント（正常系・バリデーションエラー・404・500）に `curl -sI` を実行し、`Content-Type` があり中身と一致していること、`text/*` や XML 系では `charset=` が付いていることを確認する。エラー経路に `<script>alert(1)</script>` を含む値を送り、レスポンスが `text/html` で返らないこと |

**誤解しやすいポイント**: 「JSON API だから `Content-Type` は自動で正しい」は正常系だけの話であることが多く、**エラー応答や例外ハンドラ、フレームワーク既定のエラーページ** が `text/html` で入力値を含んでいる例はよくあります。また `X-Content-Type-Options: nosniff`（V3.4.4, L2）を付けていても、`Content-Type` 自体が `text/html` と誤っていれば防げません。両方が揃って意味を持ちます。

---

### V4.4.1 WebSocket は WSS（TLS）で使う `L1`

> **原文**: Verify that WebSocket over TLS (WSS) is used for all WebSocket connections.

**ひとことで**: WebSocket の接続はすべて暗号化された `wss://` で行い、平文の `ws://` を使わないこと。

**開発の現場で言うと**: チャット、通知のプッシュ、共同編集、ダッシュボードのリアルタイム更新、株価やゲームの配信などで WebSocket（Socket.IO、ActionCable、Django Channels、Spring の STOMP over WebSocket など）を使うときです。WebSocket は HTTP とは別プロトコルなので、「サイトは HTTPS 化済み」でも WebSocket 側の URL が `ws://` のままだと通信内容（メッセージやセッション情報）が平文で流れます。
ブラウザは HTTPS のページから `ws://` への接続を混在コンテンツとしてブロックするのが一般的なので、ブラウザ経由では問題が表面化しやすい一方、次のような場所で `ws://` が残りがちです。
- 環境変数や設定ファイルにハードコードされた接続先 URL（開発用の `ws://localhost` が本番に紛れ込む）
- モバイルアプリ、デスクトップアプリ、サーバー間（マイクロサービス間）の WebSocket クライアント
- TLS を終端するロードバランサの裏で、別経路（直接ポート公開）からも `ws://` で接続できてしまう構成
- Socket.IO などのライブラリが WebSocket 以外（HTTP ロングポーリング）にフォールバックする場合、その HTTP 通信も HTTPS である必要がある

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | WebSocket のエンドポイントを一覧化し、TLS の終端場所（LB / リバースプロキシ / アプリ）を決める。平文ポートを外部に公開しない構成にする |
| 実装 | クライアントの接続先は `wss://` を使う。ブラウザでは `location.protocol` に依存して `ws:` / `wss:` を切り替えるより、本番は `wss://` 固定にするほうが事故が少ない。サーバー側は `ws://` での接続を受け付けない（TLS 終端の LB 経由のみ到達可能にする） |
| レビュー | `ws://`、`new WebSocket(`、`io(`、`createConsumer(`（ActionCable）、`SockJS(`、`ws.Server(` / `WebSocketServer(` の生成と待ち受けポート、`cable.yml` / 環境変数の接続先 URL を grep。`ws://` が本番設定に含まれていないか |
| テスト | 本番相当の環境で、ブラウザ DevTools の Network → WS タブで接続先が `wss://` であることを確認。`websocat ws://app.example.com/cable` や `wscat -c ws://...` で平文接続を試み、接続できない（拒否・タイムアウト）こと。モバイル / サーバー間クライアントの設定値も確認 |

**誤解しやすいポイント**: 「WebSocket の中身は認証済みユーザーしか見られないから平文でもよい」は誤りで、平文では経路上の第三者がメッセージや認証情報（接続時の Cookie やトークン）を盗聴・改ざんできます。また「`wss://` を使っている」だけでは WebSocket の認証や Origin チェック（V4.4 の L2 要件）は満たされないので、TLS 化は最低限のスタートラインと捉えてください。

---

## この章のまとめ: PR レビューで聞く質問

- 新しいエンドポイントは、正常系だけでなくエラー時も中身に合った `Content-Type` を返していますか？
- `text/*` や XML 系のレスポンスに `charset`（例: `utf-8`）が明示されていますか？
- 文字列を直接返す箇所（`res.send`、Flask の `return "..."` など）で、入力値を含んだ文字列が `text/html` として返っていませんか？
- WebSocket の接続先 URL は、本番のすべてのクライアント（ブラウザ・モバイル・サーバー間）で `wss://` になっていますか？
- WebSocket サーバーの平文ポートが外部から到達できる状態になっていませんか？
