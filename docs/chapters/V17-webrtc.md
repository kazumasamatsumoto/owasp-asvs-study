# V17 WebRTC（WebRTC）

> 📘 原文: [0x26-V17-WebRTC.md](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x26-V17-WebRTC.md)
> 📊 要件数: **12**（L1: 0 / L2: 7 / L3: 5）
> ✅ 全要件のチェックリスト: [checklists/by-chapter/V17.md](../../checklists/by-chapter/V17.md)

## 1. この章の目的

WebRTC（Web Real-Time Communication）は、音声・映像・データのリアルタイムなやり取りを可能にする技術です。普及が進むにつれ、WebRTC 基盤のセキュリティ確保が重要になっています。V17 は、WebRTC システムを開発・ホスティング・統合する関係者向けのセキュリティ要件をまとめた章です。

原文は WebRTC 市場を次の 3 つに分類しています。

1. **プロダクト開発者**: WebRTC の製品やソリューションを作って提供する、プロプライエタリ／オープンソースのベンダー。
2. **CPaaS（Communication Platforms as a Service）**: WebRTC 機能を実現する API・SDK・基盤を提供する事業者。
3. **サービスプロバイダ**: 上記の製品や CPaaS を使う、または自前で WebRTC ソリューションを開発して、オンライン会議・医療・e ラーニングなどのアプリケーションを提供する組織。

この章の要件は、オープンソースや商用の WebRTC 製品を使って自社基盤を構築している、あるいは独自開発・統合している組織を主な対象としています。**CPaaS ベンダーの SDK や API だけを使っている開発者には適用されません**（その場合、基盤側のセキュリティは主に CPaaS 事業者の責任になるためです）。

さらに各セクションにも適用範囲があります。V17.1 は自前の TURN サーバを運用する場合、V17.2 は自前のメディアサーバ（SFU、MCU、録画サーバ、ゲートウェイサーバなど）をホストする場合、V17.3 は自前のシグナリングサーバを運用する場合に適用されます。ブラウザ間のピアツーピア通信だけで中間のメディアサーバを介さないシステムは、V17.2 の対象外です。

## 2. セクション構成

| セクション | 日本語名 | 何を扱うか（1行） | 要件数 |
| --- | --- | --- | :---: |
| V17.1 | TURN サーバ | 特殊用途 IP（内部・ループバック等）へのリレー禁止、ポート大量確保によるリソース枯渇対策 | 2 |
| V17.2 | メディア | DTLS 鍵管理と暗号スイート、SRTP 認証、不正パケット・フラッド耐性、ClientHello 競合、SDP フィンガープリント検証 | 8 |
| V17.3 | シグナリング | フラッド攻撃時の継続処理（レート制限）、不正なシグナリングメッセージへの耐性 | 2 |

用語メモ:

- **TURN**（Traversal Using Relays around NAT）: NAT やファイアウォールで直接通信できないとき、メディアを中継（リレー）するサーバ。
- **SFU / MCU**: 多人数通話でメディアを転送／合成するサーバ。
- **DTLS**（Datagram TLS）: UDP 上で動く TLS。WebRTC ではこれで SRTP の鍵を確立します（DTLS-SRTP）。
- **SRTP**（Secure Real-time Transport Protocol）: 暗号化・認証された RTP。音声・映像パケットを運びます。
- **SDP**（Session Description Protocol）: シグナリングで交換されるセッション記述。DTLS 証明書のフィンガープリント（`a=fingerprint`）を含みます。

## 3. 押さえるべき重要要件

### V17.1.1 — TURN が特殊用途の IP アドレスへアクセスできないようにする（L2）

- **要件（意訳）**: TURN サービスは、特殊用途のために予約されていない IP アドレスへのアクセスのみを許可すること（例えば内部ネットワーク、ブロードキャスト、ループバックへのアクセスは許可しない）。これは IPv4 と IPv6 の両方に適用される。
- **なぜ重要か**: TURN はクライアントの依頼で任意の宛先に UDP/TCP を中継するため、設定が甘いと攻撃者が TURN サーバを踏み台にして、内部ネットワークの管理画面やクラウドのメタデータサービス（`169.254.169.254`）、`127.0.0.1` 上のサービスにアクセスできてしまいます（SSRF に似たリスク）。
- **実装のポイント**: TURN サーバの設定で、プライベート・ループバック・リンクローカル・マルチキャスト・ブロードキャストなどの範囲をリレー先として拒否します。IPv6（`::1`、`fc00::/7`、`fe80::/10` など）も忘れずに設定します。

