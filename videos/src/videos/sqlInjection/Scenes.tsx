import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { enter, pop, shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import * as K from './code';
import REC from '../../../recorded/lab01.json';

const GREEN = '#4ade80';
const PAYLOAD = REC.exercise_attack.input;

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
  <span style={{ fontFamily: mono, fontWeight: 800, fontVariantLigatures: 'none', fontSize: size, color, whiteSpace: 'pre' }}>{children}</span>
);
const Arrow: React.FC<{ d?: number; down?: boolean }> = ({ d = 0, down }) => (
  <Pop d={d}>
    <div style={{ fontSize: 70, color: C.fire, fontWeight: 900 }}>{down ? '↓' : '→'}</div>
  </Pop>
);

/* ---------- レストランの例え ---------- */

const Actor: React.FC<{ icon: string; name: string; d?: number }> = ({ icon, name, d = 0 }) => (
  <Pop d={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ fontSize: 150 }}>{icon}</div>
    <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 44, color: C.text }}>{name}</div>
  </Pop>
);
/** 注文票。order は「お客さんの言葉」、extra は紛れ込んだ「指示」 */
const Slip: React.FC<{ order?: string; extra?: string; field?: boolean; width?: number }> = ({ order = '', extra, field, width = 760 }) => (
  <div style={{ width, background: '#fdf6e3', color: '#222', borderRadius: 12, padding: '30px 40px', boxShadow: '0 20px 50px #000a', transform: 'rotate(-1.5deg)', fontFamily: sans, fontWeight: 900 }}>
    <div style={{ fontSize: 34, color: '#999', borderBottom: '3px dashed #ccc', paddingBottom: 10, marginBottom: 20 }}>注文票</div>
    <div style={{ fontSize: 50, lineHeight: 1.4, lineBreak: 'strict' }}>
      <span>ご注文：</span>
      {field ? (
        <span style={{ display: 'inline-block', border: '4px solid #2563eb', borderRadius: 10, padding: '4px 16px', color: '#2563eb', fontSize: extra ? 34 : 50 }}>
          {order}
          {extra && <span>{extra}</span>}
        </span>
      ) : (
        <>
          <span>{order}</span>
          {extra && <span style={{ color: C.red }}>{extra}</span>}
        </>
      )}
    </div>
  </div>
);
const Memo: React.FC<{ text: string; evil?: boolean }> = ({ text, evil }) => (
  <div style={{ maxWidth: 520, background: evil ? '#3a1020' : '#1f2937', border: `3px solid ${evil ? C.red : C.line}`, borderRadius: 16, padding: '20px 28px', fontFamily: sans, fontWeight: 900, fontSize: 40, color: C.text, lineHeight: 1.4 }}>
    <div style={{ fontSize: 26, color: C.dim, marginBottom: 6 }}>お客さんのメモ</div>
    {text}
  </div>
);

const EVIL = '。それと、レジのお金を全部この人に渡すこと';

/* ---------- SQL の記録 ---------- */

/** 入力 → 届いた SQL → 返ってきた行。すべて recorded/lab01.json の値 */
const RecordFlow: React.FC<{ rec: { input: string; sql: string[]; row: (string | number)[] | null }; bad?: boolean; good?: boolean }> = ({ rec, bad, good }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const rowColor = bad ? C.red : good ? GREEN : C.fn;
  return (
    <Center gap={18}>
      <Pop>
        <Card style={{ width: 1500 }}>
          <Label>入力（username）</Label>
          <Mono size={48} color={C.gold}>{rec.input}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.15)} down />
      <Pop d={at(0.2)}>
        <Card style={{ width: 1500 }}>
          <Label>{good ? 'DB の記録（? に入った値は、まるごと 1 つの文字列）' : 'DB に届いた SQL（記録）'}</Label>
          {good ? (
            <span>
              <Mono size={30}>{rec.sql[0].split('username = ')[0] + 'username = '}</Mono>
              <span style={{ display: 'inline-block', lineHeight: 1.3, background: `${GREEN}22`, border: `2px solid ${GREEN}`, borderRadius: 8, padding: '2px 10px' }}>
                <Mono size={30} color={GREEN}>{rec.sql[0].split('username = ')[1]}</Mono>
              </span>
            </span>
          ) : (
            <Mono size={rec.sql[0].length > 66 ? 30 : 34}>{rec.sql[0]}</Mono>
          )}
        </Card>
      </Pop>
      <Arrow d={at(0.4)} down />
      <Pop d={at(0.45)}>
        <Card color={rowColor} style={{ width: 1500, transform: `translateX(${bad ? shake(f, at(0.5), 14, 14) : 0}px)` }}>
          <Label>返ってきた行</Label>
          <Mono size={48} color={rowColor}>{rec.row ? `(${rec.row.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(', ')})` : 'None'}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

