import { useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, ResultRow, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab09.json';

type Case = { method: string; origin: string | null; form: Record<string, string>; sent: boolean; result?: { from: string; to: string; amount: number }; reason?: string };
type Side = Record<'legit' | 'evil_form' | 'evil_img' | 'evil_guess' | 'quiz_get', Case>;
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

const yen = (n: number) => `${n.toLocaleString('ja-JP')} 円`;
const ROWS: [string, keyof Side][] = [
  ['銀行の正しいフォーム', 'legit'],
  ['攻撃者の隠しフォーム', 'evil_form'],
  ['攻撃者の画像タグ', 'evil_img'],
  ['当て推量のトークン', 'evil_guess'],
];
const inputOf = (c: Case) => `${c.method}  Origin: ${c.origin ?? '（なし）'}  token: ${c.form.csrf_token ?? '（なし）'}`;
const resultOf = (c: Case) => (c.sent ? `送金 ${yen(c.result!.amount)}` : `拒否 ${c.reason}`);
const Row: React.FC<{ what: string; c: Case; d?: number; size?: number }> = ({ what, c, d, size = 30 }) => (
  <ResultRow what={what} input={inputOf(c)} result={resultOf(c)} ok={c.sent} bad={c.sent && c.result?.to === 'mallory'} d={d} size={size} whatWidth={380} />
);

/** 封筒 */
const Envelope: React.FC<{ text: string; evil?: boolean; word?: string }> = ({ text, evil, word }) => (
  <div style={{ width: 340, height: 210, borderRadius: 12, background: '#f4efe2', border: `6px solid ${evil ? C.red : GREEN}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 40px #000a' }}>
    <div style={{ fontSize: 60 }}>✉️</div>
    <Title size={36} color={evil ? C.red : '#222'}>{text}</Title>
    {word && <Title size={28} color="#555">{word}</Title>}
  </div>
);

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center row gap={50}>
      <Actor icon="🌐" name="知らないサイト" />
      <Arrow d={at(0.15)} />
      <Actor icon="🏦" name="ログイン中の銀行" d={at(0.2)} />
      <Pop d={at(0.5)} style={{ transform: `translateX(${shake(f, at(0.55), 14, 14)}px)` }}>
        <Sticker color={C.red}>{`${yen(EX.evil_form.result!.amount)} 送金`}</Sticker>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={150}>CSRF</Title>
      <Pop d={at(0.2)}><Title size={56} color={C.dim}>クロスサイト・リクエスト・フォージェリ</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-352</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Actor icon="🧑‍💼" name="社員（🪪 社員証）" />
      <Arrow d={at(0.3)} />
      <Actor icon="🛎️" name="受付" d={at(0.35)} />
      <Pop d={at(0.6)}><Sticker color={GREEN}>何でも処理</Sticker></Pop>
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="😈" name="悪い人" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><Envelope text="受付に出しておいて" evil /></Pop>
      <Arrow d={at(0.45)} />
      <Actor icon="🧑‍💼" name="社員" d={at(0.5)} />
      <Pop d={at(0.7)}><Card color={C.red} style={{ padding: '14px 24px' }}><Title size={34} color={C.red}>中身：送金の依頼書</Title></Card></Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="🧑‍💼" name="中身を知らない社員" />
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Envelope text="送金の依頼書" evil />
        <Title size={36}>＋ 🪪 社員証</Title>
      </Pop>
      <Arrow d={at(0.55)} />
      <Actor icon="🛎️" name="受付" d={at(0.6)} />
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 50, alignItems: 'center' }}>
        <Actor icon="🛎️" name="受付" />
        <Pop d={at(0.15)}><Card><Title size={44}>🪪 社員証 → OK</Title></Card></Pop>
        <Arrow d={at(0.3)} />
        <Actor icon="💴" name="送金" d={at(0.35)} />
      </div>
      <Pop d={at(0.6)} style={{ transform: `translateX(${shake(f, at(0.63), 12, 12)}px)` }}><Sticker color={C.red}>書いたのが誰かは 見ていない</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🛎️ 受付', 'サーバー', 'transfer()'],
    ['🪪 社員証', 'Cookie', 'ブラウザが自動で付ける'],
    ['🧑‍💼 社員', 'ブラウザ', '言われたとおりに要求を送る'],
    ['😈 封筒を渡す人', '攻撃者のサイト', '隠しフォーム・画像タグ'],
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
          <Label>攻撃者のサイトから出た要求（記録）</Label>
          <Mono size={42}>{`POST /transfer   Origin: ${EX.evil_form.origin}`}</Mono>
          <div><Mono size={42} color={GREEN}>Cookie: session=（alice のセッション）</Mono></div>
        </Card>
      </Pop>
      <Pop d={at(0.4)}><Sticker color={C.red} rotate={3}>Cookie は 自動で付く</Sticker></Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[21, 22, 24, 25]} at={at(0.3)} fontSize={34} width={1750} />
    </Center>
  );
};

const Step = ({ k, title }: { k: 'legit' | 'evil_form'; title: string }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const c = EX[k];
  const bad = k !== 'legit';
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>{title}</Title></Pop>
      <Pop d={at(0.15)}>
        <Card style={{ width: 1500 }}>
          <Label>送ったもの</Label>
          <Mono size={40}>{`${c.method}  Origin: ${c.origin}`}</Mono>
          <div><Mono size={40} color={C.dim}>{`to=${c.form.to}  amount=${c.form.amount}  csrf_token=${c.form.csrf_token ?? '（なし）'}`}</Mono></div>
        </Card>
      </Pop>
      <Arrow d={at(0.4)} down />
      <div style={{ transform: bad ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
        <Pop d={at(0.45)}>
          <Card color={bad ? C.red : GREEN} style={{ width: 1500 }}>
            <Label>結果（記録）</Label>
            <Mono size={40} color={bad ? C.red : GREEN}>{JSON.stringify(c.result)}</Mono>
          </Card>
        </Pop>
      </div>
    </Center>
  );
};
const Step1 = () => <Step k="legit" title="① 銀行のサイトの 正しいフォーム" />;
const Step2 = () => <Step k="evil_form" title="② 攻撃者のサイトの 隠しフォーム" />;

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
const Step3 = () => <Table side={EX} title="直す前：4 つの要求を送った記録（どれも alice のセッション付き）" />;

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2023-2533</Mono></Pop>
      <Pop d={at(0.12)}><Title size={100}>PaperCut NG / MF</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>印刷を管理するソフトの 管理画面</Title></Pop>
      <Pop d={at(0.45)}><Sticker color={C.red}>CSRF</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="🔗" name="細工したリンク" />
      <Arrow d={at(0.15)} />
      <Actor icon="🧑‍💻" name="ログイン中の管理者" d={at(0.2)} />
      <Arrow d={at(0.4)} />
      <Pop d={at(0.45)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 130 }}>🖨️</div>
        <Sticker color={C.red}>設定の変更・コードの実行</Sticker>
      </Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  return <CvssCard score="8.8" sev="High" at={at} chips={[['AV:N', 'ネットワーク越し'], ['PR:N', '攻撃者のログイン不要'], ['UI:R', '管理者がリンクを開く']]} />;
};

const Kev = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card color={C.red} style={{ width: 1400, textAlign: 'center' }}>
          <Label>CISA の 悪用が確認された脆弱性の一覧</Label>
          <Title size={70} color={C.red}>2025 年 7 月 28 日 追加</Title>
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
      <Actor icon="🛎️" name="受付" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><Envelope text="送金の依頼書" word="合言葉：7f3k…" /></Pop>
      <Pop d={at(0.5)}>
        <Card color={GREEN} style={{ width: 420 }}>
          <Title size={38}>✅ 合言葉</Title>
          <Title size={38}>✅ どの部署から</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="😈" name="悪い人の封筒" />
      <Arrow d={at(0.15)} />
      <Pop d={at(0.2)}><Envelope text="送金の依頼書" word="合言葉：？" evil /></Pop>
      <Arrow d={at(0.4)} />
      <Pop d={at(0.45)} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 140 }}>🛎️</div>
        <Sticker color={GREEN}>送金しない</Sticker>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.METHOD} steps={[{ lines: [25, 26], at: at(0.12) }, { lines: [28, 29], at: at(0.5) }]} fontSize={34} width={1750} />
    </Center>
  );
};

const Token = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.TOKEN} highlight={[31, 32, 33]} at={at(0.2)} fontSize={34} width={1750} />
    </Center>
  );
};

const FixRec = () => <Table side={SO} title="直した後：同じ 4 つの要求を送った記録" />;

const Layers = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Card color={C.gold} style={{ width: 1500 }}><Label>本番では</Label><Title size={52}>フレームワークの CSRF 対策を使う</Title></Card></Pop>
      <Pop d={at(0.45)}><Card color={C.gold} style={{ width: 1500, textAlign: 'center' }}><Label>セッションの Cookie</Label><Mono size={38} color={C.gold}>Set-Cookie: session=…; SameSite=Lax; Secure; HttpOnly</Mono></Card></Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>Cookie だけで信じる → ほかのサイトから操作される</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>POST ・ Origin ・ CSRF トークンで確かめる</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-352', 'クロスサイト・リクエスト・フォージェリ'],
        ['OWASP Top 10:2025 A01', 'Broken Access Control'],
        ['ASVS V3.5.1', 'アプリ自身からの要求かを確かめる'],
        ['ASVS V3.5.3', '機密機能は GET で受けない'],
      ]}
    />
  );
};

const Quiz = () => {
  const at = useAt();
  const c = SO.quiz_get;
  return (
    <Center gap={36}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1500 }}>
        <Label>直したコードに 届いた要求</Label>
        <Mono size={46}>{`${c.method}  Origin: ${c.origin}`}</Mono>
        <div><Mono size={46} color={GREEN}>{`csrf_token=${c.form.csrf_token}`}</Mono></div>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>送金される？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={22}>
      <Title size={70} color={GREEN}>送金されない</Title>
      <Row what="GET で来た" c={SO.quiz_get} d={at(0.15)} size={34} />
      <Pop d={at(0.45)}><CodePanel snippet={K.METHOD} highlight={[25, 26]} at={at(0.5)} fontSize={30} width={1500} maxLines={3} /></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="会社の受付で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab09_csrf" />,
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
  token: Token,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab09_csrf" at={useAt()} />,
};
