import { useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, ResultRow, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab11.json';

type Case = { name: string; ok: boolean; output?: string[]; error?: string; pwned_created: boolean };
type Side = Record<'normal' | 'semicolon' | 'and' | 'subshell' | 'quiz_option', Case>;
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

const ROWS: [string, keyof Side][] = [
  ['ふつうの名前', 'normal'],
  ['; で 2 つ目', 'semicolon'],
  ['&& で続ける', 'and'],
  ['$( ) で先に', 'subshell'],
];
const resultOf = (c: Case) => {
  if (!c.ok) return 'そのファイルは無い';
  const leaked = c.output!.some((l) => l.startsWith('DB_'));
  if (leaked) return '秘密の中身が出た';
  if (c.pwned_created) return 'pwned が作られた';
  return c.output!.join(' ');
};
const Row: React.FC<{ what: string; c: Case; d?: number; size?: number }> = ({ what, c, d, size = 32 }) => {
  const bad = c.pwned_created || (c.output ?? []).some((l) => l.startsWith('DB_'));
  return <ResultRow what={what} input={c.name} result={resultOf(c)} ok={c.ok && !bad} bad={bad} d={d} size={size} />;
};

/** 注文票 */
const Ticket: React.FC<{ lines: string[]; evil?: boolean; field?: boolean }> = ({ lines, evil, field }) => (
  <div style={{ width: 460, borderRadius: 12, background: '#f4efe2', border: `6px solid ${evil ? C.red : GREEN}`, padding: '18px 24px', boxShadow: '0 16px 40px #000a' }}>
    <div style={{ fontSize: 26, color: '#555', fontWeight: 700 }}>🧾 注文票</div>
    {field ? (
      <div style={{ marginTop: 10, border: '3px dashed #888', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: 22, color: '#777' }}>品名の欄</div>
        {lines.map((l) => (
          <Title key={l} size={32} color="#222">{l}</Title>
        ))}
      </div>
    ) : (
      lines.map((l, i) => (
        <Title key={l} size={34} color={evil && i > 0 ? C.red : '#222'}>{l}</Title>
      ))
    )}
  </div>
);

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1400 }}>
          <Label>ファイルの名前</Label>
          <Mono size={58}>
            report.txt<span style={{ color: C.red }}>; cat secret.env</span>
          </Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)} style={{ transform: `translateX(${shake(f, at(0.4), 14, 14)}px)` }}>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>返ってきた出力（記録）</Label>
          {EX.semicolon.output!.map((l, i) => (
            <div key={l}><Mono size={52} color={i ? C.red : C.text}>{l}</Mono></div>
          ))}
        </Card>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={110}>OS コマンドインジェクション</Title>
      <Pop d={at(0.2)}><Mono size={60} color={C.dim}>;  &&  $( )</Mono></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-78</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Ticket lines={['カレー']} /></Pop>
      <Arrow d={at(0.2)} />
      <Actor icon="🧑‍💼" name="注文係（読み上げる）" d={at(0.25)} />
      <Arrow d={at(0.45)} />
      <Actor icon="🧑‍🍳" name="厨房" d={at(0.5)} />
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Card style={{ padding: '18px 30px' }}><Title size={44}>📢「カレー」</Title></Card></Pop>
      <Arrow d={at(0.25)} />
      <Actor icon="🧑‍🍳" name="聞こえたとおりに全部こなす" d={at(0.3)} />
      <Arrow d={at(0.5)} />
      <Actor icon="🍛" name="カレー" d={at(0.55)} />
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="😈" name="悪い客" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><Ticket evil lines={['カレー。', 'それから、金庫を開けて', '中身を持ってこい']} /></Pop>
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 46, alignItems: 'center' }}>
        <Actor icon="🧑‍💼" name="そのまま読み上げる" />
        <Arrow d={at(0.15)} />
        <Actor icon="🧑‍🍳" name="厨房" d={at(0.2)} />
        <Arrow d={at(0.35)} />
        <Actor icon="🍛" name="カレー" d={at(0.4)} />
        <Actor icon="💰" name="金庫の中身" d={at(0.5)} />
      </div>
      <Pop d={at(0.65)} style={{ transform: `translateX(${shake(f, at(0.68), 12, 12)}px)` }}><Sticker color={C.red}>命令まで 実行されてしまう</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🧑‍💼 注文係', 'アプリ', 'count_lines()'],
    ['🧑‍🍳 厨房', 'シェル', 'shell=True で文字列を解釈'],
    ['🧾 注文票', '利用者の入力', 'ファイルの名前'],
    ['「それから」', '; や &&', '次の命令に続ける記号'],
  ];
  return (
    <Center gap={22}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.05 + i * 0.2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, width: 1600 }}>
            <Card style={{ width: 480, padding: '16px 28px' }}><Title size={44}>{a}</Title></Card>
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
        <Card style={{ width: 1500 }}>
          <Label>つなげた文字列</Label>
          <Mono size={52}>
            wc -l report.txt<span style={{ color: C.red }}>; cat secret.env</span>
          </Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)}>
        <Card color={C.red} style={{ width: 1500 }}>
          <Label>シェルが読むと</Label>
          <Mono size={48}>① wc -l report.txt</Mono>
          <div><Mono size={48} color={C.red}>② cat secret.env</Mono></div>
        </Card>
      </Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[13, 14]} at={at(0.3)} fontSize={36} width={1700} />
    </Center>
  );
};

