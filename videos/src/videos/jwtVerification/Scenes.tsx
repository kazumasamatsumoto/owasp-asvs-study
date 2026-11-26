import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { enter, pop, shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import * as K from './code';
import REC from '../../../recorded/lab08.json';

const GREEN = '#4ade80';
const EX = REC.exercise as Record<string, Res>;
const SO = REC.solution as Record<string, Res>;
type Res = { accepted: boolean; sub?: string; reason?: string };
const [H64, P64, S64] = REC.tokens.valid.split('.');
const P64_FORGED = REC.tokens.tampered.split('.')[1];

/* ---------- 共通の部品 ---------- */

const Center: React.FC<{ children: React.ReactNode; row?: boolean; gap?: number }> = ({ children, row, gap = 0 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: row ? 'row' : 'column', gap, padding: '60px 80px 220px', ...enter(f) }}>
      {children}
    </AbsoluteFill>
  );
};
const Pop: React.FC<{ d?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ d = 0, children, style }) => {
  const f = useCurrentFrame();
  const s = pop(f, d);
  return <div style={{ transform: `scale(${s})`, opacity: Math.min(1, s * 1.5), ...style }}>{children}</div>;
};
const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 96, color = C.text }) => (
  <div style={{ fontFamily: sans, fontWeight: 900, fontSize: size, color, textAlign: 'center', lineHeight: 1.2 }}>{children}</div>
);
const Card: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.line, style }) => (
  <div style={{ background: C.panel, border: `3px solid ${color}`, borderRadius: 24, padding: '28px 40px', boxShadow: '0 24px 60px #0008', ...style }}>{children}</div>
);
const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.dim }) => (
  <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 30, color, marginBottom: 10 }}>{children}</div>
);
const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 38, color = C.text }) => (
  <span style={{ fontFamily: mono, fontWeight: 800, fontVariantLigatures: 'none', fontSize: size, color, whiteSpace: 'pre', wordBreak: 'break-all' }}>{children}</span>
);
const Arrow: React.FC<{ d?: number; down?: boolean }> = ({ d = 0, down }) => (
  <Pop d={d}>
    <div style={{ fontSize: 70, color: C.fire, fontWeight: 900 }}>{down ? '↓' : '→'}</div>
  </Pop>
);
const Actor: React.FC<{ icon: string; name: string; d?: number }> = ({ icon, name, d = 0 }) => (
  <Pop d={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ fontSize: 150 }}>{icon}</div>
    <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 44, color: C.text }}>{name}</div>
  </Pop>
);
/* ---------- 入館証の例え ---------- */