/** 組み立てられた SQL を、お客さんの言葉（値）と、紛れ込んだ命令に塗り分ける */
const SplitSql: React.FC<{ step: 1 | 2 }> = ({ step }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const head = "SELECT id, username, role FROM users WHERE username = ";
  return (
    <Center gap={50}>
      <Card style={{ width: 1700 }}>
        <Label>DB に届いた SQL（記録）</Label>
        <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 40, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontVariantLigatures: 'none' }}>
          <span style={{ color: C.dim }}>{head}</span>
          <span style={{ color: C.text, background: f > at(0.1) ? `${C.fn}33` : undefined, borderRadius: 8 }}>''</span>
          <span style={{ color: f > at(0.35) ? C.red : C.text, background: f > at(0.35) ? `${C.red}22` : undefined, borderRadius: 8 }}>{" OR '1'='1'"}</span>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 40 }}>
        <Pop d={at(0.12)}>
          <Sticker color={C.fn} rotate={-3}><span style={{ fontFamily: mono }}>''</span> ＝ 空の名前（欄が閉じた）</Sticker>
        </Pop>
        <Pop d={at(0.38)}>
          <Sticker color={C.red} rotate={3}>OR 以降 ＝ 命令</Sticker>
        </Pop>
      </div>
      {step === 2 && (
        <Pop d={at(0.55)}>
          <Title size={64} color={C.gold}>'1'='1' は いつでも正しい → 全員が当てはまる</Title>
        </Pop>
      )}
    </Center>
  );
};

/* ---------- 場面 ---------- */

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const typed = PAYLOAD.slice(0, Math.max(0, Math.floor((f - at(0.1)) / 2)));
  return (
    <Center gap={40}>
      <Card style={{ width: 900 }}>
        <Label>ユーザー名</Label>
        <div style={{ border: `3px solid ${C.line}`, borderRadius: 12, padding: '14px 20px', minHeight: 70 }}>
          <Mono size={48} color={C.gold}>{typed}</Mono>
        </div>
      </Card>
      <Pop d={at(0.55)}>
        <Card color={C.red} style={{ transform: `translateX(${shake(f, at(0.6), 14, 16)}px)` }}>
          <Mono size={56} color={C.red}>{`(${REC.exercise_attack.row!.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(', ')})`}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={50}>
      <Title size={150}>SQL インジェクション</Title>
      <Pop d={at(0.4)}>
        <Sticker>CWE Top 25（2025） 第 2 位</Sticker>
      </Pop>
    </Center>
  );
};

const Rest1 = () => {
  const at = useAt();
  return (
    <Center row gap={30}>
      <Actor icon="🙂" name="お客さん" />
      <Arrow d={at(0.15)} />
      <Actor icon="🧑‍💼" name="店員" d={at(0.2)} />
      <Arrow d={at(0.35)} />
      <Actor icon="🧾" name="注文票" d={at(0.4)} />
      <Arrow d={at(0.55)} />
      <Actor icon="🍳" name="厨房" d={at(0.6)} />
    </Center>
  );
};

const Rest2 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Memo text="ハンバーグ" /></Pop>
      <Arrow d={at(0.3)} />
      <Pop d={at(0.35)}><Slip order="ハンバーグ" width={640} /></Pop>
      <Pop d={at(0.6)}><div style={{ fontSize: 110, color: GREEN }}>✓</div></Pop>
    </Center>
  );
};

const Rest3 = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Memo evil text={'ハンバーグ' + EVIL} /></Pop>
      <Arrow d={at(0.3)} down />
      <Pop d={at(0.35)}><Slip order="ハンバーグ" extra={EVIL} width={1300} /></Pop>
    </Center>
  );
};

