import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { enter, pop, shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import * as K from './code';
import REC from '../../../recorded/lab07.json';

const GREEN = '#4ade80';
type Case = { origin: string | null; headers: Record<string, string>; can_read_with_cookie: boolean };
type Side = Record<'app' | 'evil' | 'lookalike' | 'http_app' | 'none', Case> & { missing: string[]; csp: string };
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

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
/* ---------- 管理室の例え ---------- */

/** 許可の札 */
const Tag: React.FC<{ name?: string; evil?: boolean; label?: string; x?: boolean }> = ({ name, evil, label, x }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
    <div
      style={{
        position: 'relative',
        width: 300,
        height: 170,
        borderRadius: 14,
        background: '#f4efe2',
        border: `6px solid ${evil ? C.red : GREEN}`,
        boxShadow: '0 16px 40px #000a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: x ? 0.5 : 1,
      }}
    >
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 24, color: '#555' }}>引き渡し許可</div>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 50, color: evil ? C.red : '#222' }}>{name ?? '（なし）'}</div>
      {x && <div style={{ position: 'absolute', fontSize: 150, color: C.red, fontWeight: 900 }}>✕</div>}
    </div>
    {label && <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 32, color: C.text }}>{label}</div>}
  </div>
);

const short = (o: string | null) => (o ?? '（なし）').replace('https://', '');

/** 1 つの Origin の結果（記録） */
const OriginRow: React.FC<{ what: string; c: Case; d?: number; size?: number; width?: number }> = ({ what, c, d = 0, size = 34, width = 1650 }) => {
  const acao = c.headers['Access-Control-Allow-Origin'];
  const bad = c.can_read_with_cookie && what !== '自社のアプリ';
  return (
    <Pop d={d}>
      <Card color={bad ? C.red : c.can_read_with_cookie ? GREEN : C.line} style={{ width, display: 'flex', alignItems: 'center', gap: 26, padding: '16px 30px' }}>
        <div style={{ width: 330, flexShrink: 0 }}><Title size={size}>{what}</Title></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <Mono size={size * 0.8} color={C.dim}>{`Origin: ${c.origin}`}</Mono>
          <Mono size={size * 0.8} color={acao ? (bad ? C.red : GREEN) : C.dim}>{`Allow-Origin: ${acao ?? '（付かない）'}`}</Mono>
        </div>
        <div style={{ width: 210, flexShrink: 0, textAlign: 'right' }}>
          <Title size={size} color={c.can_read_with_cookie ? (bad ? C.red : GREEN) : C.dim}>{c.can_read_with_cookie ? '読める' : '読めない'}</Title>
        </div>
      </Card>
    </Pop>
  );
};

const ROWS: [string, keyof Side][] = [
  ['自社のアプリ', 'app'],
  ['攻撃者のサイト', 'evil'],
  ['似せた名前', 'lookalike'],
  ['http のまま', 'http_app'],
];

/* ---------- 場面 ---------- */

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center row gap={50}>
      <Actor icon="🌐" name={short(EX.evil.origin)} />
      <Arrow d={at(0.15)} />
      <Pop d={at(0.2)}>
        <Card style={{ textAlign: 'center', width: 520 }}>
          <Label>ログイン中のあなたのデータ</Label>
          <div style={{ fontSize: 110 }}>📄</div>
        </Card>
      </Pop>
      <Pop d={at(0.5)} style={{ transform: `translateX(${shake(f, at(0.55), 14, 14)}px)` }}>
        <Sticker color={C.red}>読み出せる</Sticker>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={120}>セキュリティヘッダ</Title>
      <Pop d={at(0.2)}><Title size={56} color={C.dim}>CORS ・ CSP ・ HSTS …</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-693</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Pop style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 150 }}>🏢</div>
        <Title size={44}>管理室</Title>
        <Title size={34} color={C.dim}>📦 住人の荷物</Title>
      </Pop>
      <Arrow d={at(0.3)} />
      <Pop d={at(0.35)} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 150 }}>🧑‍💼</div>
        <Title size={44}>使いの人</Title>
        <Title size={34} color={C.dim}>🪪 住人の会員証</Title>
      </Pop>
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Tag name="A 社" label="管理室が出す札" /></Pop>
      <Actor icon="💂" name="入口の警備員" d={at(0.2)} />
      <Arrow d={at(0.4)} />
      <Pop d={at(0.45)} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 130 }}>📦</div>
        <Title size={38}>A 社の使いにだけ</Title>
      </Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 150 }}>😈</div>
        <Card style={{ padding: '14px 28px' }}><Title size={40}>「悪い会社です」</Title></Card>
      </Pop>
      <Arrow d={at(0.25)} />
      <Actor icon="🏢" name="管理室" d={at(0.3)} />
      <Arrow d={at(0.5)} />
      <Pop d={at(0.55)}><Tag name="悪い会社" evil label="そのまま札に書く" /></Pop>
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 50, alignItems: 'center' }}>
        <Pop><Tag name="悪い会社" evil /></Pop>
        <Actor icon="💂" name="警備員" d={at(0.15)} />
        <Arrow d={at(0.3)} />
        <Pop d={at(0.35)} style={{ textAlign: 'center' }}><div style={{ fontSize: 130 }}>📦</div></Pop>
        <Arrow d={at(0.4)} />
        <Actor icon="😈" name="悪い会社の使い" d={at(0.45)} />
      </div>
      <Pop d={at(0.65)} style={{ transform: `translateX(${shake(f, at(0.68), 12, 12)}px)` }}><Sticker color={C.red}>荷物を 渡してしまう</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🏢 管理室', 'サーバー', 'security_headers()'],
    ['🪪 会員証', 'Cookie', 'ブラウザが自動で付ける'],
    ['💂 警備員', 'ブラウザ', 'ほかのサイトに読ませるか判定'],
    ['🏷 許可の札', 'Access-Control-Allow-Origin', '＋ Allow-Credentials: true'],
  ];
  return (
    <Center gap={22}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.05 + i * 0.2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, width: 1600 }}>
            <Card style={{ width: 440, padding: '16px 28px' }}><Title size={44}>{a}</Title></Card>
            <div style={{ fontSize: 56, color: C.fire }}>＝</div>
            <Card color={C.fire} style={{ flex: 1, padding: '12px 28px' }}>
              <Title size={42}>{b}</Title>
              <div style={{ textAlign: 'center' }}><Mono size={28} color={C.dim}>{c}</Mono></div>
            </Card>
          </div>
        </Pop>
      ))}
    </Center>
  );
};