/** 入館証。stamp: ok=本物のハンコ / none=ハンコなし（不要と書いてある） / x=ハンコが合わない */
const Badge: React.FC<{ name: string; stamp?: 'ok' | 'none' | 'x'; evil?: boolean; label?: string; noStampText?: boolean }> = ({ name, stamp = 'ok', evil, label, noStampText }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
    <div
      style={{
        position: 'relative',
        width: 340,
        height: 220,
        borderRadius: 18,
        background: '#f4efe2',
        border: `6px solid ${evil ? C.red : stamp === 'ok' ? GREEN : C.dim}`,
        boxShadow: '0 16px 40px #000a',
        padding: '18px 24px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 24, color: '#555' }}>入館証</div>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 54, color: evil ? C.red : '#222', marginTop: 8 }}>{name}</div>
      {stamp !== 'none' && (
        <div style={{ position: 'absolute', right: 20, bottom: 18, width: 82, height: 82, borderRadius: 41, border: '5px solid #d22', color: '#d22', fontFamily: sans, fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-12deg)' }}>受付</div>
      )}
      {stamp === 'none' && noStampText && (
        <div style={{ position: 'absolute', right: 16, bottom: 22, fontFamily: sans, fontWeight: 900, fontSize: 26, color: C.red }}>ハンコ不要</div>
      )}
      {stamp === 'x' && <div style={{ position: 'absolute', right: 18, bottom: 0, fontSize: 110, color: C.red, fontWeight: 900 }}>✕</div>}
    </div>
    {label && <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 32, color: C.text }}>{label}</div>}
  </div>
);

/** トークンの 3 つの部分を色分けして出す */
const PART_C = [C.kw, C.fn, C.gold];
const Jwt: React.FC<{ parts: string[]; size?: number; width?: number; colors?: string[] }> = ({ parts, size = 30, width = 1600, colors = PART_C }) => (
  <div style={{ width, fontFamily: mono, fontWeight: 700, fontVariantLigatures: 'none', fontSize: size, wordBreak: 'break-all', lineHeight: 1.35 }}>
    {parts.map((p, i) => (
      <span key={i}>
        <span style={{ color: colors[i] }}>{p}</span>
        {i < 2 && <span style={{ color: C.text }}>.</span>}
      </span>
    ))}
  </div>
);

/** verify_token の結果 1 行（記録） */
const ResRow: React.FC<{ what: string; r: Res; d?: number; size?: number; width?: number; good?: boolean }> = ({ what, r, d = 0, size = 40, width = 1500, good }) => {
  const ok = good ?? !r.accepted;
  return (
    <Pop d={d}>
      <Card color={ok ? GREEN : C.red} style={{ width, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px' }}>
        <Title size={size}>{what}</Title>
        <Mono size={size} color={ok ? GREEN : C.red}>{r.accepted ? `受け入れ → sub=${r.sub}` : `拒否（${r.reason}）`}</Mono>
      </Card>
    </Pop>
  );
};

/* ---------- 場面 ---------- */

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={50}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 50 }}>
        <Pop><Card style={{ textAlign: 'center' }}><Label>中身</Label><Mono size={70}>&quot;sub&quot;: &quot;alice&quot;</Mono></Card></Pop>
        <Arrow d={at(0.15)} />
        <Pop d={at(0.2)}><Card color={C.red} style={{ textAlign: 'center' }}><Label>書き換え</Label><Mono size={70} color={C.red}>&quot;sub&quot;: &quot;admin&quot;</Mono></Card></Pop>
      </div>
      <Pop d={at(0.5)} style={{ transform: `translateX(${shake(f, at(0.55), 14, 14)}px)` }}>
        <Sticker color={C.red}>{`サーバーの答え → ${EX.tampered.sub} として受け入れ`}</Sticker>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={110}>JWT の署名を検証しない</Title>
      <Pop d={at(0.2)}><Title size={56} color={C.dim}>Improper Verification of Cryptographic Signature</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-347</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="🙂" name="客" />
      <Arrow d={at(0.15)} />
      <Actor icon="🛎" name="受付" d={at(0.25)} />
      <Arrow d={at(0.45)} />
      <Pop d={at(0.5)}><Badge name="山田" label="名前＋ハンコ" /></Pop>
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={70}>
      <Pop><Badge name="山田" /></Pop>
      <Actor icon="💂" name="警備員" d={at(0.15)} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Pop d={at(0.35)}><Sticker color={GREEN} rotate={0}>👀 名前の欄は見る</Sticker></Pop>
        <Pop d={at(0.55)}><Sticker color={C.red} rotate={0}>ハンコは 確かめない</Sticker></Pop>
      </div>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
        <Pop><Badge name="山田" label="元の入館証" /></Pop>
        <Arrow d={at(0.15)} />
        <Pop d={at(0.2)}><Badge name="社長" evil label="名前だけ書き換え" /></Pop>
      </div>
      <Pop d={at(0.55)} style={{ transform: `translateX(${shake(f, at(0.58), 12, 12)}px)` }}><Sticker color={C.red}>🚪 社長室に 入れてしまう</Sticker></Pop>
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  return (
    <Center row gap={70}>
      <Pop><Badge name="社長" stamp="none" noStampText evil label="ハンコは要りません" /></Pop>
      <Actor icon="💂" name="警備員" d={at(0.2)} />
      <Pop d={at(0.45)}><Sticker color={C.red}>そのまま 通る</Sticker></Pop>
    </Center>
  );
};

