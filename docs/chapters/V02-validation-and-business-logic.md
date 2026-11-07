# V2 検証とビジネスロジック（Validation and Business Logic）

> 📘 原文: [0x11-V2-Validation-and-Business-Logic.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x11-V2-Validation-and-Business-Logic.md)
> 📊 要件数: **13**（L1: 4 / L2: 7 / L3: 2）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V2.md](../../checklists/by-chapter/V2.md)

## 1. この章の目的

この章は、検証対象のアプリケーションが次の高レベルな目標を満たすことを目指しています。

- アプリが受け取る入力が、業務上または機能上の期待に合っていること。
- ビジネスロジックのフローが順序どおりに処理され、飛ばしたり迂回したりできないこと。
- ビジネスロジックに上限や制御があり、「少額送金を延々と繰り返す」「友達を 1 人ずつ 100 万人追加する」といった自動化攻撃を検知・防止できること。
- 価値の高いビジネスロジックのフローについて、悪用ケースや悪意ある攻撃者を想定し、なりすまし・改ざん・情報漏えい・権限昇格への対策が検討されていること。

V1 が「データをインタプリタに渡すときに安全にする」章だとすると、V2 は「そもそもそのデータや操作の流れが業務的に正しいか」を確かめる章です。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V2.1 | 検証とビジネスロジックの文書化 | 検証ルール・組み合わせの整合性・業務上の上限を文書に定義する | 3 |
| V2.2 | 入力検証 | 許可リストによる検証を信頼できるサーバー側で行う | 3 |
| V2.3 | ビジネスロジックのセキュリティ | 手順の順序、上限、トランザクション、排他制御、複数人承認 | 5 |
| V2.4 | 自動化対策 | 過剰な呼び出しの防止と、人間らしい操作タイミングの要求 | 2 |

原文 V2.2 の導入文では、「入力」には HTML フォーム、REST リクエスト、URL パラメータ、HTTP ヘッダ、Cookie、ディスク上のファイル、データベース、外部 API など多様なソースが含まれると説明されています。また、入力検証はデータ品質を高め攻撃面を減らすものの、**別コンポーネントで使うときの正しいエンコーディング・パラメータ化・サニタイズの必要性をなくすものではない** と明記されています（それらは V1 の範囲）。

## 3. 押さえるべき重要要件

### V2.2.1 — 許可リストによる入力検証（L1）

- **要件（意訳）**: 入力は、業務上・機能上の期待に沿うよう検証すること。値・パターン・範囲の許可リストによる肯定的検証、または事前定義されたルールに基づく期待構造や論理的上限との比較で行う。L1 では特定の業務判断やセキュリティ判断に使われる入力に絞ってよいが、L2 以上ではすべての入力に適用する。
- **なぜ重要か**: 数量に `-1` を入れて返金を発生させる、ループ回数を決める値に巨大な数を入れて DoS を起こす、といった攻撃は「型としては正しい」入力で起こります。原文でも、ループ回数を決める数値が大きすぎると過剰な処理やサービス拒否につながる例が挙げられています。
- **実装のポイント**: 「危ない値を弾く」拒否リストではなく、「許される値だけ通す」許可リストで書きます。JSON API ならスキーマ検証（Pydantic、JSON Schema など）が網羅的な検証に有効です。原文は、スキーマ検証は明示的には必須ではないが、JSON / XML を使う HTTP API では最も効果的な仕組みかもしれないと述べています。

```python
# ❌ NG 例: 型変換だけで業務上の範囲を見ていない
qty = int(request.json["quantity"])

# ✅ OK 例: Pydantic で範囲・許可値を宣言
from typing import Literal
from pydantic import BaseModel, Field

class OrderIn(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=1, le=10)          # 業務上の上限
    shipping: Literal["standard", "express"]    # 許可リスト

order = OrderIn.model_validate(request.json)
```

### V2.2.2 — 検証は信頼できるサービス層で（L1）

- **要件（意訳）**: 入力検証を信頼できるサービス層で強制するよう設計されていること。クライアント側の検証はユーザビリティを高めるので推奨されるが、セキュリティ制御として頼ってはならない。
- **なぜ重要か**: ブラウザの `maxlength` や JavaScript の検証は、curl や Burp Suite で直接リクエストを送れば簡単に回避されます。
- **実装のポイント**: フロントの検証ルールと同じ（またはより厳しい）ルールをサーバー側にも実装します。

