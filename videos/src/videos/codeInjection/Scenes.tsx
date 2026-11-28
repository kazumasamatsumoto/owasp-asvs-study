import { useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, ResultRow, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab15.json';

type Case = { expr: string; ok: boolean; value?: string; reason?: string; pwned_created: boolean };
type Side = Record<'normal' | 'read' | 'touch' | 'quiz_pow', Case>;
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

const ROWS: [string, keyof Side][] = [
  ['ふつうの式', 'normal'],
  ['ファイルを読む', 'read'],
  ['ファイルを作る', 'touch'],
];
const resultOf = (c: Case) => {
  if (!c.ok) return `拒否 ${c.reason}`;
  if (c.pwned_created) return 'pwned が作られた';
  if (c.value!.includes('DB_')) return '秘密の中身が返った';
  return `答え ${c.value}`;
};
const isBad = (c: Case) => c.ok && (c.pwned_created || c.value!.includes('DB_'));
const Row: React.FC<{ what: string; c: Case; d?: number; size?: number }> = ({ what, c, d, size = 32 }) => (
  <ResultRow what={what} input={c.expr} result={resultOf(c)} ok={c.ok && !isBad(c)} bad={isBad(c)} d={d} size={size} whatWidth={300} />
);

/** 秘書に渡すメモ */
const Memo: React.FC<{ lines: string[]; evil?: boolean }> = ({ lines, evil }) => (
  <div style={{ width: 460, borderRadius: 12, background: '#f4efe2', border: `6px solid ${evil ? C.red : GREEN}`, padding: '18px 24px', boxShadow: '0 16px 40px #000a' }}>
    <div style={{ fontSize: 26, color: '#555', fontWeight: 700 }}>📝 メモ</div>
    {lines.map((l) => (
      <Title key={l} size={36} color={evil ? C.red : '#222'}>{l}</Title>
    ))}
  </div>
);

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1400 }}>
          <Label>電卓の入力欄</Label>
          <Mono size={56} color={C.red}>{EX.read.expr}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)} style={{ transform: `translateX(${shake(f, at(0.4), 14, 14)}px)` }}>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>表示された答え（記録・作り物）</Label>
          <Mono size={52} color={C.red}>{EX.read.value}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={120}>コードインジェクション</Title>
      <Pop d={at(0.2)}><Mono size={60} color={C.dim}>eval(入力)</Mono></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-94</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Memo lines={['12 × 3 ＋ 4']} /></Pop>
      <Arrow d={at(0.25)} />
      <Actor icon="🧑‍💼" name="秘書" d={at(0.3)} />
      <Arrow d={at(0.5)} />
      <Pop d={at(0.55)}><Card style={{ padding: '18px 30px' }}><Title size={60}>40</Title></Card></Pop>
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="🧑‍💼" name="秘書" />
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)}>
        <Card color={C.red} style={{ width: 680, textAlign: 'center' }}>
          <Title size={44}>メモ ＝ 社長の命令</Title>
          <Label>計算式ではなく、命令として読む</Label>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="😈" name="悪い客" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><Memo evil lines={['金庫の書類を', '読み上げよ']} /></Pop>
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 50, alignItems: 'center' }}>
        <Actor icon="🧑‍💼" name="命令どおり" />
        <Arrow d={at(0.15)} />
        <Actor icon="🗄️" name="金庫の書類" d={at(0.2)} />
        <Arrow d={at(0.35)} />
        <Actor icon="📢" name="読み上げる" d={at(0.4)} />
      </div>
      <Pop d={at(0.6)} style={{ transform: `translateX(${shake(f, at(0.63), 12, 12)}px)` }}><Sticker color={C.red}>悪い客に 聞こえてしまう</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🧑‍💼 秘書', 'サーバーの eval', 'calc()'],
    ['📝 メモ', '入力欄の文字', '利用者が書ける'],
    ['📢 命令として読む', 'コードとして実行', 'Python が何でも動かす'],
  ];
  return (
    <Center gap={22}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.05 + i * 0.25)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, width: 1600 }}>
            <Card style={{ width: 540, padding: '16px 28px' }}><Title size={42}>{a}</Title></Card>
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
    <Center row gap={40}>
      <Pop>
        <Card color={GREEN} style={{ width: 640, textAlign: 'center' }}>
          <Label color={GREEN}>想定した入力</Label>
          <Mono size={50}>1 + 2 * 3</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.35)}>
        <Card color={C.red} style={{ width: 760, textAlign: 'center' }}>
          <Label color={C.red}>実際に届きうる入力</Label>
          <Mono size={40} color={C.red}>open(&quot;secret.env&quot;).read()</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[10]} at={at(0.3)} fontSize={40} width={1700} />
    </Center>
  );
};