const Step = ({ k, title }: { k: 'normal' | 'semicolon'; title: string }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const c = EX[k];
  const bad = k !== 'normal';
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>{title}</Title></Pop>
      <Pop d={at(0.15)}>
        <Card style={{ width: 1400 }}>
          <Label>渡した名前</Label>
          <Mono size={54}>{c.name}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.4)} down />
      <div style={{ transform: bad ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
        <Pop d={at(0.45)}>
          <Card color={bad ? C.red : GREEN} style={{ width: 1400 }}>
            <Label>返ってきた出力（記録）</Label>
            {c.output!.map((l, i) => (
              <div key={l}><Mono size={50} color={i ? C.red : GREEN}>{l}</Mono></div>
            ))}
          </Card>
        </Pop>
      </div>
    </Center>
  );
};
const Step1 = () => <Step k="normal" title="① ふつうの名前" />;
const Step2 = () => <Step k="semicolon" title="② ; で 2 つ目の命令" />;

const Table: React.FC<{ side: Side; title: string }> = ({ side, title }) => {
  const at = useAt();
  return (
    <Center gap={18}>
      <Pop><Label>{title}</Label></Pop>
      {ROWS.map(([w, k], i) => (
        <Row key={k} what={w} c={side[k]} d={at(0.05 + i * 0.14)} />
      ))}
    </Center>
  );
};
const Step3 = () => <Table side={EX} title="直す前：4 つの名前を渡した記録" />;

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2026-25108</Mono></Pop>
      <Pop d={at(0.12)}><Title size={110}>FileZen</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>ソリトンシステムズの ファイルを受け渡す製品</Title></Pop>
      <Pop d={at(0.45)}><Sticker color={C.red}>ウイルスチェックの機能に</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="🧑‍💻" name="ログインした利用者" />
      <Arrow d={at(0.15)} />
      <Actor icon="📨" name="細工した要求" d={at(0.2)} />
      <Arrow d={at(0.4)} />
      <Pop d={at(0.45)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 130 }}>🖥️</div>
        <Sticker color={C.red}>好きな OS コマンド</Sticker>
      </Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  return <CvssCard score="8.8" sev="High" at={at} chips={[['AV:N', 'ネットワーク越し'], ['PR:L', '利用者のログイン'], ['UI:N', '誰の操作も不要']]} />;
};

const Kev = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card color={C.red} style={{ width: 1400, textAlign: 'center' }}>
          <Label>CISA の 悪用が確認された脆弱性の一覧</Label>
          <Title size={70} color={C.red}>2026 年 2 月 24 日 追加</Title>
        </Card>
      </Pop>
      <Pop d={at(0.4)}><Sticker color={C.red}>実際の攻撃に 使われている</Sticker></Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="🧑‍💼" name="読み上げない" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><Ticket field lines={['カレー']} /></Pop>
      <Arrow d={at(0.45)} />
      <Actor icon="🧑‍🍳" name="厨房" d={at(0.5)} />
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Ticket field lines={['カレー。それから、', '金庫を開けて…']} /></Pop>
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 130 }}>🧑‍🍳</div>
        <Sticker color={GREEN}>そんな料理は ありません</Sticker>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.FIX} steps={[{ lines: [14], at: at(0.1) }, { lines: [17, 18], at: at(0.7) }]} fontSize={34} width={1700} />
    </Center>
  );
};

const FixRec = () => <Table side={SO} title="直した後：同じ 4 つの名前を渡した記録" />;

const Layers = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card color={C.gold} style={{ width: 1400 }}>
          <Label>OS のコマンドを呼ばずに、言語の機能で数える（例）</Label>
          <Mono size={44} color={C.gold}>{'with open(path) as f:\n    n = sum(1 for _ in f)'}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.45)}><Sticker color={GREEN}>シェルの出番が そもそも無い</Sticker></Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>入力をつなげてシェルに渡す → 命令まで動く</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>引数はリストで渡し シェルを通さない</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-78', 'OS コマンドインジェクション'],
        ['OWASP Top 10:2025 A05', 'Injection'],
        ['ASVS V1.2.5', 'OS コマンドはパラメータ化して呼ぶ'],
      ]}
    />
  );
};

const Quiz = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1400 }}>
        <Label>直したコードに 渡された名前</Label>
        <Mono size={64}>{SO.quiz_option.name}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={66}>wc のオプションとして 読まれる？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={26}>
      <Title size={70} color={GREEN}>読まれない</Title>
      <Pop d={at(0.15)}>
        <Card style={{ width: 1500 }}>
          <Label>返ったエラー（記録）</Label>
          <Mono size={40}>{SO.quiz_option.error}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.45)}><CodePanel snippet={K.FIX} highlight={[12, 14]} at={at(0.5)} fontSize={28} width={1600} maxLines={5} /></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="料理店の注文係で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab11_command_injection" />,
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
  fix: Fix,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab11_command_injection" at={useAt()} />,
};