const Core = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card style={{ width: 1400 }}>
          <Label>来た要求（相手が名乗る）</Label>
          <Mono size={48}>{`Origin: ${EX.evil.origin}`}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.2)} down />
      <Pop d={at(0.25)}>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>直す前の応答（記録）</Label>
          <Mono size={42} color={C.red}>{`Access-Control-Allow-Origin: ${EX.evil.headers['Access-Control-Allow-Origin']}`}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.55)}><Sticker color={C.red} rotate={3}>確かめずに そのまま</Sticker></Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[12, 13, 14]} at={at(0.3)} fontSize={36} width={1700} />
    </Center>
  );
};

const Step = ({ k, title }: { k: 'app' | 'evil'; title: string }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const bad = k !== 'app';
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>{title}</Title></Pop>
      <div style={{ transform: bad ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
        <OriginRow what={k === 'app' ? '自社のアプリ' : '攻撃者のサイト'} c={EX[k]} d={at(0.15)} size={44} />
      </div>
      <Pop d={at(0.55)}>
        <Card color={bad ? C.red : GREEN} style={{ width: 1650 }}>
          <Label>Allow-Credentials（記録）</Label>
          <Mono size={40} color={bad ? C.red : GREEN}>{`Access-Control-Allow-Credentials: ${EX[k].headers['Access-Control-Allow-Credentials']}`}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};
const Step1 = () => <Step k="app" title="① 自社のアプリから" />;
const Step2 = () => <Step k="evil" title="② 攻撃者のサイトから" />;

const Table: React.FC<{ side: Side; title: string }> = ({ side, title }) => {
  const at = useAt();
  return (
    <Center gap={18}>
      <Pop><Label>{title}</Label></Pop>
      {ROWS.map(([w, k], i) => (
        <OriginRow key={k} what={w} c={side[k] as Case} d={at(0.05 + i * 0.14)} />
      ))}
    </Center>
  );
};
const Step3 = () => <Table side={EX} title="直す前：4 つの Origin で試した記録（Cookie 付きで読めるか）" />;

const Csp = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card color={C.red} style={{ width: 1600 }}>
          <Label>直す前の CSP（記録）</Label>
          <Mono size={44} color={C.red}>{EX.csp}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.35)}><Label>付いていないヘッダ（記録）</Label></Pop>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, width: 1600, justifyContent: 'center' }}>
        {EX.missing.map((m, i) => (
          <Pop key={m} d={at(0.4 + i * 0.1)}><Card color={C.red} style={{ padding: '14px 26px' }}><Mono size={34} color={C.red}>{m}</Mono></Card></Pop>
        ))}
      </div>
    </Center>
  );
};

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2026-66070</Mono></Pop>
      <Pop d={at(0.12)}><Title size={100}>RabbitMQ</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>メッセージを配るソフトの 管理画面（管理プラグイン）</Title></Pop>
      <Pop d={at(0.45)}>
        <Card color={C.red} style={{ width: 1500 }}>
          <Label>cors_allow_origins を &quot;*&quot; にした設定で</Label>
          <Title size={42} color={C.red}>来た Origin をそのまま返し、Allow-Credentials: true</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="😈" name="悪いページ" />
      <Arrow d={at(0.15)} />
      <Actor icon="🧑‍💻" name="ログイン中の管理者" d={at(0.2)} />
      <Arrow d={at(0.4)} />
      <Pop d={at(0.45)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 130 }}>🐇</div>
        <Sticker color={C.red}>設定を変える操作</Sticker>
      </Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  const chips: [string, string][] = [
    ['AV:N', 'ネットワーク越し'],
    ['PR:N', 'ログイン不要'],
    ['UI:R', '管理者がページを開く'],
  ];
  return (
    <Center gap={50}>
      <Pop>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}>
          <Mono size={56} color={C.dim}>NVD CVSS 3.1</Mono>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 200, color: C.fire }}>8.8</span>
          <Sticker color={C.fire}>High</Sticker>
        </div>
      </Pop>
      <div style={{ display: 'flex', gap: 30 }}>
        {chips.map(([k, v], i) => (
          <Pop key={k} d={at(0.3 + i * 0.15)}>
            <Card color={C.fire} style={{ textAlign: 'center', width: 480 }}>
              <Mono size={50} color={C.gold}>{k}</Mono>
              <Title size={36}>{v}</Title>
            </Card>
          </Pop>
        ))}
      </div>
    </Center>
  );
};

