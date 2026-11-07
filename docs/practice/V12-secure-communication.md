# V12 安全な通信 — L1 要件を開発の観点で読む

> 対象: L1 要件 3 件 ／ 章の解説: [../chapters/V12-secure-communication.md](../chapters/V12-secure-communication.md)

## この章の要件を一言でいうと

ユーザー（ブラウザ・モバイルアプリ・外部システム）が **インターネット越しにアクセスしてくる HTTP サービス** の TLS 設定の話です。
アプリのコードそのものより、ロードバランサー・CDN・リバースプロキシ（nginx 等）・PaaS の設定、IaC（Terraform など）、そしてアプリ側の「HTTP で来たときにどう振る舞うか」の設定に現れます。
L1 の 3 件は「古い TLS を無効にする」「平文 HTTP にフォールバックしない」「公的に信頼された証明書を使う」で、いずれも外部向けの入口に関する要件です。内部サービス間通信の暗号化は L2 以上（V12.3）で扱われます。

## 要件ごとの読み解き

### V12.1.1 最新の推奨 TLS バージョンだけを有効にする `L1`

> **原文**: Verify that only the latest recommended versions of the TLS protocol are enabled, such as TLS 1.2 and TLS 1.3. The latest version of the TLS protocol must be the preferred option.

**ひとことで**: TLS 1.2 と 1.3 のような推奨バージョンだけを有効にし、TLS 1.0 / 1.1 や SSL は無効にする。両方使えるなら TLS 1.3 を優先する。

**開発の現場で言うと**: 新しいサービスをクラウドのロードバランサーや CDN の背後に公開するとき、または nginx / Apache の設定を書くときです。
多くのアプリ（Django、Rails、Express、Spring Boot など）は本番では TLS を自分で終端せず、前段の ALB / CloudFront / Cloud Load Balancing / nginx / PaaS の入口で終端します。その場合、**TLS バージョンを決めているのはアプリではなく入口の設定**です。クラウドの LB は「セキュリティポリシー」「SSL ポリシー」のような名前で TLS バージョンの組み合わせを選ぶ仕組みを持っていることが多く、古い互換性重視のポリシーを選ぶと TLS 1.0 / 1.1 が残ります。
「TLS 1.3 を優先」については、TLS のバージョンネゴシエーションでは双方が対応する最も新しいバージョンが選ばれるのが通常なので、TLS 1.3 を有効にしていれば満たされることが多いです。重要なのは TLS 1.3 を **有効にし忘れない** ことです。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | TLS を終端するコンポーネント（どの LB / CDN / プロキシか）をすべて洗い出し、許可バージョンを「TLS 1.2 と 1.3」と決める。古いクライアント（古い組み込み機器や業務端末）対応が必要なら、例外として文書化して判断する。 |
| 実装 | IaC で TLS ポリシーを明示的に指定する（既定値に頼らない）。nginx なら `ssl_protocols TLSv1.2 TLSv1.3;`。アプリが直接 TLS を終端する場合は、サーバー設定で最小バージョンを指定する。 |
| レビュー | IaC で `ssl_policy`、`minimum_protocol_version`、`ssl_protocols`、`TLSv1`、`TLSv1.1`、`SSLv3`、`min_tls_version` などを grep する。新しい公開エンドポイントの追加 PR では TLS ポリシー指定があるかを見る。 |
| テスト | `openssl s_client -connect example.com:443 -tls1_1` で接続できないこと、`-tls1_3` で接続できること。`testssl.sh` や `nmap --script ssl-enum-ciphers -p 443` で有効バージョンの一覧を確認する。CI やスケジュール実行で定期確認すると設定のずれに気付ける。 |

**誤解しやすいポイント**: 「クラウドのマネージド LB を使っているから安全な既定値になっているはず」は危険です。既定のポリシーが互換性重視で古いバージョンを含む場合や、作成時期によって既定値が異なる場合があります。必ず実際の接続テストで確認してください。

---

### V12.2.1 外部向け HTTP サービスは常に TLS、平文にフォールバックしない `L1`

> **原文**: Verify that TLS is used for all connectivity between a client and external facing, HTTP-based services, and does not fall back to insecure or unencrypted communications.

**ひとことで**: クライアントと外部公開している HTTP サービスの通信はすべて TLS で行い、平文 HTTP に落ちる経路を作らない。