```html
<!-- ❌ NG 例: これだけでは何も守れない -->
<input type="number" name="quantity" min="1" max="10">
```

```python
# ✅ OK 例: サーバー側で同じ制約を必ず検証（上の OrderIn を使用）
@app.post("/orders")
def create_order():
    order = OrderIn.model_validate(request.json)  # 失敗時は 400 を返す
    ...
```

### V2.3.1 — 手順を飛ばさせない（L1）

- **要件（意訳）**: 同一ユーザーのビジネスロジックのフローは、想定された順序どおりに、手順を飛ばすことなく処理されること。
- **なぜ重要か**: 「カート → 配送先 → 支払い → 確定」の流れで、支払い API を飛ばして確定 API を直接呼ぶと無料で注文できてしまう、といった欠陥が典型です。
- **実装のポイント**: 各ステップの完了状態をサーバー側（セッションや DB）で管理し、次のステップで前提条件を確認します。クライアントから送られた「step=3」のような値を信用しないこと。

```python
# ❌ NG 例: 確定 API が支払い済みかを確認しない
@app.post("/checkout/confirm")
def confirm():
    order = Order.get(session["order_id"])
    order.status = "confirmed"

# ✅ OK 例: サーバー側の状態で前提条件を確認
@app.post("/checkout/confirm")
def confirm():
    order = Order.get(session["order_id"])
    if order.status != "paid":
        abort(409, "payment required")
    order.status = "confirmed"
```

### V2.3.3 — トランザクションで全部成功か全部取り消しか（L2）

- **要件（意訳）**: ビジネスロジックのレベルでトランザクションを使い、業務操作が全体として成功するか、以前の正しい状態にロールバックされるかのどちらかになること。
- **なぜ重要か**: 送金で「出金は成功したが入金でエラー」となると、お金が消えたり（逆なら増えたり）します。攻撃者は途中でエラーを起こさせる入力を探してこれを悪用します。
- **実装のポイント**: 関連する更新を 1 つの DB トランザクションにまとめます。

```python
# ❌ NG 例: 途中で例外が起きると片方だけ反映される
debit(src, amount); db.commit()
credit(dst, amount); db.commit()

# ✅ OK 例: 1 トランザクションで処理
with db.begin():          # 例外時は自動でロールバック
    debit(src, amount)
    credit(dst, amount)
```

### V2.3.4 — 数に限りがある資源の二重予約防止（L2）

- **要件（意訳）**: 劇場の座席や配達枠のような数量限定の資源が、アプリのロジック操作によって二重予約されないよう、ビジネスロジックレベルのロック機構を使うこと。
- **なぜ重要か**: 「空きを確認 → 予約を書き込み」の間に別リクエストが割り込む競合状態（レースコンディション）を突くと、同時リクエストで同じ座席を複数人が確保できたり、1 回限りのクーポンを複数回使えたりします。
- **実装のポイント**: `SELECT ... FOR UPDATE` による行ロック、一意制約、条件付き UPDATE（楽観ロック）などで「確認と更新」を不可分にします。

```python
# ❌ NG 例: 確認と更新の間に隙間がある
seat = db.execute("SELECT reserved FROM seats WHERE id=%s", (sid,)).fetchone()
if not seat.reserved:
    db.execute("UPDATE seats SET reserved=TRUE, user_id=%s WHERE id=%s", (uid, sid))

# ✅ OK 例: 条件付き UPDATE で不可分に（更新件数で成否を判定）
cur = db.execute(
    "UPDATE seats SET reserved=TRUE, user_id=%s WHERE id=%s AND reserved=FALSE",
    (uid, sid),
)
if cur.rowcount == 0:
    abort(409, "already reserved")
```

### V2.1.3 / V2.3.2 — 業務上の上限を文書化し、実装する（L2）

- **要件（意訳）**:
  - V2.1.3: ビジネスロジックの上限と検証に関する期待値を、ユーザーごととアプリ全体の両方について文書化すること。
  - V2.3.2: 文書に従ってビジネスロジックの上限を実装し、ビジネスロジックの欠陥が悪用されないようにすること。