```ini
# coturn (turnserver.conf) の例: 特殊用途アドレスへのリレーを拒否
# （オプション名や既定値はバージョンにより異なるため、利用中のバージョンのドキュメントを確認）
no-multicast-peers
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=::1
denied-peer-ip=fc00::-fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
denied-peer-ip=fe80::-febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff
```

アプリ側で宛先を判定するコードを書く場合の考え方（Python）:

```python
import ipaddress

# ❌ NG 例: プライベートアドレスだけを弾き、ループバックやリンクローカル、IPv6 を見落とす
def allowed(peer: str) -> bool:
    return not peer.startswith(("10.", "192.168."))

# ✅ OK 例: 標準ライブラリで特殊用途アドレスを総合的に判定（IPv4/IPv6 両対応）
def allowed(peer: str) -> bool:
    ip = ipaddress.ip_address(peer)
    return ip.is_global and not ip.is_multicast
```

### V17.1.2 — TURN のポート大量確保によるリソース枯渇を防ぐ（L3）

- **要件（意訳）**: 正規のユーザーが TURN サーバ上で大量のポートを開こうとした場合でも、TURN サービスがリソース枯渇に陥らないこと。
- **なぜ重要か**: 認証済みの正規ユーザー（または盗まれた認証情報）でも、割り当て（allocation）を大量に作るとポートやメモリを使い果たし、他のユーザーが通話できなくなります。
- **実装のポイント**: ユーザーごと・全体の割り当て数や帯域の上限を設定します（coturn なら `user-quota`、`total-quota`、`max-bps` など）。

### V17.2.1 / V17.2.2 — DTLS の鍵管理と承認済み暗号スイート（L2）

- **要件（意訳）**: DTLS 証明書の鍵を、文書化された暗号鍵管理ポリシーに基づいて管理・保護すること（V17.2.1）。メディアサーバは、承認された DTLS 暗号スイートと、DTLS-SRTP の鍵確立のための安全な保護プロファイルを使用・サポートするよう設定すること（V17.2.2）。
- **なぜ重要か**: DTLS はメディアの暗号鍵を確立する土台であり、その鍵が漏れたり弱い暗号スイートが使われたりすると、通話内容の盗聴や改ざんにつながります。
- **実装のポイント**: 鍵管理ポリシーは V11（暗号化）の要件と同じものに従います。承認済みの暗号方式は ASVS 付録 C、NIST SP 800-52 Rev. 2、BSI TR-02102-2 などを参照し、SRTP 保護プロファイルは IANA の DTLS-SRTP Protection Profiles から安全なもの（AEAD 系など）を選びます。

### V17.2.3 — メディアサーバで SRTP 認証を検証する（L2）

- **要件（意訳）**: メディアサーバで SRTP の認証を検証し、RTP インジェクション攻撃によってサービス拒否状態が起きたり、音声や映像がメディアストリームに挿入されたりすることを防ぐこと。
- **なぜ重要か**: 認証タグを検証せずにパケットを受け入れると、攻撃者が偽の RTP パケットを送り込み、会議に勝手な音声・映像を差し込んだり、デコーダを混乱させてサーバを落としたりできます。
- **実装のポイント**: 認証タグの検証に失敗したパケットは処理前に破棄します。SRTP ライブラリの「認証なし」設定を使わないこと。

```python
# 概念的な擬似コード（実際は libsrtp などのライブラリが行う）
# ❌ NG 例: 認証タグを確認せずに復号・転送する
def on_packet(pkt):
    payload = srtp.decrypt_without_auth(pkt)
    forward(payload)

# ✅ OK 例: 認証に失敗したパケットは破棄し、処理を継続する
def on_packet(pkt):
    try:
        payload = srtp.unprotect(pkt)   # 認証タグ検証 + 復号
    except SrtpAuthError:
        metrics.inc("srtp_auth_fail")
        return                           # 破棄（サーバは落とさない）
    forward(payload)
```