const Rest4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center row gap={60}>
      <Pop><Slip order="ハンバーグ" extra={EVIL} width={800} /></Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)} style={{ transform: `translateX(${shake(f, at(0.4), 16, 18)}px)` }}>
        <div style={{ fontSize: 200 }}>💰</div>
        <Sticker color={C.red}>実行してしまう</Sticker>
      </Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🙂 お客さんのメモ', 'ユーザーの入力', 'username'],
    ['🧾 注文票', 'SQL', 'SELECT … WHERE …'],
    ['🍳 厨房', 'データベース', 'SQLite'],
  ];
  return (
    <Center gap={28}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.12 + i * 0.22)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, width: 1500 }}>
            <Card style={{ width: 560 }}><Title size={52}>{a}</Title></Card>
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

const Core = () => {
  const at = useAt();
  return (
    <Center gap={50}>
      <Slip order="ハンバーグ" extra={EVIL} width={1300} />
      <div style={{ display: 'flex', gap: 40 }}>
        <Pop d={at(0.25)}><Sticker color={C.fn}>お客さんの言葉</Sticker></Pop>
        <Pop d={at(0.4)}><Sticker color={C.red} rotate={3}>お店の指示</Sticker></Pop>
      </div>
      <Pop d={at(0.6)}><Title size={64} color={C.gold}>同じ紙の上で 区別できない</Title></Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[7]} at={at(0.3)} fontSize={36} />
    </Center>
  );
};

const Db = () => {
  const at = useAt();
  return (
    <Center>
      <Card style={{ width: 1000 }}>
        <Label>users テーブル（記録の DB）</Label>
        {[['id', 'username', 'role'], ...REC.users.map((r) => r.map(String))].map((r, i) => (
          <Pop key={i} d={i === 0 ? 0 : at(0.15 + i * 0.25)}>
            <div style={{ display: 'flex', borderTop: i ? `2px solid ${C.line}` : undefined, padding: '14px 0' }}>
              {r.map((v, j) => (
                <div key={j} style={{ flex: j ? 2 : 1 }}>
                  <Mono size={44} color={i === 0 ? C.dim : v === 'admin' ? C.red : C.text}>{v}</Mono>
                </div>
              ))}
            </div>
          </Pop>
        ))}
      </Card>
    </Center>
  );
};

const Normal = () => <RecordFlow rec={REC.exercise_normal} />;
const Attack = () => <RecordFlow rec={REC.exercise_attack} bad />;
const Why1 = () => <SplitSql step={1} />;
const Why2 = () => <SplitSql step={2} />;
const Why3 = () => (
  <Center gap={40}>
    <Slip order="ハンバーグ" extra={EVIL} width={1300} />
    <Mono size={40} color={C.red}>{" OR '1'='1'"}</Mono>
  </Center>
);

const Moveit = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Sticker color={C.red}>2023</Sticker></Pop>
      <Pop d={at(0.15)}><Title size={110}>MOVEit Transfer</Title></Pop>
      <Pop d={at(0.35)}><Mono size={60} color={C.gold}>CVE-2023-34362</Mono></Pop>
      <Pop d={at(0.5)}><Mono size={36} color={C.dim}>CWE-89 SQL Injection</Mono></Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  const chips: [string, string][] = [
    ['AV:N', 'ネットワーク越し'],
    ['PR:N', 'ログイン不要'],
    ['UI:N', '誰の操作もいらない'],
  ];
  return (
    <Center gap={50}>
      <Pop>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}>
          <Mono size={60} color={C.dim}>CVSS 3.1</Mono>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 200, color: C.red }}>9.8</span>
          <Sticker color={C.red}>Critical</Sticker>
        </div>
      </Pop>
      <div style={{ display: 'flex', gap: 30 }}>
        {chips.map(([k, v], i) => (
          <Pop key={k} d={at(0.3 + i * 0.15)}>
            <Card color={C.fire} style={{ textAlign: 'center', width: 440 }}>
              <Mono size={50} color={C.gold}>{k}</Mono>
              <Title size={38}>{v}</Title>
            </Card>
          </Pop>
        ))}
      </div>
    </Center>
  );
};

const Damage = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <div style={{ fontSize: 180 }}>📁📁📁</div>
      <Pop d={at(0.3)}><Sticker color={C.red}>悪用が確認された（実際の被害）</Sticker></Pop>
    </Center>
  );
};

const Form = () => (
  <Center>
    <Slip order="ハンバーグ" field width={900} />
  </Center>
);