- **なぜ重要か**: 「1 日の送金上限」「1 ユーザーあたりのクーポン利用回数」などが決まっていないと、実装もテストもできません。
- **実装のポイント**: まず仕様として上限を書き出し、その値を設定として一元管理し、サーバー側で強制します。

```python
# ✅ OK 例: 文書化された上限をサーバー側で強制
DAILY_TRANSFER_LIMIT = 500_000  # 設計書 §3.2 で定義された 1 ユーザー/日の上限

def transfer(user, amount):
    if amount <= 0:
        raise ValueError("invalid amount")
    if sum_transfers_today(user) + amount > DAILY_TRANSFER_LIMIT:
        raise PermissionError("daily limit exceeded")
    ...
```

### V2.4.1 — 自動化対策（L2）

- **要件（意訳）**: データの持ち出し、ゴミデータの作成、クォータの枯渇、レート制限の超過、サービス拒否、高コストなリソースの使い過ぎにつながる、アプリ機能への過剰な呼び出しから保護する自動化対策があること。
- **なぜ重要か**: 検索 API を大量に叩いて全データをスクレイピングする、SMS 送信機能を連打して費用を発生させる、などの被害が起こります。
- **実装のポイント**: ユーザー単位・IP 単位・機能単位でのレート制限、コストの高い機能（SMS、メール、エクスポート、生成 AI 呼び出しなど）への個別の上限を設けます。原文は OWASP Automated Threats to Web Applications を参考資料として挙げています。

```python
# ✅ OK 例: Flask-Limiter で機能ごとにレート制限
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(get_remote_address, app=app)

@app.post("/sms/send-code")
@limiter.limit("3 per minute; 10 per day")
def send_code():
    ...
```

## 4. よくある脆弱性・アンチパターン

- **クライアント側検証だけに頼る**（V2.2.2）。HTML の `required` / `pattern` / JS 検証はセキュリティ制御になりません。
- **拒否リスト型の検証**（特定の記号だけ弾くなど）で、想定外の値を通してしまう（V2.2.1）。
- **負数・ゼロ・極端に大きい値・小数**を想定しない数量や金額の検証（V2.2.1）。
- **関連する項目の組み合わせを見ない**。例: 開始日が終了日より後、郵便番号と住所が一致しない（V2.1.2, V2.2.3）。
- **ステップの状態をクライアントに持たせる**（hidden フィールドの `step=3`、`paid=true` など）ことによる手順スキップ（V2.3.1）。
- **「確認してから更新」型のコード**によるレースコンディション。クーポンの多重利用、在庫のマイナス化、残高の二重引き出し（V2.3.4）。
- **複数テーブル更新をトランザクションで囲まない**（V2.3.3）。
- **高額送金や重要な設定変更を 1 人の操作だけで実行できる**（V2.3.5, L3 では複数人承認が必要）。
- **SMS・メール送信やエクスポートなど高コスト機能にレート制限がない**（V2.4.1）。
- **フォーム送信からわずか数十ミリ秒で取引が完了するような、人間には不可能な速度の操作を許す**（V2.4.2, L3）。
- **XML 検証に DTD を使う**。原文 V2.2 は、XXE を避けるため DTD 検証は使わず、フレームワークの DTD 評価も無効化すべきとしています。

## 5. 検証（テスト）のヒント

- **仕様書の確認**: まず V2.1 の 3 要件どおり、入力ルール・組み合わせの整合性・上限が文書化されているかを確認します。文書がなければテストの基準がありません。
- **境界値テスト**: 数量・金額・日付などに `0`, `-1`, 上限+1, 巨大な値, 小数, 文字列, `null`, 配列を入れて、サーバーが 400 系で拒否するかを確認します。
- **クライアント検証の迂回**: Burp Suite や OWASP ZAP、curl でブラウザを通さずにリクエストを送り、サーバー側で同じ検証が行われているかを確認します。
- **手順スキップ**: マルチステップのフローで、途中のリクエストを飛ばして最後の API を直接呼ぶ、順序を入れ替える、前のステップを再送するなどを試します。
- **レースコンディション**: 同じリクエスト（予約、クーポン利用、送金）を並列で大量に送り、二重処理が起きないかを確認します。Burp Suite Repeater の並列送信機能や、Python の `asyncio` + `httpx` で簡単に再現できます。
- **トランザクション**: 複数ステップの更新の途中で失敗させる（不正な値を後半だけに入れる等）と、前半の変更が残っていないかを確認します。
- **レート制限**: 短時間に大量リクエストを送り、429 などで制限されるか、制限がユーザー・IP・機能単位で効いているかを確認します。
- **悪用ケースの洗い出し**: 「この機能を 100 万回呼んだら?」「途中で止めたら?」「他人の ID に変えたら?」（認可は V8）とチームで問い直すのが有効です。