const MapRows: React.FC<{ rows: [string, string, string][] }> = ({ rows }) => {
  const at = useAt();
  return (
    <Center gap={26}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.05 + i * 0.2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, width: 1500 }}>
            <Card style={{ width: 520, padding: '18px 30px' }}><Title size={46}>{a}</Title></Card>
            <div style={{ fontSize: 56, color: C.fire }}>＝</div>
            <Card color={C.fire} style={{ flex: 1, padding: '14px 30px' }}>
              <Title size={46}>{b}</Title>
              <div style={{ textAlign: 'center' }}><Mono size={28} color={C.dim}>{c}</Mono></div>
            </Card>
          </div>
        </Pop>
      ))}
    </Center>
  );
};

const Map = () => (
  <MapRows
    rows={[
      ['🪪 入館証', 'JWT', 'ヘッダ.中身.署名'],
      ['✍️ 名前', '中身（payload）', '"sub": "alice"'],
      ['🔴 ハンコ', '署名', 'HMAC-SHA256'],
      ['💂 警備員', 'サーバー', 'verify_token()'],
    ]}
  />
);

const Core = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop>
        <Card color={GREEN} style={{ width: 520, textAlign: 'center' }}>
          <Label>先に</Label>
          <Title size={70} color={GREEN}>署名を確かめる</Title>
        </Card>
      </Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}>
        <Card style={{ width: 520, textAlign: 'center' }}>
          <Label>その後で</Label>
          <Title size={70}>中身を使う</Title>
        </Card>
      </Pop>
      <Pop d={at(0.55)}><Sticker color={C.red} rotate={4}>順番が逆</Sticker></Pop>
    </Center>
  );
};

const Parts = () => {
  const at = useAt();
  const names = ['ヘッダ', '中身', '署名'];
  return (
    <Center gap={30}>
      <Pop><Label>正しいトークン（記録）</Label></Pop>
      <Pop d={at(0.05)}><Card style={{ padding: '20px 30px' }}><Jwt parts={[H64, P64, S64]} size={30} width={1560} /></Card></Pop>
      <div style={{ display: 'flex', gap: 40 }}>
        {names.map((n, i) => (
          <Pop key={n} d={at(0.2 + i * 0.12)}><Sticker color={PART_C[i]} rotate={0} size={40}>{n}</Sticker></Pop>
        ))}
      </div>
      <Pop d={at(0.6)}>
        <Card color={C.fn} style={{ width: 1400, padding: '18px 40px' }}>
          <Label>中身を Base64 から戻すと（だれでも読める）</Label>
          <Mono size={36} color={C.fn}>{Object.entries(REC.payload_valid).map(([k, v]) => `"${k}": ${JSON.stringify(v)}`).map((t, i, a) => t + (i === a.length - 1 ? '' : i === 1 ? ',\n' : ', ')).join('')}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[19, 20]} at={at(0.3)} fontSize={38} />
    </Center>
  );
};

const Step1 = () => {
  const at = useAt();
  return (
    <Center gap={28}>
      <Pop><Title size={50} color={C.dim}>① 中身だけ書き換える（署名は元のまま）</Title></Pop>
      <Pop d={at(0.1)}>
        <Card color={C.red} style={{ padding: '20px 30px' }}>
          <Jwt parts={[H64, P64_FORGED, S64]} size={28} width={1560} colors={[C.dim, C.red, C.dim]} />
        </Card>
      </Pop>
      <Pop d={at(0.3)}><Mono size={40} color={C.red}>&quot;sub&quot;: &quot;alice&quot; → &quot;sub&quot;: &quot;admin&quot;</Mono></Pop>
      <ResRow what="直す前の verify_token（記録）" r={EX.tampered} d={at(0.55)} size={42} />
    </Center>
  );
};

const Step2 = () => {
  const at = useAt();
  const [h, p] = REC.tokens.alg_none.split('.');
  return (
    <Center gap={28}>
      <Pop><Title size={50} color={C.dim}>② alg を none に、署名は空っぽ</Title></Pop>
      <Pop d={at(0.1)}>
        <Card color={C.red} style={{ width: 1500 }}>
          <Label>ヘッダ</Label>
          <Mono size={44} color={C.red}>{'{"alg": "none", "typ": "JWT"}'}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.25)}>
        <Card style={{ padding: '20px 30px' }}>
          <Jwt parts={[h, p, '']} size={28} width={1560} colors={[C.red, C.dim, C.dim]} />
        </Card>
      </Pop>
      <ResRow what="直す前の verify_token（記録）" r={EX.alg_none} d={at(0.55)} size={42} />
    </Center>
  );
};

