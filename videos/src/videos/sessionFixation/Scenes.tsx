import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { enter, pop, shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import * as K from './code';
import REC from '../../../recorded/lab06.json';

const GREEN = '#4ade80';
const EX = REC.exercise;
const SO = REC.solution;
const show = (v: string | null) => (v === null ? 'None' : `'${v}'`);

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
/* ---------- ホテルの例え ---------- */

/** カードキー。room があれば部屋が登録済み */
const KeyCard: React.FC<{ room?: string; label?: string; evil?: boolean; copy?: boolean; ok?: boolean; x?: boolean }> = ({ room, label, evil, copy, ok, x }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
    <div
      style={{
        position: 'relative',
        width: 260,
        height: 160,
        borderRadius: 18,
        background: copy ? '#3a1020' : '#1e3a5f',
        border: `5px solid ${evil ? C.red : ok ? GREEN : '#93c5fd'}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 16px 40px #000a',
        opacity: x ? 0.45 : 1,
      }}
    >
      <div style={{ fontSize: 50 }}>{copy ? '🔑' : '💳'}</div>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 34, color: room ? C.gold : C.dim }}>{room ?? '部屋なし'}</div>
      {x && <div style={{ position: 'absolute', fontSize: 150, color: C.red, fontWeight: 900 }}>✕</div>}
    </div>
    {label && <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 32, color: C.text }}>{label}</div>}
  </div>
);

/** トークン 1 つ（記録の値） */
const Token: React.FC<{ v: string; color?: string; size?: number }> = ({ v, color = C.gold, size = 60 }) => (
  <span style={{ fontFamily: mono, fontWeight: 800, fontVariantLigatures: 'none', fontSize: size, color, wordBreak: 'break-all' }}>{v}</span>
);

/** get_user の結果 1 行（記録） */
const Ask: React.FC<{ who: string; token: string; answer: string | null; bad?: boolean; d?: number; size?: number; width?: number; pad?: string }> = ({ who, token, answer, bad, d = 0, size = 44, width = 1500, pad }) => (
  <Pop d={d}>
    <Card color={bad ? C.red : GREEN} style={{ width, ...(pad ? { padding: pad } : {}) }}>
      <Label>{who}</Label>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
        <span>
          <Mono size={size} color={C.dim}>get_user(</Mono>
          <Token v={token} size={size} />
          <Mono size={size} color={C.dim}>)</Mono>
        </span>
        <Mono size={size} color={C.dim}>→</Mono>
        <Mono size={Math.round(size * 1.1)} color={bad ? C.red : GREEN}>{show(answer)}</Mono>
      </div>
    </Card>
  </Pop>
);

/* ---------- 場面 ---------- */

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center row gap={60}>
      <Actor icon="🙂" name="被害者 alice" />
      <Pop d={at(0.15)} style={{ textAlign: 'center' }}>
        <Title size={44} color={C.dim}>ログインしたのは 1 人だけ</Title>
        <div style={{ marginTop: 20 }}><Token v={EX.victim_token} size={90} /></div>
      </Pop>
      <Pop d={at(0.45)} style={{ transform: `translateX(${shake(f, at(0.5), 14, 14)}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <Actor icon="😈" name="攻撃者" />
        <Sticker color={C.red}>{`alice として ログイン中`}</Sticker>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={120}>セッション固定</Title>
      <Pop d={at(0.2)}><Title size={60} color={C.dim}>Session Fixation</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-384</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="🙂" name="客" />
      <Arrow d={at(0.15)} />
      <Actor icon="🛎" name="フロント" d={at(0.25)} />
      <Arrow d={at(0.45)} />
      <Pop d={at(0.5)}><KeyCard room="502 号室" label="部屋が登録される" ok /></Pop>
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Actor icon="😈" name="悪い客" />
      <Pop d={at(0.15)}><KeyCard label="部屋なしのカード" /></Pop>
      <Pop d={at(0.45)}><Title size={70} color={C.fire}>＋</Title></Pop>
      <Pop d={at(0.5)}><KeyCard copy evil label="合鍵を作っておく" /></Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="😈" name="悪い客" />
      <Pop d={at(0.1)}><KeyCard label="こっそり渡す" /></Pop>
      <Arrow d={at(0.25)} />
      <Actor icon="🙂" name="客" d={at(0.3)} />
      <Arrow d={at(0.55)} />
      <Actor icon="🛎" name="チェックイン" d={at(0.6)} />
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <Pop><Title size={52}>🛎 渡されたカードに そのまま部屋を登録</Title></Pop>
      <div style={{ display: 'flex', gap: 80, alignItems: 'center' }}>
        <Pop d={at(0.2)}><KeyCard room="502 号室" label="客のカード" /></Pop>
        <Pop d={at(0.4)}><Title size={80} color={C.red}>＝</Title></Pop>
        <Pop d={at(0.45)}><KeyCard room="502 号室" copy evil label="悪い客の合鍵" /></Pop>
      </div>
      <Pop d={at(0.7)} style={{ transform: `translateX(${shake(f, at(0.72), 12, 12)}px)` }}><Sticker color={C.red}>🚪 合鍵でも 部屋が開く</Sticker></Pop>
    </Center>
  );
};

const MapRows: React.FC<{ rows: [string, string, string][] }> = ({ rows }) => {
  const at = useAt();
  return (
    <Center gap={30}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.1 + i * 0.25)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, width: 1500 }}>
            <Card style={{ width: 560 }}><Title size={50}>{a}</Title></Card>
            <div style={{ fontSize: 60, color: C.fire }}>＝</div>
            <Card color={C.fire} style={{ flex: 1 }}>
              <Title size={52}>{b}</Title>
              <div style={{ textAlign: 'center' }}><Mono size={30} color={C.dim}>{c}</Mono></div>
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
      ['💳 カードキー', 'セッショントークン', `Cookie: ${EX.cookie.split(';')[0]}`],
      ['🛎 チェックイン', 'ログイン', 'login(user_id, old_token)'],
      ['🏨 フロント', 'サーバー', 'SessionStore'],
    ]}
  />
);