## 6. 確認問題

**Q1.** 「フロントエンドの JavaScript で入力値を厳密に検証しているので、サーバー側の検証は省略してよい」という主張は正しいか。要件 ID を挙げて答えよ。

<details><summary>答えと解説</summary>

正しくありません。V2.2.2（L1）は、入力検証を信頼できるサービス層で強制するよう求め、クライアント側検証はユーザビリティ向上のために推奨されるもののセキュリティ制御として頼ってはならないとしています。攻撃者はブラウザを通さず直接リクエストを送れます。

</details>

**Q2.** V2.2.1 について、L1 と L2 以上で適用範囲はどう違うか。

<details><summary>答えと解説</summary>

L1 では、特定の業務判断やセキュリティ判断に使われる入力に検証を絞ってよいとされています。L2 以上では **すべての入力** に適用する必要があります。

</details>

**Q3.** 次のクーポン利用処理にはどんな問題があり、どの要件に該当するか。
```python
if not coupon.used:
    apply_discount(order, coupon)
    coupon.used = True
    db.commit()
```

<details><summary>答えと解説</summary>

「未使用か確認 → 使用済みに更新」の間に隙間があり、同じリクエストを並列に送ると複数のリクエストが `used == False` を同時に読み、クーポンが複数回使われるレースコンディションが起こります。数量限定の資源を操作で二重利用されないようロック機構を求める V2.3.4（L2）に該当します。また、割引の適用とクーポン消費を全部成功か全部取り消しにするという点では V2.3.3（L2）も関係します。条件付き UPDATE（`UPDATE coupons SET used=TRUE WHERE id=%s AND used=FALSE` の更新件数で判定）や行ロックで不可分にします。

</details>

**Q4.** 高額送金や契約承認のような価値の高いフローに対して、L3 で求められる対策は何か。

<details><summary>答えと解説</summary>

V2.3.5（L3）の複数人承認（multi-user approval）です。不正な操作や誤操作を防ぐため、高額送金、契約承認、機密情報へのアクセス、製造現場での安全装置の解除などで、複数のユーザーの承認を必要とします。

</details>

**Q5.** V2.4 の 2 つの要件を、それぞれのレベルとともに簡潔に説明せよ。

<details><summary>答えと解説</summary>

- **V2.4.1（L2）**: データの持ち出し、ゴミデータの作成、クォータ枯渇、レート制限超過、DoS、高コストなリソースの使い過ぎにつながる過剰な呼び出しから機能を守る自動化対策を置くこと。
- **V2.4.2（L3）**: ビジネスロジックのフローで人間として現実的な操作タイミングを要求し、極端に速い取引の送信を防ぐこと。

</details>

## 7. 関連リソース

- OWASP Cheat Sheet: [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html)
- OWASP Cheat Sheet: [Abuse Case Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Abuse_Case_Cheat_Sheet.html)
- [OWASP Automated Threats to Web Applications](https://owasp.org/www-project-automated-threats-to-web-applications/)（原文で自動化対策の参考として紹介）
- [OWASP Web Security Testing Guide: Business Logic Testing](https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/10-Business_Logic_Testing/README)
- [JSON Schema](https://json-schema.org/specification.html)
- 関連する章: [V1 エンコーディングとサニタイズ](V01-encoding-and-sanitization.md)（検証後も必要な出力側の対策）、[V4 API と Web サービス](V04-api-and-web-service.md)、[V8 認可](V08-authorization.md)