const Step3 = () => {
  const at = useAt();
  const rows: [string, string][] = [
    ['中身を書き換え', 'tampered'],
    ['alg を none', 'alg_none'],
    ['1 時間前に期限切れ', 'expired'],
    ['別のサービス向け（aud）', 'wrong_aud'],
  ];
  return (
    <Center gap={20}>
      <Pop><Label>直す前の verify_token（記録）</Label></Pop>
      {rows.map(([w, k], i) => (
        <ResRow key={k} what={w} r={EX[k]} d={at(0.05 + i * 0.15)} size={40} width={1500} />
      ))}
    </Center>
  );
};

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2020-2021</Mono></Pop>
      <Pop d={at(0.12)}><Title size={100}>PAN-OS</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>Palo Alto Networks のファイアウォールなどの OS</Title></Pop>
      <Pop d={at(0.5)}><Sticker color={C.red}>SAML の署名の確かめ方に 欠陥</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1400 }}>
          <Label>条件（NVD の説明）</Label>
          <Title size={44}>SAML 認証を使い、「Validate Identity Provider Certificate」が無効</Title>
        </Card>
      </Pop>
      <Arrow d={at(0.3)} down />
      <Pop d={at(0.4)} style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
        <Actor icon="😈" name="ログインしていない攻撃者" />
        <Arrow />
        <Sticker color={C.red}>管理者として ログイン</Sticker>
      </Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  const chips: [string, string][] = [
    ['AV:N', 'ネットワーク越し'],
    ['PR:N', 'ログイン不要'],
    ['UI:N', '誰の操作も不要'],
  ];
  return (
    <Center gap={50}>
      <Pop>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}>
          <Mono size={56} color={C.dim}>NVD CVSS 3.1</Mono>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 200, color: C.red }}>10.0</span>
          <Sticker color={C.red}>Critical</Sticker>
        </div>
      </Pop>
      <div style={{ display: 'flex', gap: 30 }}>
        {chips.map(([k, v], i) => (
          <Pop key={k} d={at(0.3 + i * 0.15)}>
            <Card color={C.fire} style={{ textAlign: 'center', width: 460 }}>
              <Mono size={50} color={C.gold}>{k}</Mono>
              <Title size={38}>{v}</Title>
            </Card>
          </Pop>
        ))}
      </div>
    </Center>
  );
};

const Kev = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={60} color={C.dim}>CISA の 悪用が確認された脆弱性の一覧</Title></Pop>
      <Pop d={at(0.2)}><Mono size={90} color={C.gold}>2022-03-25 追加</Mono></Pop>
      <Pop d={at(0.5)}><Sticker color={C.red}>実際の攻撃に 使われている</Sticker></Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Actor icon="💂" name="警備員" />
      <Pop d={at(0.2)}><Badge name="山田" label="ハンコを確かめる ✔" /></Pop>
      <Pop d={at(0.45)}><Badge name="社長" stamp="none" noStampText evil label="ハンコ不要 → 断る" /></Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Pop><Badge name="社長" stamp="x" evil label="名前を書き換えた入館証" /></Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.3)} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 150 }}>🚫</div>
        <Sticker color={GREEN}>ハンコが合わず 止められる</Sticker>
      </Pop>
    </Center>
  );
};

const Alg = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <CodePanel snippet={K.ALG} highlight={[29]} at={at(0.25)} fontSize={36} width={1600} />
      <Pop d={at(0.55)}><Mono size={44} color={C.gold}>ALLOWED_ALGS = {'{"HS256"}'}</Mono></Pop>
    </Center>
  );
};

const Sig = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel
        snippet={K.SIG}
        steps={[
          { lines: [33], at: at(0.1) },
          { lines: [34, 35], at: at(0.5) },
        ]}
        fontSize={34}
        width={1700}
      />
    </Center>
  );
};