**開発の現場で言うと**: 「Web 画面は HTTPS だが、モバイルアプリが叩く API のベース URL が `http://` のまま」「画像だけ HTTP の別ドメインから読み込んでいる」「ステージングで HTTP を許可していた設定が本番にも残っている」といった形で崩れます。
フレームワーク側にも HTTPS を強制する設定があります。たとえば Django の `SECURE_SSL_REDIRECT` と `SECURE_HSTS_SECONDS`（どちらも既定では無効）、Rails の `config.force_ssl`（生成される production 設定で有効になっているかはバージョンにより異なるので確認が必要）、Spring Security の `requiresChannel` などです。Express には標準の強制機能は無いので、前段で HTTPS に限定するかミドルウェアで対応します。
HTTP から HTTPS へのリダイレクトはブラウザ向けの画面では一般的な対策ですが、**API ではリダイレクトする時点でトークンや本文がすでに平文で送られている**点に注意が必要です。API 用のホストでは HTTP（80 番）を閉じるかエラーを返す方が安全です。ブラウザ向けには HSTS ヘッダで以後の HTTP アクセスを防ぎます。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 外部公開しているホスト名・ポートを一覧化し、それぞれ「HTTPS のみ」「HTTP は HTTPS へリダイレクトのみ（画面系）」「HTTP は閉じる（API 系）」を決める。HSTS を付けるかと期間を決める。 |
| 実装 | 入口（LB / CDN）で HTTP リスナーをリダイレクト専用にするか削除する。アプリの設定で HTTPS 強制と HSTS を有効にする。クライアント（SPA / モバイル）の API ベース URL を `https://` に固定する。 |
| レビュー | `http://` で始まる URL リテラル（`localhost` 以外）、`SECURE_SSL_REDIRECT`、`force_ssl`、`requiresChannel`、LB の `listener` / `port = 80`、モバイルの `NSAllowsArbitraryLoads` や `usesCleartextTraffic="true"` を grep する。 |
| テスト | `curl -v http://api.example.com/v1/me -H "Authorization: Bearer dummy"` が接続拒否またはエラーになること（200 で応答しないこと）。画面系は `curl -I http://www.example.com/` が HTTPS へのリダイレクトになり、HTTPS 応答に `Strict-Transport-Security` が付くこと。ブラウザの開発者ツールで混在コンテンツ警告が出ないこと。 |

**誤解しやすいポイント**: 「HTTP→HTTPS のリダイレクトを入れたから平文は流れない」は不十分です。最初の HTTP リクエストは平文で送られており、そこに Cookie や Authorization ヘッダが乗っていれば漏れます。Cookie の `Secure` 属性、HSTS、API の HTTP ポート閉鎖を組み合わせて初めて「平文に落ちない」状態になります。

---

### V12.2.2 外部向けサービスには公的に信頼された証明書を使う `L1`

> **原文**: Verify that external facing services use publicly trusted TLS certificates.

**ひとことで**: インターネットに公開するサービスには、ブラウザや OS が標準で信頼している認証局が発行した証明書を使う。

**開発の現場で言うと**: 本番やユーザーが触るステージング環境で、自己署名証明書や社内 CA の証明書を使ってしまうケースです。そうすると利用者は証明書エラーを無視するよう求められ、中間者攻撃との区別がつかなくなります。モバイルアプリや連携先システムの開発者が「証明書検証を無効にする」回避策を入れる原因にもなります。
Let's Encrypt や、クラウド事業者の証明書発行サービス（AWS Certificate Manager など）、商用 CA の証明書はいずれも公的に信頼された証明書です。最近の PaaS（Vercel、Heroku、Cloud Run など）は独自ドメインに自動で証明書を発行する機能を持つことが多いです。
この要件は「外部向け」に限定されています。社内向けサービスで社内 CA を使うことは、この要件の範囲外です（内部通信は L2 以上の V12.3 で扱われます）。

| 観点 | 具体的にやること |
| --- | --- |
| 設計 | 外部公開ドメインごとに証明書の発行元と更新方法（自動更新か手動か）を決める。期限切れも実質的に「信頼されない証明書」になるため、更新の監視を運用に組み込む。 |
| 実装 | IaC で証明書を管理し、自動更新できる仕組み（ACM、cert-manager、PaaS の自動発行など）を使う。中間証明書を含む完全なチェーンを設定する。 |
| レビュー | 公開エンドポイントの設定で自己署名証明書や社内 CA の証明書ファイルを参照していないか。クライアントコードに `verify=False`、`rejectUnauthorized: false`、`InsecureSkipVerify`、`-k` / `--insecure` が入っていないか（証明書が信頼されていない兆候）。 |
| テスト | `curl https://example.com/`（`-k` なし）が証明書エラーなく成功すること。`openssl s_client -connect example.com:443 -servername example.com` で `Verify return code: 0 (ok)` になること。SSL Labs などの外部診断でチェーン不備がないこと。証明書の残り有効日数を監視しアラートを出す。 |

**誤解しやすいポイント**: 「通信は暗号化されているから自己署名でも問題ない」は誤りです。暗号化されていても、**相手が本物のサーバーかを確認できない**なら中間者攻撃を防げません。また、自分のブラウザで動作確認できても、中間証明書が欠けていると一部のクライアント（古い Android や API クライアント）だけ失敗することがあります。

---

## この章のまとめ: PR レビューで聞く質問

- TLS を終端しているすべての入口（LB / CDN / プロキシ）で、TLS 1.2 と 1.3 だけが有効になっていますか？ IaC で明示指定していますか？
- 外部公開ホストで平文 HTTP を受け付けていませんか？ API ホストでは HTTP を閉じていますか？
- HSTS と Cookie の `Secure` 属性は有効ですか？ クライアントの接続先 URL は `https://` に固定されていますか？
- 外部向けの証明書は公的 CA 発行で、自動更新と期限監視の仕組みがありますか？
- 証明書エラーを回避するための `verify=False` / `rejectUnauthorized: false` などがコードに紛れ込んでいませんか？