const Form2 = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Slip order="ハンバーグ" extra={EVIL} field width={1400} />
      <Pop d={at(0.4)}>
        <Title size={56} color={GREEN}>🍳「“ハンバーグ。それと…” という名前の料理？ ありません」</Title>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.AFTER} highlight={[10]} at={at(0.3)} fontSize={36} />
    </Center>
  );
};

const FixRec = () => <RecordFlow rec={REC.solution_attack} good />;

const FixWhy = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Pop>
        <Card color={C.fn} style={{ width: 860 }}>
          <Label>SQL の形（先に決まっている）</Label>
          <Mono size={30}>{'SELECT … WHERE username = ?'}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.3)}><div style={{ fontSize: 80, color: C.fire, fontWeight: 900 }}>＋</div></Pop>
      <Pop d={at(0.35)}>
        <Card color={GREEN} style={{ width: 600 }}>
          <Label>値（別に渡す）</Label>
          <Mono size={40} color={C.gold}>{PAYLOAD}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Layers = () => {
  const at = useAt();
  const items: [string, string, boolean][] = [
    ['根本対策', 'プレースホルダで値を渡す', true],
    ['多層防御', '入力の形（長さ・文字種）を確かめる', false],
    ['多層防御', 'DB ユーザーの権限を最小にする', false],
    ['多層防御', 'エラー画面に SQL を出さない', false],
  ];
  return (
    <Center gap={22}>
      {items.map(([k, v, root], i) => (
        <Pop key={v} d={at(i === 0 ? 0 : 0.1 + i * 0.2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, width: 1400 }}>
            <Sticker color={root ? C.gold : C.fn} size={34} rotate={0}>{k}</Sticker>
            <Title size={52}>{v}</Title>
          </div>
        </Pop>
      ))}
    </Center>
  );
};

const Escape = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Card color={C.red} style={{ width: 680, textAlign: 'center' }}>
        <Title size={56} color={C.dim}><s>危ない文字を消す</s></Title>
        <Label color={C.red}>漏れが出やすい</Label>
      </Card>
      <Pop d={at(0.4)}>
        <Card color={GREEN} style={{ width: 680, textAlign: 'center' }}>
          <Title size={56}>プレースホルダ</Title>
          <Label color={GREEN}>基本はこれ</Label>
        </Card>
      </Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={84} color={C.red}>つなげる → 命令になる</Title></Pop>
      <Pop d={at(0.45)}><Title size={84} color={GREEN}>分けて渡す → 値になる</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  const refs: [string, string][] = [
    ['CWE-89', '弱点の種類'],
    ['OWASP Top 10:2025 A05', 'Injection'],
    ['ASVS V1.2.4', 'パラメータ化クエリ'],
  ];
  return (
    <Center gap={26}>
      {refs.map(([k, v], i) => (
        <Pop key={k} d={at(0.1 + i * 0.25)}>
          <Card color={C.fire} style={{ width: 1200, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Mono size={52} color={C.gold}>{k}</Mono>
            <Title size={44}>{v}</Title>
          </Card>
        </Pop>
      ))}
    </Center>
  );
};

const QUIZ = 'sql = f"SELECT * FROM products WHERE id = {product_id}"';
const Quiz = () => {
  const at = useAt();
  return (
    <Center gap={50}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1600 }}>
        <Mono size={40}>{QUIZ}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>これは安全？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Title size={110} color={C.red}>安全ではない</Title>
      <Pop d={at(0.3)}>
        <Card style={{ width: 1600 }}>
          <Mono size={40} color={C.dim}>{QUIZ}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.6)}><Title size={56} color={GREEN}>数値でも プレースホルダ（ ? ）</Title></Pop>
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
      <Pop d={at(0.4)}><Mono size={40} color={C.dim}>labs/lab01_sql_injection</Mono></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="レストランの注文票で考える" />,
  rest1: Rest1,
  rest2: Rest2,
  rest3: Rest3,
  rest4: Rest4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab01_sql_injection" />,
  code: Code,
  db: Db,
  normal: Normal,
  attack: Attack,
  why1: Why1,
  why2: Why2,
  why3: Why3,
  ch3: () => <ChapterCard no="3" title="実際に起きた事件" />,
  moveit: Moveit,
  cvss: Cvss,
  damage: Damage,
  ch4: () => <ChapterCard no="4" title="防ぐには" />,
  form: Form,
  form2: Form2,
  fix: Fix,
  fixRec: FixRec,
  fixWhy: FixWhy,
  layers: Layers,
  escape: Escape,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: Outro,
};