const Core = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop>
        <Card style={{ width: 560, textAlign: 'center' }}>
          <Label>ログイン前</Label>
          <Token v={EX.attacker_token} size={80} />
        </Card>
      </Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}>
        <Card color={C.red} style={{ width: 560, textAlign: 'center' }}>
          <Label>ログイン後</Label>
          <Token v={EX.victim_token} size={80} color={C.red} />
        </Card>
      </Pop>
      <Pop d={at(0.55)}><Sticker color={C.red} rotate={4}>同じまま</Sticker></Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[16]} at={at(0.3)} fontSize={36} />
    </Center>
  );
};

const Step1 = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>① 攻撃者が ログイン前のセッションをもらう</Title></Pop>
      <Pop d={at(0.2)}>
        <Card style={{ width: 1300 }}>
          <Label>login(&quot;anonymous&quot;) の戻り値（記録）</Label>
          <Token v={EX.attacker_token} size={110} />
        </Card>
      </Pop>
      <Pop d={at(0.5)}><Actor icon="😈" name="控えておく" /></Pop>
    </Center>
  );
};

const Step2 = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Title size={50} color={C.dim}>② 被害者 alice が このトークンのままログイン</Title></Pop>
      <Pop d={at(0.15)}>
        <Card style={{ width: 1500 }}>
          <Label>渡したもの</Label>
          <Mono size={44} color={C.text}>login(&quot;alice&quot;, old_token=</Mono><Token v={EX.attacker_token} size={44} /><Mono size={44} color={C.text}>)</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.3)} down />
      <Pop d={at(0.35)}>
        <Card color={C.red} style={{ width: 1500 }}>
          <Label>返ってきたトークン（記録）</Label>
          <Token v={EX.victim_token} size={80} color={C.red} />
        </Card>
      </Pop>
      <Pop d={at(0.65)}><Sticker color={C.red}>同じ {EX.victim_token}</Sticker></Pop>
    </Center>
  );
};

