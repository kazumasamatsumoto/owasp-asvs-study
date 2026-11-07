# V14 データ保護（Data Protection）

> 📘 原文: [0x23-V14-Data-Protection.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x23-V14-Data-Protection.md)
> 📊 要件数: **13**（L1: 2 / L2: 7 / L3: 4）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V14.md](../../checklists/by-chapter/V14.md)

## 1. この章の目的

アプリケーションはあらゆる利用パターンやユーザーの行動を想定しきれません。そのため、クライアント端末上の機微データへの不正アクセスを制限するコントロールを実装する必要があります。

V14 は、「どのデータを守るべきか」を定義し、「どう守るか」、そして具体的に実装すべき仕組みや避けるべき落とし穴を扱う章です。まず機微データを分類・文書化し（V14.1）、その分類に沿ってサーバ側（V14.2）とクライアント側（V14.3）で漏えいを防ぎます。

なお、大量の抽出・改ざん・過剰な利用といった問題については、「異常」の判断は脅威モデルとビジネスリスクに依存するため、ASVS では検知を V16（セキュリティログとエラー処理）、制限の設定を V2（検証とビジネスロジック）で扱います。また原文は、各国のプライバシー法規制そのものをなぞるのではなく、機微データ保護の技術的な考慮事項に絞っていると明言しており、必要に応じて法律やプライバシーの専門家に相談するよう勧めています。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V14.1 | データ保護のドキュメント化 | 機微データの特定・保護レベル分類と、レベルごとの保護要件の文書化 | 2 |
| V14.2 | 一般的なデータ保護 | URL への機微データ混入、サーバ側キャッシュ、第三者送信、最小限の返却、保持期間、メタデータ除去 | 8 |
| V14.3 | クライアント側のデータ保護 | セッション終了時の消去、ブラウザキャッシュ防止、ブラウザストレージへの保存制限 | 3 |

## 3. 押さえるべき重要要件

### V14.2.1 — 機微データを URL やクエリ文字列に含めない（L1）

- **要件（意訳）**: 機微データは HTTP メッセージのボディまたはヘッダフィールドでのみサーバに送信し、URL やクエリ文字列に API キーやセッショントークンなどの機微情報を含めないこと。
- **なぜ重要か**: URL はアクセスログ、プロキシのログ、ブラウザ履歴、`Referer` ヘッダ、監視ツールなど、あちこちに残ります。`?api_key=...` や `?token=...` は、意図せず多数のシステムや第三者に記録されます。
- **実装のポイント**: 認証情報は `Authorization` ヘッダや Cookie で、個人情報などは POST ボディで送ります。

```python
import requests

# ❌ NG 例: トークンや個人情報をクエリ文字列に入れる
requests.get(f"https://api.example.com/v1/users?api_key={API_KEY}&email={email}")

# ✅ OK 例: 認証情報はヘッダ、機微な検索条件はボディ
requests.post(
    "https://api.example.com/v1/users/search",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"email": email},
    timeout=5,
)
```

### V14.3.1 — セッション終了時にクライアント側の認証済みデータを消去する（L1）

- **要件（意訳）**: クライアントやセッションが終了した後、ブラウザの DOM などのクライアントストレージから認証済みデータを消去すること。`Clear-Site-Data` HTTP レスポンスヘッダが役立つ場合があるが、セッション終了時にサーバに接続できない場合でもクライアント側で後始末できるようにしておくこと。
- **なぜ重要か**: 共用 PC でログアウトした後も、画面上の DOM や localStorage に個人情報が残っていると、次の利用者がそれを閲覧できます。
- **実装のポイント**: ログアウト時のレスポンスに `Clear-Site-Data` を付けると同時に、フロントエンドでも自前でストレージや状態を消去します。

```python
# ✅ OK 例（Flask）: ログアウト時にブラウザ側のキャッシュ・Cookie・ストレージを消去するよう指示
@app.post("/logout")
def logout():
    session.clear()
    resp = make_response("", 204)
    resp.headers["Clear-Site-Data"] = '"cache", "cookies", "storage"'
    return resp
```