### V17.2.4 / V17.2.5 — 不正な SRTP パケットやフラッドでも処理を継続する（L2 / L3）

- **要件（意訳）**: メディアサーバは、不正な形式の SRTP パケットを受け取っても、受信メディアトラフィックの処理を継続できること（V17.2.4, L2）。正規ユーザーからの SRTP パケットのフラッド中にも、受信メディアトラフィックの処理を継続できること（V17.2.5, L3）。V17.2.7（L3）では、メディアサーバに付随する録画の仕組みについても、同様にフラッド中の処理継続を求めています。
- **なぜ重要か**: 1 つの壊れたパケットでプロセスがクラッシュすれば、そのサーバ上の全通話が切断されます。原文の解説も、パケットが速すぎる場合は余分なパケットを破棄すること、入力検証・整数オーバーフローの安全な処理・バッファオーバーフロー防止などで不正パケットから守ることを挙げています。
- **実装のポイント**: セッションごとのレート制限、タイムスタンプの検証、同期されたクロックの利用、バッファ管理を行います。パース処理では長さフィールドを信用せず境界チェックします。ファジングで堅牢性を確認します。

```python
import struct

# ❌ NG 例: ヘッダの長さを検証せずにパースし、例外でワーカーごと落ちる
def parse_rtp(buf: bytes):
    cc = buf[0] & 0x0F
    header_len = 12 + cc * 4
    return buf[header_len:]

# ✅ OK 例: 長さを検証し、不正パケットは破棄して処理を継続
def parse_rtp(buf: bytes):
    if len(buf) < 12 or (buf[0] >> 6) != 2:      # 最小長と RTP バージョン 2 を確認
        return None
    cc = buf[0] & 0x0F
    header_len = 12 + cc * 4
    if len(buf) < header_len:
        return None
    return buf[header_len:]
```

### V17.2.8 — DTLS 証明書を SDP のフィンガープリントと照合する（L3）

- **要件（意訳）**: DTLS 証明書を SDP の fingerprint 属性と照合し、照合に失敗した場合はメディアストリームを終了することで、メディアストリームの真正性を確保すること。
- **なぜ重要か**: WebRTC の DTLS 証明書は通常自己署名であり、正当性はシグナリングで交換した SDP の `a=fingerprint` によってのみ担保されます。照合しなければ、経路上の攻撃者が自分の証明書で DTLS を張り、メディアを盗聴・改ざんできます。

```python
import hashlib, hmac

# ✅ OK 例（概念）: DTLS ハンドシェイク後、相手の証明書の指紋を SDP の値と比較
def verify_fingerprint(peer_cert_der: bytes, sdp_fingerprint: str) -> None:
    algo, expected = sdp_fingerprint.split(" ", 1)          # 例: "sha-256 AB:CD:..."
    if algo.lower() != "sha-256":
        raise ValueError("unsupported fingerprint algorithm")
    actual = hashlib.sha256(peer_cert_der).hexdigest().upper()
    actual = ":".join(actual[i:i+2] for i in range(0, len(actual), 2))
    if not hmac.compare_digest(actual, expected.strip().upper()):
        raise ConnectionAbortedError("DTLS fingerprint mismatch - terminate media stream")
```

### V17.3.1 / V17.3.2 — シグナリングサーバの可用性を守る（L2）

- **要件（意訳）**: シグナリングサーバは、フラッド攻撃を受けている間も正規の受信シグナリングメッセージを処理し続けられること。これはシグナリングレベルでのレート制限によって実現すべきである（V17.3.1）。また、サービス拒否状態を引き起こしうる不正な形式のシグナリングメッセージを受け取っても、正規のシグナリングメッセージを処理し続けられること。入力検証、整数オーバーフローの安全な処理、バッファオーバーフローの防止、その他の堅牢なエラー処理技術の実装などが含まれる（V17.3.2）。
- **なぜ重要か**: シグナリングが止まると、新しい通話の確立も既存セッションの制御もできなくなります。WebSocket などで常時接続しているため、1 クライアントからの大量メッセージや巨大メッセージで簡単に負荷をかけられます。