const Fixed = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1400, textAlign: 'center' }}>
          <Label>CISA の 悪用が確認された脆弱性の一覧</Label>
          <Title size={60} color={C.dim}>載っていない</Title>
        </Card>
      </Pop>
      <Pop d={at(0.35)}>
        <Card color={GREEN} style={{ width: 1400, textAlign: 'center' }}>
          <Label>直した版</Label>
          <Mono size={54} color={GREEN}>3.13.17 / 4.0.22 / 4.1.13 / 4.2.6</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop>
        <Card style={{ width: 420 }}>
          <Label>📋 名簿</Label>
          <Title size={48}>A 社</Title>
          <Title size={48}>B 社</Title>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)}><Tag name="A 社" label="名簿にあれば 札を出す" /></Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="😈" name="悪い会社の使い" />
      <Arrow d={at(0.15)} />
      <Pop d={at(0.2)}><Tag x evil label="札は出ない" /></Pop>
      <Arrow d={at(0.4)} />
      <Pop d={at(0.45)} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 140 }}>💂</div>
        <Sticker color={GREEN}>荷物は 渡さない</Sticker>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel
        snippet={K.CORS}
        steps={[
          { lines: [22], at: at(0.12) },
          { lines: [25], at: at(0.6) },
        ]}
        fontSize={36}
        width={1650}
      />
    </Center>
  );
};

const FixRec = () => <Table side={SO} title="直した後：同じ 4 つの Origin で試した記録" />;

const Headers = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.HEADERS} highlight={[15, 16, 17, 18, 19]} at={at(0.2)} fontSize={28} width={1700} maxLines={14} />
    </Center>
  );
};

const Layers = () => {
  const at = useAt();
  const parts = SO.csp.split('; ');
  return (
    <Center gap={16}>
      <Pop><Label>直した CSP（記録）</Label></Pop>
      {parts.map((p, i) => {
        const hot = (p.startsWith('script-src') && 0.15) || (p.startsWith('frame-ancestors') && 0.55) || 0;
        return (
          <Pop key={p} d={at(0.05 + i * 0.05)}>
            <Card color={hot ? C.gold : C.line} style={{ width: 1300, padding: '12px 30px' }}>
              <Mono size={40} color={hot ? C.gold : C.text}>{p}</Mono>
            </Card>
          </Pop>
        );
      })}
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>来た Origin をそのまま許可 → どこからでも読まれる</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>許可リストと 完全一致で確かめる</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  const refs: [string, string][] = [
    ['CWE-693', '守りの仕組みの不備'],
    ['CWE-942', '許しすぎの CORS 設定'],
    ['OWASP Top 10:2025 A02', 'Security Misconfiguration'],
    ['ASVS V3.4', 'HSTS・CORS・CSP・nosniff など'],
  ];
  return (
    <Center gap={22}>
      {refs.map(([k, v], i) => (
        <Pop key={k} d={at(0.05 + i * 0.2)}>
          <Card color={C.fire} style={{ width: 1600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 36px' }}>
            <Mono size={42} color={C.gold}>{k}</Mono>
            <Title size={38}>{v}</Title>
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
        <Label>直したコードに 届いた要求</Label>
        <Mono size={50} color={C.text}>{`Origin: ${SO.http_app.origin}`}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>許可される？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={22}>
      <Title size={70} color={GREEN}>許可されない</Title>
      <OriginRow what="http のまま" c={SO.http_app} d={at(0.15)} size={36} />
      <Pop d={at(0.45)}><CodePanel snippet={K.CORS} highlight={[22]} at={at(0.5)} fontSize={30} width={1500} maxLines={2} /></Pop>
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
      <Pop d={at(0.4)}><Mono size={40} color={C.dim}>labs/lab07_security_headers</Mono></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="マンションの管理室で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab07_security_headers" />,
  code: Code,
  step1: Step1,
  step2: Step2,
  step3: Step3,
  csp: Csp,
  ch3: () => <ChapterCard no="3" title="実際に起きた事件" />,
  cve: Cve,
  cve2: Cve2,
  cvss: Cvss,
  fixed: Fixed,
  ch4: () => <ChapterCard no="4" title="防ぐには" />,
  shop5: Shop5,
  shop6: Shop6,
  fix: Fix,
  fixRec: FixRec,
  headers: Headers,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: Outro,
};