```javascript
// ✅ OK 例（JS）: サーバに届かなくてもクライアント側で後始末する
async function logout() {
  try { await fetch("/logout", { method: "POST" }); } catch (e) { /* オフラインでも続行 */ }
  sessionStorage.clear();
  localStorage.removeItem("profile");
  appState.reset();             // DOM / メモリ上の認証済みデータも破棄
  location.assign("/login");
}
```

### V14.1.1 — 機微データを特定し保護レベルに分類する（L2）

- **要件（意訳）**: アプリケーションが生成・処理するすべての機微データを特定し、保護レベルに分類すること。Base64 文字列や JWT の平文ペイロードのように、エンコードされているだけで簡単にデコードできるデータも含む。保護レベルは、アプリケーションが準拠すべきデータ保護・プライバシーの規制や標準を考慮すること。
- **なぜ重要か**: 何が機微データか定義されていなければ、暗号化・ログ出力・保持期間などの判断が人によってばらばらになります。特に JWT のペイロードは「暗号化されている」と誤解されがちですが、Base64URL でエンコードされているだけで誰でも読めます。
- **実装のポイント**: データ項目ごとに保護レベル（例: 公開 / 社内 / 機密 / 極秘）を割り当てた一覧（データ分類表）を作ります。V14.1.2 で、レベルごとに暗号化・完全性検証・保持期間・ログ出力方法・ログ内データへのアクセス制御・DB レベル暗号化・プライバシー強化技術などの保護要件を文書化し、V14.2.4 でそれが実装されていることを確認します。

```python
import base64, json

# ❌ 誤解: 「JWT に入れたから秘匿されている」
jwt_token = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIn0.sig"
payload = jwt_token.split(".")[1]
print(json.loads(base64.urlsafe_b64decode(payload + "==")))  # {'email': 'alice@example.com'} 誰でも読める
```

### V14.2.2 / V14.3.2 — 機微データをキャッシュさせない（L2）

- **要件（意訳）**: ロードバランサやアプリケーションキャッシュなどのサーバコンポーネントに機微データがキャッシュされないようにするか、使用後に安全に消去すること（V14.2.2）。ブラウザに機微データがキャッシュされないよう、十分なキャッシュ防止レスポンスヘッダ（つまり `Cache-Control: no-store`）を設定すること（V14.3.2）。
- **なぜ重要か**: CDN やリバースプロキシが認証済みユーザーのマイページをキャッシュすると、別のユーザーにそのまま配信される事故が起こります。ブラウザのディスクキャッシュに残ると、共用 PC で後から閲覧されます。
- **実装のポイント**: 機微データを返すレスポンスには `Cache-Control: no-store` を付けます。CDN 側でも認証付きリクエストや該当パスをキャッシュ対象外にします。

```python
# ❌ NG 例: 個人情報を返すのにキャッシュ制御なし（中間キャッシュやブラウザに残る可能性）
@app.get("/api/me")
def me():
    return jsonify(current_user.profile())

# ✅ OK 例
@app.get("/api/me")
def me():
    resp = jsonify(current_user.profile())
    resp.headers["Cache-Control"] = "no-store"
    return resp
```

### V14.2.3 — 機微データを信頼できない第三者に送らない（L2）

- **要件（意訳）**: アプリケーションの管理外でデータが収集されることを防ぐため、定義された機微データをユーザートラッカーなどの信頼できない第三者に送信しないこと。
- **なぜ重要か**: アナリティクスタグやエラー監視 SDK が、URL・フォーム入力・画面のテキストを自動収集し、メールアドレスや健康情報などを外部サービスに送信してしまうケースがあります。
- **実装のポイント**: サードパーティスクリプトに渡すイベントやページ URL から機微データを除去し、自動収集機能の設定（入力値のマスキングなど）を確認します。

```javascript
// ❌ NG 例: 機微データをそのままトラッカーへ
analytics.track("checkout", { email: user.email, cardNumber: form.card });

// ✅ OK 例: 必要最小限の非機微データのみ
analytics.track("checkout", { plan: "pro", items: cart.length });
```

### V14.3.3 — ブラウザストレージに機微データを保存しない（L2）

- **要件（意訳）**: ブラウザストレージ（localStorage、sessionStorage、IndexedDB、Cookie など）に保存されるデータに機微データを含めないこと。ただしセッショントークンは例外とする。
- **なぜ重要か**: ブラウザストレージは同一オリジンの JavaScript からいつでも読めるため、XSS が 1 つあれば一括で窃取されます。また端末に永続的に残ります。
- **実装のポイント**: 個人情報や決済情報は必要なときにサーバから取得し、メモリ上だけで扱います。