```python
import json, time
from collections import defaultdict

MAX_MSG_BYTES = 16 * 1024
RATE = 20  # 1 接続あたり 1 秒間のメッセージ上限
buckets = defaultdict(lambda: [0.0, 0])

# ❌ NG 例: サイズ・頻度・形式のチェックなし。不正な JSON で例外が出て接続処理ごと落ちる
async def on_message(conn, raw):
    msg = json.loads(raw)
    await route(msg["type"], msg)

# ✅ OK 例: サイズ・レート・形式を検証し、不正なものだけを破棄して処理を継続
async def on_message(conn, raw):
    if len(raw) > MAX_MSG_BYTES:
        return
    window, count = buckets[conn.id]
    now = time.monotonic()
    if now - window >= 1:
        buckets[conn.id] = [now, 1]
    elif count >= RATE:
        return                                  # レート超過分は破棄
    else:
        buckets[conn.id][1] += 1
    try:
        msg = json.loads(raw)
        if not isinstance(msg, dict) or msg.get("type") not in {"offer", "answer", "candidate", "bye"}:
            return
    except (ValueError, TypeError):
        return
    await route(msg["type"], msg)
```

## 4. よくある脆弱性・アンチパターン

- **TURN をオープンリレーとして放置**: 内部アドレスやループバックへのリレーを許可したまま公開し、内部ネットワークへの踏み台にされる（V17.1.1）。IPv4 だけ制限して IPv6 を忘れるケースも。
- **TURN の割り当て数無制限**: 1 ユーザーがポートを大量に確保してサーバを枯渇させる（V17.1.2）。
- **DTLS 秘密鍵の雑な管理**: 鍵をイメージに焼き込む、全サーバで使い回す、ローテーションしない（V17.2.1）。
- **古い・弱い DTLS 暗号スイートや SRTP プロファイルの許可**（V17.2.2）。
- **SRTP 認証の未検証**: 偽パケットのインジェクションを許す（V17.2.3）。
- **パーサの脆弱性**: 長さフィールドを信用したパース、整数オーバーフロー、バッファオーバーフローで、1 パケットでメディアサーバがクラッシュする（V17.2.4, V17.3.2）。
- **フラッド対策なし**: パケットやシグナリングメッセージのレート制限がない（V17.2.5, V17.2.7, V17.3.1）。
- **DTLS「ClientHello」競合状態の脆弱性を抱えた製品の利用**: 既知の脆弱性があるメディアサーバのバージョンを使い続ける（V17.2.6）。
- **SDP フィンガープリント照合の省略**: DTLS 証明書が誰のものか確認しない（V17.2.8）。

## 5. 検証（テスト）のヒント

- **適用範囲の確認**: まず、自前で TURN・メディアサーバ・シグナリングサーバを運用しているかを確認します。CPaaS の SDK/API のみを利用している場合、この章の要件は適用されません。P2P のみでメディアサーバを介さない場合、V17.2 は対象外です。
- **TURN のリレー先テスト**: TURN クライアント（テストツールや自作スクリプト）で、`127.0.0.1`、`10.0.0.1`、`169.254.169.254`、`::1` などへの CreatePermission / 中継を試み、拒否されることを確認します（V17.1.1）。
- **TURN の割り当て上限**: 1 つの認証情報で大量の allocation を作成し、上限で拒否され、他ユーザーが影響を受けないかを確認します（V17.1.2）。
- **DTLS 設定**: メディアサーバがネゴシエートする DTLS バージョン・暗号スイート・SRTP 保護プロファイルを、パケットキャプチャ（Wireshark など）や設定ファイルで確認します（V17.2.2）。
- **ファジング**: 不正な形式の SRTP/RTP パケットや、壊れた SDP・巨大な JSON などのシグナリングメッセージを送り、サーバがクラッシュせず正規トラフィックの処理を続けるか確認します（V17.2.4, V17.3.2）。
- **負荷・フラッドテスト**: 正規ユーザーを装った大量の SRTP パケットやシグナリングメッセージを送りつつ、別の正規セッションの品質が保たれるか、録画が継続するかを確認します（V17.2.5, V17.2.7, V17.3.1）。
- **ClientHello 競合状態**: 使用しているメディアサーバが公に脆弱と知られていないかを確認するか、競合状態のテストを実施します（V17.2.6）。原文の参考資料（Enable Security の解説とホワイトペーパー）が詳しいです。
- **フィンガープリント不一致**: SDP の `a=fingerprint` を改ざんした状態で接続し、メディアストリームが終了されることを確認します（V17.2.8）。

