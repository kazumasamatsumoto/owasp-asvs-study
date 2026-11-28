import { useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, ResultRow, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab10.json';

type Case = { name: string; read: boolean; content?: string; reason?: string };
type Side = Record<'normal' | 'parent' | 'inout' | 'absolute' | 'quiz_inside', Case>;
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

const ROWS: [string, keyof Side][] = [
  ['ふつうの資料', 'normal'],
  ['1 つ上の階層', 'parent'],
  ['入ってから外へ', 'inout'],
  ['絶対パス', 'absolute'],
];
const Row: React.FC<{ what: string; c: Case; d?: number; size?: number }> = ({ what, c, d, size = 32 }) => (
  <ResultRow
    what={what}
    input={c.name}
    result={c.read ? (c.content!.startsWith('DB_') ? '読めた（秘密の中身）' : `読めた「${c.content}」`) : `拒否 ${c.reason}`}
    ok={c.read}
    bad={c.read && c.content!.startsWith('DB_')}
    d={d}
    size={size}
  />
);

/** 書庫の見取り図：書庫（中）と事務室の金庫（外） */
const Floor: React.FC<{ path?: 'shelf' | 'safe' | 'none'; d?: number; at: (x: number) => number }> = ({ path = 'none', at }) => {
  const f = useCurrentFrame();
  
  return (
    <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
      <Pop>
        <Card color={GREEN} style={{ width: 620, textAlign: 'center' }}>
          <Label color={GREEN}>書庫（資料の置き場所）</Label>
          <div style={{ fontSize: 110 }}>📚</div>
          <Title size={40}>3 番の棚</Title>
          {path === 'shelf' && <Pop d={at(0.4)}><Sticker color={GREEN}>ここから取る</Sticker></Pop>}
        </Card>
      </Pop>
      <Pop d={at(0.15)}>
        <Card color={C.red} style={{ width: 620, textAlign: 'center', transform: path === 'safe' ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
          <Label color={C.red}>隣の事務室（置き場所の外）</Label>
          <div style={{ fontSize: 110 }}>🗄️</div>
          <Title size={40}>金庫の書類</Title>
          {path === 'safe' && <Pop d={at(0.45)}><Sticker color={C.red}>ここまで行ってしまう</Sticker></Pop>}
        </Card>
      </Pop>
    </div>
  );
};

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <Pop>
        <Card style={{ width: 1400 }}>
          <Label>資料の名前</Label>
          <Mono size={64}>
            <span style={{ color: C.red }}>../</span>secret.env
          </Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)} style={{ transform: `translateX(${shake(f, at(0.4), 14, 14)}px)` }}>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>読めた中身（記録）</Label>
          <Mono size={56} color={C.red}>{EX.parent.content}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={130}>パストラバーサル</Title>
      <Pop d={at(0.2)}><Mono size={60} color={C.dim}>../../</Mono></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-22</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Pop style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 150 }}>🙂</div>
        <Card style={{ padding: '14px 28px' }}><Title size={40}>📝 書庫の 3 番の棚</Title></Card>
      </Pop>
      <Arrow d={at(0.3)} />
      <Actor icon="🧑‍💼" name="書庫係" d={at(0.35)} />
      <Arrow d={at(0.5)} />
      <Actor icon="📘" name="本" d={at(0.55)} />
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center>
      <Floor path="shelf" at={at} />
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 150 }}>😈</div>
        <Card color={C.red} style={{ padding: '14px 28px' }}><Title size={40} color={C.red}>📝 書庫を出て、隣の事務室の金庫</Title></Card>
      </Pop>
      <Arrow d={at(0.35)} />
      <Actor icon="🧑‍💼" name="書庫係" d={at(0.4)} />
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  return (
    <Center>
      <Floor path="safe" at={at} />
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🧑‍💼 書庫係', 'サーバー', 'read_document()'],
    ['📚 書庫', '資料の置き場所', 'docs/'],
    ['📝 紙に書いた場所', 'ファイルの名前', 'manual.txt'],
    ['🚪 書庫を出て', '../', '1 つ上の階層へ'],
  ];
  return (
    <Center gap={22}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.05 + i * 0.2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, width: 1600 }}>
            <Card style={{ width: 520, padding: '16px 28px' }}><Title size={44}>{a}</Title></Card>
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
          <Label>置き場所 ＋ 渡された名前</Label>
          <Mono size={50}>
            docs/ + <span style={{ color: C.red }}>../secret.env</span>
          </Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)}>
        <Card color={C.red} style={{ width: 1500 }}>
          <Label>実際に開く場所</Label>
          <Mono size={50} color={C.red}>docs/../secret.env → secret.env（置き場所の外）</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.6)}><Sticker color={C.red} rotate={3}>そのまま つなげて開く</Sticker></Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[12, 13]} at={at(0.3)} fontSize={40} width={1700} />
    </Center>
  );
};