const Step = ({ k, title }: { k: 'normal' | 'read'; title: string }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const c = EX[k];
  const bad = k !== 'normal';
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>{title}</Title></Pop>
      <Pop d={at(0.15)}><Card style={{ width: 1400 }}><Label>入力</Label><Mono size={54}>{c.expr}</Mono></Card></Pop>
      <Arrow d={at(0.4)} down />
      <div style={{ transform: bad ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
        <Pop d={at(0.45)}>
          <Card color={bad ? C.red : GREEN} style={{ width: 1400 }}>
            <Label>返ってきた値（記録）</Label>
            <Mono size={52} color={bad ? C.red : GREEN}>{c.value}</Mono>
          </Card>
        </Pop>
      </div>
    </Center>
  );
};
const Step1 = () => <Step k="normal" title="① ふつうの計算式" />;
const Step2 = () => <Step k="read" title="② ファイルを読むコード" />;

const Table: React.FC<{ side: Side; title: string }> = ({ side, title }) => {
  const at = useAt();
  return (
    <Center gap={18}>
      <Pop><Label>{title}</Label></Pop>
      {ROWS.map(([w, k], i) => (
        <Row key={k} what={w} c={side[k]} d={at(0.05 + i * 0.16)} />
      ))}
    </Center>
  );
};
const Step3 = () => <Table side={EX} title="直す前：3 つの入力を試した記録" />;

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2025-3248</Mono></Pop>
      <Pop d={at(0.12)}><Title size={110}>Langflow</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>AI の処理の流れを組み立てるソフト</Title></Pop>
      <Pop d={at(0.45)} style={{ marginTop: 16 }}><Mono size={48} color={C.red}>/api/v1/validate/code</Mono></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="😈" name="ログインしていない攻撃者" size={130} />
      <Arrow d={at(0.15)} />
      <Actor icon="📨" name="細工した要求" d={at(0.2)} size={130} />
      <Arrow d={at(0.4)} />
      <Pop d={at(0.45)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 120 }}>🖥️</div>
        <Sticker color={C.red}>好きなコードが動く</Sticker>
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
          <Title size={70} color={C.red}>2025 年 5 月 5 日 追加</Title>
        </Card>
      </Pop>
      <Pop d={at(0.4)}>
        <Card color={GREEN} style={{ width: 1400, textAlign: 'center' }}>
          <Label>直した版</Label>
          <Mono size={54} color={GREEN}>1.3.0</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="🧑‍💼" name="秘書" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}>
        <Card color={GREEN} style={{ width: 980, textAlign: 'center' }}>
          <Label color={GREEN}>読むのは これだけ</Label>
          <Mono size={54}>0-9  .  +  -  ×  ÷  ( )</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Memo evil lines={['金庫の書類を', '読み上げよ']} /></Pop>
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 130 }}>🧑‍💼</div>
        <Sticker color={GREEN}>計算式ではない → 計算しない</Sticker>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.CALC} highlight={[28, 29]} at={at(0.2)} fontSize={34} width={1700} />
    </Center>
  );
};

const Tree = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.TREE} steps={[{ lines: [14, 16, 18], at: at(0.05) }, { lines: [20], at: at(0.6) }]} fontSize={32} width={1780} />
    </Center>
  );
};

const FixRec = () => <Table side={SO} title="直した後：同じ 3 つの入力を試した記録" />;

const Layers = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>よくある「直したつもり」</Label>
          <Mono size={46} color={C.red}>{'eval(expr, {"__builtins__": {}})'}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.45)}><Sticker color={C.red}>すり抜ける方法が 知られている</Sticker></Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>入力をコードとして実行 → 何でも動かされる</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>式は自分で読み 決めた形だけ計算</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-94', 'コードインジェクション'],
        ['OWASP Top 10:2025 A05', 'Injection'],
        ['ASVS V1.3.2', 'eval() などの動的なコード実行を使わない'],
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
        <Label>直した電卓に 入れた式</Label>
        <Mono size={70}>{SO.quiz_pow.expr}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>答えは出る？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={26}>
      <Title size={70} color={GREEN}>出ない</Title>
      <Row what="べき乗" c={SO.quiz_pow} d={at(0.15)} size={34} />
      <Pop d={at(0.45)}><CodePanel snippet={K.TREE} highlight={[16]} at={at(0.5)} fontSize={30} width={1700} maxLines={4} /></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="計算係の秘書で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab15_code_injection" />,
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
  tree: Tree,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab15_code_injection" at={useAt()} />,
};