const Time = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel
        snippet={K.TIME}
        steps={[
          { lines: [45, 46, 47, 48], at: at(0.25) },
          { lines: [51, 52, 53, 54], at: at(0.55) },
        ]}
        fontSize={28}
        width={1700}
      />
    </Center>
  );
};

const FixRec = () => {
  const at = useAt();
  const rows: [string, string][] = [
    ['正しいトークン', 'valid'],
    ['中身を書き換え', 'tampered'],
    ['alg を none', 'alg_none'],
    ['1 時間前に期限切れ', 'expired'],
    ['別のサービス向け（aud）', 'wrong_aud'],
  ];
  return (
    <Center gap={16}>
      <Pop><Label>直した verify_token（記録）</Label></Pop>
      {rows.map(([w, k], i) => (
        <ResRow key={k} what={w} r={SO[k]} good={k === 'valid' ? SO[k].accepted : !SO[k].accepted} d={at(0.05 + i * 0.12)} size={38} width={1500} />
      ))}
    </Center>
  );
};

const Lib = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop><Title size={60}>本番は ライブラリで</Title></Pop>
      <Pop d={at(0.2)}>
        <Card color={C.fire} style={{ width: 1500 }}>
          <Label>例：PyJWT（この行は labs/ のコードではない）</Label>
          <Mono size={38} color={C.text}>jwt.decode(token, key,{'\n'}  algorithms=[&quot;HS256&quot;], audience=AUD)</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.55)}><Sticker color={C.gold}>algorithms と audience は 必ず指定</Sticker></Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={76} color={C.red}>署名を見ずに中身を信じる → なりすまし</Title></Pop>
      <Pop d={at(0.45)}><Title size={76} color={GREEN}>署名を確かめてから 中身を使う</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  const refs: [string, string][] = [
    ['CWE-347', '署名の検証が不十分'],
    ['OWASP Top 10:2025 A08', 'Software or Data Integrity Failures'],
    ['ASVS V9.1.1 / V9.1.2', '署名を先に検証・許可リストのアルゴリズム'],
    ['ASVS V9.2.1 / V9.2.3', '有効期間（exp / nbf）・宛先（aud）'],
  ];
  return (
    <Center gap={22}>
      {refs.map(([k, v], i) => (
        <Pop key={k} d={at(0.05 + i * 0.2)}>
          <Card color={C.fire} style={{ width: 1600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 36px' }}>
            <Mono size={42} color={C.gold}>{k}</Mono>
            <Title size={36}>{v}</Title>
          </Card>
        </Pop>
      ))}
    </Center>
  );
};

const Quiz = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1400 }}>
        <Label>直したコードに届いたトークンのヘッダ</Label>
        <Mono size={50} color={C.text}>{'{"alg": "HS512", "typ": "JWT"}'}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>受け入れる？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={22}>
      <Title size={70} color={GREEN}>受け入れない</Title>
      <Pop d={at(0.15)}><CodePanel snippet={K.ALG} highlight={[29]} at={at(0.2)} fontSize={30} width={1500} /></Pop>
      <ResRow what="alg を HS512（記録）" r={SO.alg_hs512} d={at(0.5)} size={38} />
    </Center>
  );
};

const Outro = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Title size={80}>自分で直してみる</Title>
      <Pop d={at(0.2)}>
        <Card color={C.fire}>
          <Mono size={46} color={C.gold}>github.com/kazumasamatsumoto/owasp-asvs-study</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.4)}><Mono size={40} color={C.dim}>labs/lab08_jwt_verification</Mono></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="ハンコ付きの入館証で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab08_jwt_verification" />,
  parts: Parts,
  code: Code,
  step1: Step1,
  step2: Step2,
  step3: Step3,
  ch3: () => <ChapterCard no="3" title="実際に起きた事件" />,
  cve: Cve,
  cve2: Cve2,
  cvss: Cvss,
  kev: Kev,
  ch4: () => <ChapterCard no="4" title="防ぐには" />,
  shop5: Shop5,
  shop6: Shop6,
  alg: Alg,
  sig: Sig,
  time: Time,
  fixRec: FixRec,
  lib: Lib,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: Outro,
};