const Step = ({ k, title }: { k: 'normal' | 'parent'; title: string }) => {
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
          <Mono size={56}>{c.name}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.4)} down />
      <div style={{ transform: bad ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
        <Pop d={at(0.45)}>
          <Card color={bad ? C.red : GREEN} style={{ width: 1400 }}>
            <Label>読めた中身（記録）</Label>
            <Mono size={52} color={bad ? C.red : GREEN}>{c.content}</Mono>
          </Card>
        </Pop>
      </div>
    </Center>
  );
};
const Step1 = () => <Step k="normal" title="① ふつうの資料" />;
const Step2 = () => <Step k="parent" title="② 1 つ上の階層" />;

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
      <Pop><Mono size={64} color={C.gold}>CVE-2021-41773</Mono></Pop>
      <Pop d={at(0.12)}><Title size={96}>Apache HTTP Server 2.4.49</Title></Pop>
      <Pop d={at(0.3)}><Title size={44} color={C.dim}>Web サーバー。パスを整える処理を 変えた版</Title></Pop>
      <Pop d={at(0.5)}><Sticker color={C.red}>決めた場所の外に出られた</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1400, textAlign: 'center' }}>
          <Label>ふつうのドット</Label>
          <Mono size={60}>../</Mono>
          <Title size={40} color={GREEN}>チェックで止まる</Title>
        </Card>
      </Pop>
      <Pop d={at(0.3)}>
        <Card color={C.red} style={{ width: 1400, textAlign: 'center' }}>
          <Label>ドットを文字コードで書く</Label>
          <Mono size={60} color={C.red}>.%2e/</Mono>
          <Title size={40} color={C.red}>すり抜けた（設定によってはコードの実行にも）</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  return <CvssCard score="9.8" sev="Critical" at={at} chips={[['AV:N', 'ネットワーク越し'], ['PR:N', 'ログイン不要'], ['UI:N', '誰の操作も不要']]} />;
};

const Kev = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card color={C.red} style={{ width: 1400, textAlign: 'center' }}>
          <Label>CISA の 悪用が確認された脆弱性の一覧</Label>
          <Title size={70} color={C.red}>2021 年 11 月 3 日 追加</Title>
        </Card>
      </Pop>
      <Pop d={at(0.4)}>
        <Card style={{ width: 1400, textAlign: 'center' }}>
          <Label>2.4.50 の修正は不完全</Label>
          <Mono size={54} color={C.gold}>→ CVE-2021-42013</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 140 }}>🗺️</div>
        <Card style={{ padding: '14px 28px' }}><Title size={40}>まず地図で 道順をたどる</Title></Card>
      </Pop>
      <Arrow d={at(0.3)} />
      <Pop d={at(0.35)}>
        <Card color={GREEN} style={{ width: 560, textAlign: 'center' }}>
          <Title size={46}>行き先は 書庫の中？</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card color={C.red} style={{ width: 1300, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title size={44}>行き先が 金庫</Title>
          <Sticker color={C.red}>取りに行かない</Sticker>
        </Card>
      </Pop>
      <Pop d={at(0.4)}>
        <Card color={GREEN} style={{ width: 1300, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title size={44}>遠回りでも 書庫の中</Title>
          <Sticker color={GREEN}>取ってくる</Sticker>
        </Card>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.NAME} highlight={[12, 13]} at={at(0.2)} fontSize={38} width={1700} />
    </Center>
  );
};

const Resolve = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.RESOLVE} steps={[{ lines: [15], at: at(0.1) }, { lines: [16, 17], at: at(0.5) }]} fontSize={38} width={1700} />
    </Center>
  );
};

const FixRec = () => <Table side={SO} title="直した後：同じ 4 つの名前を渡した記録" />;

const Layers = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>利用者に 名前を書かせる</Label>
          <Mono size={46} color={C.red}>/download?name=../secret.env</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.4)}>
        <Card color={GREEN} style={{ width: 1400 }}>
          <Label>番号だけを選ばせ、名前はサーバーが決める</Label>
          <Mono size={46} color={GREEN}>/download?id=42 → docs/report-42.pdf</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>名前をそのままつなげる → 外のファイルが読まれる</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>解決してから 中にあるかを確かめる</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-22', 'パストラバーサル'],
        ['OWASP Top 10:2025 A01', 'Broken Access Control'],
        ['ASVS V5.3.2', '利用者のファイル名をそのままパスに使わない'],
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
        <Mono size={60}>
          reports/<span style={{ color: C.red }}>../</span>manual.txt
        </Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>読める？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={26}>
      <Title size={70} color={GREEN}>読める</Title>
      <Row what="中に留まる" c={SO.quiz_inside} d={at(0.15)} size={36} />
      <Pop d={at(0.45)}>
        <Card style={{ width: 1400, textAlign: 'center' }}>
          <Mono size={46}>docs/reports/../manual.txt → docs/manual.txt</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="図書館の書庫で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab10_path_traversal" />,
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
  resolve: Resolve,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab10_path_traversal" at={useAt()} />,
};
