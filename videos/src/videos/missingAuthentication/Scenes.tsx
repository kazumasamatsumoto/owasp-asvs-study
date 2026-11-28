import { useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, ResultRow, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab16.json';

type Case = { path: string; who: string; ok: boolean; body?: Record<string, unknown>; error?: string; reason?: string };
type Side = Record<'health' | 'me_anon' | 'env_anon' | 'backup_anon' | 'quiz_env_member', Case>;
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

const ROWS: [string, keyof Side][] = [
  ['生きているか', 'health'],
  ['自分の情報', 'me_anon'],
  ['設定の一覧', 'env_anon'],
  ['DB の写し', 'backup_anon'],
];
const resultOf = (k: keyof Side, c: Case) => {
  if (!c.ok) return c.error!;
  if (k === 'env_anon' || k === 'quiz_env_member') return 'パスワードとキーが返った';
  if (k === 'backup_anon') return '名簿が丸ごと返った';
  return '返った（公開してよい）';
};
const Row: React.FC<{ what: string; k: keyof Side; c: Case; d?: number; size?: number }> = ({ what, k, c, d, size = 32 }) => (
  <ResultRow what={what} input={`${c.who}  ${c.path}`} result={resultOf(k, c)} ok={c.ok && k === 'health'} bad={c.ok && k !== 'health'} d={d} size={size} whatWidth={300} />
);

/** マンションの見取り図 */
const Mansion: React.FC<{ at: (x: number) => number; back: 'open' | 'locked' | 'none' }> = ({ at, back }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
      <Pop>
        <Card color={GREEN} style={{ width: 520, textAlign: 'center' }}>
          <Label color={GREEN}>正面玄関</Label>
          <div style={{ fontSize: 100 }}>🔐</div>
          <Title size={38}>オートロック</Title>
        </Card>
      </Pop>
      {back !== 'none' && (
        <Pop d={at(0.2)}>
          <Card color={back === 'open' ? C.red : GREEN} style={{ width: 560, textAlign: 'center', transform: back === 'open' ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
            <Label color={back === 'open' ? C.red : GREEN}>あとから作った 管理人の裏口</Label>
            <div style={{ fontSize: 100 }}>{back === 'open' ? '🚪' : '🔐'}</div>
            <Title size={38} color={back === 'open' ? C.red : GREEN}>{back === 'open' ? '鍵を 付け忘れた' : '最初から 鍵が付く'}</Title>
            <Title size={30} color={C.dim}>🗝️ 全部屋の合鍵の箱</Title>
          </Card>
        </Pop>
      )}
    </div>
  );
};

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const b = EX.env_anon.body as Record<string, string>;
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1400 }}>
          <Label>ログインせずに開いた</Label>
          <Mono size={60}>{EX.env_anon.path}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)} style={{ transform: `translateX(${shake(f, at(0.4), 14, 14)}px)` }}>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>返ってきた中身（記録・作り物）</Label>
          {Object.entries(b).map(([k, v]) => (
            <div key={k}><Mono size={40} color={C.red}>{`${k}=${v}`}</Mono></div>
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
      <Title size={110}>重要な機能に認証がない</Title>
      <Pop d={at(0.2)}><Title size={52} color={C.dim}>誰が呼んだかを 確かめていない</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-306</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center>
      <Mansion at={at} back="none" />
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="🧹" name="管理人のための 裏口" />
      <Arrow d={at(0.25)} />
      <Actor icon="🗝️" name="全部屋の合鍵の箱" d={at(0.3)} />
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center>
      <Mansion at={at} back="open" />
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 50, alignItems: 'center' }}>
        <Actor icon="🚶" name="通りがかった誰か" />
        <Arrow d={at(0.15)} />
        <Actor icon="🚪" name="鍵の無い裏口" d={at(0.2)} />
        <Arrow d={at(0.35)} />
        <Actor icon="🗝️" name="合鍵の箱" d={at(0.4)} />
      </div>
      <Pop d={at(0.6)} style={{ transform: `translateX(${shake(f, at(0.63), 12, 12)}px)` }}><Sticker color={C.red}>そのまま 持ち出せる</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🔐 正面玄関', 'ログインを確かめる API', '/api/me'],
    ['🚪 管理人の裏口', '運用向けの道', '/internal/env・/internal/backup'],
    ['🗝️ 合鍵の箱', '設定やバックアップ', 'パスワード・API キー・名簿'],
  ];
  return (
    <Center gap={22}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.05 + i * 0.25)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, width: 1600 }}>
            <Card style={{ width: 500, padding: '16px 28px' }}><Title size={42}>{a}</Title></Card>
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
  const paths: [string, boolean][] = [
    ['/api/me', true],
    ['/internal/env', false],
    ['/internal/backup', false],
  ];
  return (
    <Center gap={22}>
      <Pop><Label>道ごとに ログインの確認を足す作り</Label></Pop>
      {paths.map(([p, ok], i) => (
        <Pop key={p} d={at(0.1 + i * 0.15)}>
          <Card color={ok ? GREEN : C.red} style={{ width: 1200, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px' }}>
            <Mono size={44}>{p}</Mono>
            <Title size={40} color={ok ? GREEN : C.red}>{ok ? '✅ 確認あり' : '❌ 足し忘れ'}</Title>
          </Card>
        </Pop>
      ))}
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} steps={[{ lines: [24, 25, 26], at: at(0.15) }, { lines: [28, 29, 30, 31, 32], at: at(0.5) }]} fontSize={30} width={1600} maxLines={14} />
    </Center>
  );
};