## 6. 確認問題

**Q1.** 自社のビデオ会議アプリが、CPaaS ベンダーの SDK と API だけを使って実装されています。V17 の要件は適用されますか。

<details><summary>答えと解説</summary>

原文では、CPaaS ベンダーが提供する SDK と API だけを使う開発者には、これらの要件は適用されないとされています。その場合、基盤側のセキュリティの大部分は CPaaS 事業者の責任となり、ASVS のような汎用標準では十分にカバーできないことがあるためです。

</details>

**Q2.** TURN サーバでリレー先を制限する際、V17.1.1 が明示的に注意を促している点は何ですか。

<details><summary>答えと解説</summary>

特殊用途に予約されたアドレス（内部ネットワーク、ブロードキャスト、ループバックなど）へのアクセスを許可しないことに加え、これが IPv4 と IPv6 の両方に適用されることです（V17.1.1, L2）。IPv4 だけを制限して IPv6 を見落とすと、`::1` やユニークローカルアドレス経由で内部に到達されるおそれがあります。

</details>

**Q3.** 次のうち、V17.2（メディア）の要件の対象外となるシステムはどれですか。
(a) SFU を自前で運用している (b) 録画サーバを自前で運用している (c) ブラウザ同士のピアツーピアのみで、中間メディアサーバを使わない

<details><summary>答えと解説</summary>

(c)。V17.2 は SFU、MCU、録画サーバ、ゲートウェイサーバなどのメディアサーバを自前でホストするシステムに適用され、中間メディアサーバを介さずブラウザ間のピアツーピア通信のみに依存するシステムは対象外です。

</details>

**Q4.** SRTP の認証をメディアサーバで検証しないと、どのような攻撃が可能になりますか。要件 ID とレベルも答えてください。

<details><summary>答えと解説</summary>

RTP インジェクション攻撃により、サービス拒否状態を引き起こしたり、音声や映像をメディアストリームに挿入したりできます。V17.2.3（L2）は、メディアサーバで SRTP 認証を検証することでこれを防ぐよう求めています。

</details>

**Q5.** WebRTC のメディアストリームの真正性を確保するため、V17.2.8 は DTLS 証明書を何と照合するよう求めていますか。照合に失敗したらどうすべきですか。

<details><summary>答えと解説</summary>

SDP の fingerprint 属性（`a=fingerprint`）と照合します。照合に失敗した場合はメディアストリームを終了しなければなりません（V17.2.8, L3）。WebRTC の DTLS 証明書は通常自己署名のため、シグナリングで交換したフィンガープリントとの照合が、相手が正当であることの根拠になります。

</details>

## 7. 関連リソース

- IETF: [RFC 8826 - Security Considerations for WebRTC](https://www.rfc-editor.org/info/rfc8826)
- IETF: [RFC 8827 - WebRTC Security Architecture](https://www.rfc-editor.org/info/rfc8827)
- IETF: [RFC 3711 - The Secure Real-time Transport Protocol (SRTP)](https://datatracker.ietf.org/doc/html/rfc3711)
- IETF: [RFC 5764 - DTLS Extension to Establish Keys for SRTP](https://datatracker.ietf.org/doc/html/rfc5764)
- IANA: [DTLS-SRTP Protection Profiles](https://www.iana.org/assignments/srtp-protection/srtp-protection.xhtml)
- Enable Security: [Novel DoS vulnerability affecting WebRTC media servers（DTLS ClientHello 競合）](https://www.enablesecurity.com/blog/novel-dos-vulnerability-affecting-webrtc-media-servers/)
- OWASP Cheat Sheet: [Server Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)（TURN の踏み台化と考え方が近い）
- OWASP Cheat Sheet: [Denial of Service Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- 関連する章: V11（暗号化・鍵管理 V11.1.1）、V12（安全な通信）、V2（アンチオートメーション・レート制限）、V13（通信先の許可リスト）