```javascript
// ❌ NG 例
localStorage.setItem("user", JSON.stringify({ name, address, phone, creditCard }));

// ✅ OK 例: 機微でない UI 設定程度にとどめる
localStorage.setItem("theme", "dark");
```

### V14.2.5 — Web キャッシュデセプションを防ぐ（L3）

- **要件（意訳）**: キャッシュ機構は、そのリソースに期待されるコンテンツタイプのレスポンスで、かつ機微な動的コンテンツを含まないものだけをキャッシュするよう設定すること。存在しないファイルにアクセスされた場合、Web サーバは別の有効なファイルを返すのではなく 404 または 302 を返すこと。これにより Web キャッシュデセプション攻撃を防ぐ。
- **なぜ重要か**: 攻撃者が被害者に `https://example.com/account/profile/x.css` を踏ませると、アプリは `/account/profile` の内容（個人情報入り HTML）を返し、CDN は拡張子 `.css` を見て静的ファイルとしてキャッシュします。攻撃者は同じ URL にアクセスするだけで被害者の情報を取得できます。
- **実装のポイント**: キャッシュ判断を拡張子だけで行わず、レスポンスの `Content-Type` と `Cache-Control` を尊重させます。ルーティングで余分なパスを無視して同じページを返す挙動をなくします。

### V14.2.6 — 必要最小限の機微データだけを返す（L3）

- **要件（意訳）**: アプリケーションの機能に必要な最小限の機微データだけを返すこと。例えば、クレジットカード番号は全桁ではなく一部の桁だけを返す。完全なデータが必要な場合でも、ユーザーが明示的に表示を求めない限り UI ではマスクすること。

```python
# ❌ NG 例
return {"card_number": card.number}

# ✅ OK 例
return {"card_last4": card.number[-4:]}
```

## 4. よくある脆弱性・アンチパターン

- **URL にトークン・API キー・個人情報**: パスワードリセットや API 呼び出しで `?token=`、`?api_key=`、`?email=` を使い、ログや `Referer` から漏れる（V14.2.1）。
- **「JWT / Base64 だから安全」という誤解**: エンコードは暗号化ではない（V14.1.1）。
- **CDN による個人ページのキャッシュ**: `Cache-Control` 未設定、または CDN が拡張子ベースで強制キャッシュ（V14.2.2, V14.2.5, V14.3.2）。
- **ログアウトしても画面やストレージにデータが残る**: SPA でログアウト後も状態管理ストアや localStorage に個人情報が残る（V14.3.1）。
- **localStorage への個人情報の保存**: XSS 1 つで全データが盗まれる（V14.3.3）。
- **アナリティクスやエラー監視への PII 送信**: セッションリプレイツールが入力フォームをそのまま記録する（V14.2.3）。
- **API がオブジェクトを丸ごと返す**: 画面に表示しない項目（全カード番号、内部メモなど）までレスポンスに含まれる（V14.2.6。関連して V15.3.1）。
- **データを永遠に保持**: 退会ユーザーのデータや古いログを削除する仕組みがない（V14.2.7）。
- **アップロード画像の EXIF に位置情報**: ユーザーの同意なく GPS 座標などを含んだまま保存・公開する（V14.2.8）。

```python
# ✅ V14.2.8 の例: Pillow で画像のメタデータ（EXIF）を除去して保存
from PIL import Image

def strip_metadata(src_path, dst_path):
    with Image.open(src_path) as img:
        clean = Image.new(img.mode, img.size)
        clean.putdata(list(img.getdata()))
        clean.save(dst_path)   # EXIF を引き継がない
```

## 5. 検証（テスト）のヒント