const Step = ({ k, title }: { k: 'me_anon' | 'env_anon'; title: string }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const c = EX[k];
  const bad = c.ok;
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>{title}</Title></Pop>
      <Pop d={at(0.15)}><Card style={{ width: 1400 }}><Label>{c.who} で開いた</Label><Mono size={56}>{c.path}</Mono></Card></Pop>
      <Arrow d={at(0.4)} down />
      <div style={{ transform: bad ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
        <Pop d={at(0.45)}>
          <Card color={bad ? C.red : GREEN} style={{ width: 1400 }}>
            <Label>結果（記録）</Label>
            {c.ok ? (
              Object.entries(c.body as Record<string, string>).map(([kk, v]) => (
                <div key={kk}><Mono size={40} color={C.red}>{`${kk}=${v}`}</Mono></div>
              ))
            ) : (
              <Mono size={52} color={GREEN}>{`${c.error}: ${c.reason}`}</Mono>
            )}
          </Card>
        </Pop>
      </div>
    </Center>
  );
};
const Step1 = () => <Step k="me_anon" title="① ログインなしで /api/me" />;
const Step2 = () => <Step k="env_anon" title="② ログインなしで /internal/env" />;

const Table: React.FC<{ side: Side; title: string }> = ({ side, title }) => {
  const at = useAt();
  return (
    <Center gap={18}>
      <Pop><Label>{title}</Label></Pop>
      {ROWS.map(([w, k], i) => (
        <Row key={k} what={w} k={k} c={side[k]} d={at(0.05 + i * 0.14)} />
      ))}
    </Center>
  );
};
const Step3 = () => <Table side={EX} title="直す前：ログインなしで 4 つの道を開いた記録" />;

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2023-27532</Mono></Pop>
      <Pop d={at(0.12)}><Title size={90}>Veeam Backup &amp; Replication</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>バックアップのソフト</Title></Pop>
      <Pop d={at(0.45)} style={{ marginTop: 16 }}><Sticker color={C.red}>Missing Authentication for Critical Function</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="🕵️" name="外の攻撃者" size={130} />
      <Arrow d={at(0.15)} />
      <Actor icon="🗄️" name="構成データベース" d={at(0.2)} size={130} />
      <Arrow d={at(0.35)} />
      <Actor icon="🔑" name="資格情報" d={at(0.4)} size={130} />
      <Arrow d={at(0.55)} />
      <Actor icon="🖥️" name="バックアップの基盤" d={at(0.6)} size={130} />
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  return <CvssCard score="7.5" sev="High" at={at} chips={[['AV:N', 'ネットワーク越し'], ['PR:N', 'ログイン不要'], ['C:H', '情報が大きく漏れる']]} />;
};

const Kev = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card color={C.red} style={{ width: 1400, textAlign: 'center' }}>
          <Label>CISA の 悪用が確認された脆弱性の一覧</Label>
          <Title size={70} color={C.red}>2023 年 8 月 22 日 追加</Title>
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
      <Pop>
        <Card color={GREEN} style={{ width: 560 }}>
          <Label color={GREEN}>📋 鍵を付けない扉の一覧</Label>
          <Title size={42}>郵便受けの前だけ</Title>
        </Card>
      </Pop>
      <Arrow d={at(0.3)} />
      <Pop d={at(0.35)}>
        <Card style={{ width: 560, textAlign: 'center' }}>
          <Title size={42}>それ以外の扉</Title>
          <Title size={60}>🔐 🔐 🔐</Title>
          <Label>最初から 全部 鍵付き</Label>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center>
      <Mansion at={at} back="locked" />
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center gap={24}>
      <Pop><CodePanel snippet={K.PUBLIC} highlight={[27]} at={at(0.1)} fontSize={34} width={1600} /></Pop>
      <Pop d={at(0.35)}><CodePanel snippet={K.FIX} highlight={[35, 36, 37, 38]} at={at(0.45)} fontSize={28} width={1600} maxLines={6} /></Pop>
    </Center>
  );
};

const Admin = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.FIX} highlight={[40, 41]} at={at(0.2)} fontSize={34} width={1700} />
    </Center>
  );
};

const FixRec = () => <Table side={SO} title="直した後：ログインなしで 同じ 4 つの道を開いた記録" />;

const Layers = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="🌐" name="外のネットワーク" />
      <Pop d={at(0.2)}><Title size={80} color={C.red}>✕</Title></Pop>
      <Pop d={at(0.3)}>
        <Card color={GREEN} style={{ width: 640, textAlign: 'center' }}>
          <Label color={GREEN}>社内のネットワークだけ</Label>
          <Mono size={44}>/internal/…</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>道ごとに守りを足す → 足し忘れが出る</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>既定で守り 公開する道だけを決める</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-306', '重要な機能に認証がない'],
        ['OWASP Top 10:2025 A07', 'Authentication Failures'],
        ['ASVS V8.2.1', '機能を使えるのは 権限を持つ人だけ'],
        ['ASVS V13.4.5', '運用・監視の道を 外に出さない'],
      ]}
    />
  );
};

const Quiz = () => {
  const at = useAt();
  const c = SO.quiz_env_member;
  return (
    <Center gap={36}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1400 }}>
        <Label>直したコードで {c.who} が ログインして開いた</Label>
        <Mono size={60}>{c.path}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>見られる？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  const c = SO.quiz_env_member;
  return (
    <Center gap={26}>
      <Title size={70} color={GREEN}>見られない</Title>
      <Pop d={at(0.15)}><Card style={{ width: 1400 }}><Label>結果（記録）</Label><Mono size={48} color={GREEN}>{`${c.error}: ${c.reason}`}</Mono></Card></Pop>
      <Pop d={at(0.45)}><CodePanel snippet={K.FIX} highlight={[40, 41]} at={at(0.5)} fontSize={30} width={1600} maxLines={4} /></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="マンションの裏口で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab16_missing_authentication" />,
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
  admin: Admin,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab16_missing_authentication" at={useAt()} />,
};