const Step3 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>③ 攻撃者が 最初のトークンで問い合わせる</Title></Pop>
      <div style={{ transform: `translateX(${shake(f, at(0.45), 12, 12)}px)` }}>
        <Ask who="😈 攻撃者（記録）" token={EX.attacker_token} answer={EX.attacker_get_user} bad d={at(0.2)} size={52} />
      </div>
      <Pop d={at(0.6)}><Sticker color={C.red}>被害者として扱われた</Sticker></Pop>
    </Center>
  );
};

const Plant = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop><Label>説明の図（このリンクは作っていない）</Label></Pop>
      <Pop d={at(0.1)}>
        <Card color={C.fire} style={{ width: 1400 }}>
          <Mono size={48} color={C.text}>https://example.test/login?session=</Mono><Token v={EX.attacker_token} size={48} />
        </Card>
      </Pop>
      <Arrow d={at(0.35)} down />
      <Pop d={at(0.4)}><Actor icon="🌐" name="相手のブラウザが このトークンを持つ" /></Pop>
    </Center>
  );
};

const Weak = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <CodePanel snippet={K.BEFORE} highlight={[16]} at={at(0.05)} fontSize={34} width={1600} />
      <div style={{ display: 'flex', gap: 40 }}>
        <Pop d={at(0.35)}><Card color={C.red} style={{ textAlign: 'center', width: 600 }}><Label>作り方</Label><Mono size={40} color={C.red}>random.randint</Mono></Card></Pop>
        <Pop d={at(0.5)}><Card color={C.red} style={{ textAlign: 'center', width: 600 }}><Label>種類</Label><Title size={50} color={C.red}>約 100 万通り</Title></Card></Pop>
      </div>
    </Center>
  );
};

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2026-102489</Mono></Pop>
      <Pop d={at(0.15)}><Title size={110}>Zammad</Title></Pop>
      <Pop d={at(0.3)}><Title size={46} color={C.dim}>問い合わせ管理ツール（6.3.0〜6.5.4）</Title></Pop>
      <Pop d={at(0.5)}><Sticker color={C.red}>セッション乗っ取り → サーバーでプログラム実行</Sticker></Pop>
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
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 200, color: C.red }}>9.8</span>
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
      <Pop d={at(0.2)}><Mono size={90} color={C.gold}>2026-10-02 追加</Mono></Pop>
      <Pop d={at(0.5)}><Sticker color={C.red}>実際の攻撃に 使われている</Sticker></Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={56}>🛎 チェックインのたびに 新しいカード</Title></Pop>
      <div style={{ display: 'flex', gap: 80, alignItems: 'center' }}>
        <Pop d={at(0.2)}><KeyCard label="渡されたカード" x /></Pop>
        <Arrow d={at(0.35)} />
        <Pop d={at(0.45)}><KeyCard room="502 号室" label="新しいカード" ok /></Pop>
      </div>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Pop><KeyCard copy evil label="悪い客の合鍵" /></Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.3)} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 150 }}>🚪</div>
        <Sticker color={GREEN}>どの部屋も 開かない</Sticker>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel
        snippet={K.AFTER}
        steps={[
          { lines: [16, 17], at: at(0.12) },
          { lines: [18], at: at(0.45) },
        ]}
        fontSize={32}
      />
    </Center>
  );
};

const FixRec = () => {
  const at = useAt();
  return (
    <Center gap={24}>
      <Pop>
        <Card style={{ width: 1600 }}>
          <Label>① 攻撃者がもらったトークン（記録）</Label>
          <Token v={SO.attacker_token} size={40} />
        </Card>
      </Pop>
      <Pop d={at(0.15)}>
        <Card color={GREEN} style={{ width: 1600 }}>
          <Label>② alice がログインした後のトークン（記録）</Label>
          <Token v={SO.victim_token} size={40} color={GREEN} />
        </Card>
      </Pop>
      <Ask who="③ 😈 攻撃者のトークンで問い合わせ（記録）" token={SO.attacker_token.slice(0, 12) + '…'} answer={SO.attacker_get_user} d={at(0.45)} width={1600} />
    </Center>
  );
};