- **URL の確認**: プロキシツール（OWASP ZAP、Burp Suite）の履歴を見て、クエリ文字列にトークン・キー・個人情報が含まれていないか確認します。Web サーバのアクセスログも検索します（V14.2.1）。
- **キャッシュヘッダ**: 機微データを返すレスポンスに `Cache-Control: no-store` があるか確認します。CDN を経由する場合は `Age`、`X-Cache` などのヘッダでキャッシュされていないかを確認します（V14.2.2, V14.3.2）。
- **Web キャッシュデセプション**: ログイン状態で `/account/profile/nonexistent.css` のような URL にアクセスし、404/302 になるか、個人情報ページが返りキャッシュされないかを確認します（V14.2.5）。
- **ブラウザストレージ**: 開発者ツールの Application タブで localStorage / sessionStorage / IndexedDB / Cookie の内容を確認し、ログアウト後に消えるかも確認します（V14.3.1, V14.3.3）。
- **第三者送信**: 開発者ツールの Network タブで、アナリティクス・広告・監視サービスへのリクエストのペイロードに機微データが含まれていないか確認します（V14.2.3）。
- **API レスポンスの過剰データ**: 画面に表示される項目と API レスポンスの項目を比較します（V14.2.6）。
- **ドキュメントレビュー（L2）**: データ分類表（V14.1.1）と保護要件（V14.1.2）が存在し、実装（暗号化、ログのマスキング、保持期間）と一致しているか確認します（V14.2.4）。
- **アップロードファイル**: `exiftool` で、アップロード後に保存・配信されたファイルのメタデータを確認します（V14.2.8）。

## 6. 確認問題

**Q1.** 次の API 呼び出しはどの要件に違反していますか。どう直すべきですか。
`GET https://api.example.com/orders?session_token=abc123`

<details><summary>答えと解説</summary>

V14.2.1（L1）違反です。セッショントークンなどの機微情報を URL・クエリ文字列に含めてはならず、HTTP のボディまたはヘッダで送る必要があります。例えば `Authorization: Bearer ...` ヘッダや Cookie で送ります。

</details>

**Q2.** 「JWT のペイロードは署名されているので、そこに入れた個人情報は保護されている」という主張は正しいですか。関連する要件 ID とともに答えてください。

<details><summary>答えと解説</summary>

正しくありません。署名は改ざん検知のためのもので、ペイロードは Base64URL でエンコードされているだけなので誰でもデコードして読めます。V14.1.1（L2）は、Base64 文字列や JWT の平文ペイロードのように「エンコードされているだけで容易にデコードできるデータ」も機微データとして特定・分類することを求めています。

</details>

**Q3.** V14.3.3 では、ブラウザストレージに機微データを保存しないことが求められていますが、例外として認められているものは何ですか。

<details><summary>答えと解説</summary>

セッショントークンです。V14.3.3（L2）は localStorage、sessionStorage、IndexedDB、Cookie などに機微データを含めないことを求めつつ、セッショントークンを例外としています。

</details>

**Q4.** Web キャッシュデセプション攻撃を防ぐために、存在しないファイルへのアクセスに対して Web サーバはどう応答すべきですか。

<details><summary>答えと解説</summary>

別の有効なファイル（例えば個人情報入りのページ）を返すのではなく、404 または 302 を返すべきです。また、キャッシュは期待されるコンテンツタイプで機微な動的コンテンツを含まないレスポンスだけを対象にします（V14.2.5, L3）。

</details>

**Q5.** ログアウト処理で `Clear-Site-Data` ヘッダを返していれば、V14.3.1 は十分に満たされると言えますか。

<details><summary>答えと解説</summary>

十分とは言えません。V14.3.1（L1）は `Clear-Site-Data` が役立つ場合があるとしつつ、セッション終了時にサーバに接続できない場合でもクライアント側で後始末できるべきだとしています。フロントエンド側でも DOM やストレージ上の認証済みデータを消去する処理が必要です。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [User Privacy Protection Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/User_Privacy_Protection_Cheat_Sheet.html)
- OWASP Cheat Sheet: [HTTP Security Response Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- OWASP Cheat Sheet: [HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)（Web Storage の注意点）
- OWASP Cheat Sheet: [Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- OWASP: [Secure Headers Project](https://owasp.org/www-project-secure-headers/) / [Top 10 Privacy Risks](https://owasp.org/www-project-top-10-privacy-risks/)
- MDN: [Clear-Site-Data](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data) / [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- 関連する章: V2（ビジネスロジック・制限）、V11（暗号化）、V15（必要なフィールドだけ返す V15.3.1）、V16（ログでの機微データの扱い V16.2.5）