const Cookie = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card color={C.red} style={{ width: 1600 }}>
          <Label>直す前の Cookie（記録）</Label>
          <Mono size={46} color={C.red}>{EX.cookie}</Mono>
        </Card>
      </Pop>
      <CodePanel snippet={K.COOKIE} highlight={[46]} at={at(0.3)} fontSize={30} width={1600} />
    </Center>
  );
};

const Layers = () => {
  const at = useAt();
  const items: [string, string, string][] = [
    ['根本対策', 'ログインのたびに 新しいトークン', C.gold],
    ['多層防御', '長くて予測できない乱数（secrets）', C.fn],
    ['多層防御', `${REC.idle_timeout_min} 分 何もしなければ期限切れ`, C.fn],
    ['多層防御', 'ログアウトは サーバー側で消す', C.fn],
  ];
  return (
    <Center gap={22}>
      {items.map(([k, v, c], i) => (
        <Pop key={v} d={at(i === 0 ? 0 : 0.1 + i * 0.2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, width: 1500 }}>
            <Sticker color={c} size={34} rotate={0}>{k}</Sticker>
            <Title size={50}>{v}</Title>
          </div>
        </Pop>
      ))}
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={76} color={C.red}>ログイン前のトークンのまま → 乗っ取られる</Title></Pop>
      <Pop d={at(0.45)}><Title size={76} color={GREEN}>ログインのたびに 新しいトークン</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  const refs: [string, string][] = [
    ['CWE-384', 'セッション固定'],
    ['OWASP Top 10:2025 A07', 'Authentication Failures'],
    ['ASVS V7.2.4 / V7.2.3', 'ログイン時に新しいトークン・十分な乱数'],
  ];
  return (
    <Center gap={26}>
      {refs.map(([k, v], i) => (
        <Pop key={k} d={at(0.1 + i * 0.25)}>
          <Card color={C.fire} style={{ width: 1600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Mono size={46} color={C.gold}>{k}</Mono>
            <Title size={40}>{v}</Title>
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
        <Label>直す前のコード</Label>
        <Mono size={46} color={C.text}>logout(</Mono><Token v={EX.victim_token} size={46} /><Mono size={46} color={C.text}>)  # alice がログアウト</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={66}>{`攻撃者の ${EX.attacker_token} は まだ使える？`}</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={16}>
      <Title size={70} color={C.red}>使えてしまう</Title>
      <Ask who="直す前：ログアウトの後（記録）" token={EX.victim_token} answer={EX.after_logout_get_user} bad d={at(0.15)} size={38} pad="18px 36px" />
      <Pop d={at(0.4)}><CodePanel snippet={K.LOGOUT} highlight={[35]} at={at(0.45)} fontSize={30} width={1500} /></Pop>
      <Ask who="直した後：ログアウトの後（記録）" token={SO.victim_token.slice(0, 12) + '…'} answer={SO.after_logout_get_user} d={at(0.65)} size={38} pad="18px 36px" />
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
      <Pop d={at(0.4)}><Mono size={40} color={C.dim}>labs/lab06_session</Mono></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="ホテルのカードキーで考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab06_session" />,
  code: Code,
  step1: Step1,
  step2: Step2,
  step3: Step3,
  plant: Plant,
  weak: Weak,
  ch3: () => <ChapterCard no="3" title="実際に起きた事件" />,
  cve: Cve,
  cvss: Cvss,
  kev: Kev,
  ch4: () => <ChapterCard no="4" title="防ぐには" />,
  shop5: Shop5,
  shop6: Shop6,
  fix: Fix,
  fixRec: FixRec,
  cookie: Cookie,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: Outro,
};
