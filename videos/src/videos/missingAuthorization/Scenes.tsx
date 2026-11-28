import { useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, ResultRow, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab14.json';

type Case = { who: string; action: string; params: Record<string, string>; allowed: boolean; result?: unknown; reason?: string; users_left: string[] };
type Side = Record<'admin_export' | 'member_delete' | 'member_export' | 'quiz_role_param', Case>;
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

const ROWS: [string, keyof Side][] = [
  ['管理者が書き出し', 'admin_export'],
  ['会員が削除', 'member_delete'],
  ['会員が書き出し', 'member_export'],
];
const inputOf = (c: Case) => `${c.who}  ${c.action}${c.params.id ? `  id=${c.params.id}` : ''}${c.params.role ? `  role=${c.params.role}` : ''}`;
const resultOf = (c: Case) => {
  if (!c.allowed) return `拒否 ${c.reason}`;
  if (c.action === 'export_users') return `${(c.result as unknown[]).length} 人分を書き出し`;
  return `削除（残り ${c.users_left.length} 人）`;
};
const Row: React.FC<{ what: string; c: Case; d?: number; size?: number }> = ({ what, c, d, size = 32 }) => (
  <ResultRow what={what} input={inputOf(c)} result={resultOf(c)} ok={c.allowed} bad={c.allowed && !c.who.includes('admin')} d={d} size={size} whatWidth={340} />
);

/** ビルの見取り図 */
const Building: React.FC<{ at: (x: number) => number; guard?: boolean; intruder?: boolean }> = ({ at, guard, intruder }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 30, alignItems: 'stretch' }}>
      <Pop>
        <Card style={{ width: 380, textAlign: 'center' }}>
          <Label>入口</Label>
          <div style={{ fontSize: 90 }}>🪪</div>
          <Title size={34}>社員証を確かめる</Title>
        </Card>
      </Pop>
      <Pop d={at(0.1)}>
        <Card style={{ width: 380, textAlign: 'center' }}>
          <Label>事務室</Label>
          <div style={{ fontSize: 90 }}>🗂️</div>
          <Title size={34}>社員なら誰でも</Title>
        </Card>
      </Pop>
      <Pop d={at(0.2)}>
        <Card color={guard ? GREEN : C.red} style={{ width: 440, textAlign: 'center', transform: intruder ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
          <Label color={guard ? GREEN : C.red}>金庫室（役員だけ）</Label>
          <div style={{ fontSize: 90 }}>{guard ? '💂' : '🚪'}</div>
          <Title size={34} color={guard ? GREEN : C.red}>{guard ? '扉の係が役職を確かめる' : '扉に 鍵も係もいない'}</Title>
        </Card>
      </Pop>
    </div>
  );
};

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const c = EX.member_delete;
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1400 }}>
          <Label>ふつうの会員が呼んだ 管理画面の API</Label>
          <Mono size={50}>{`${c.who} → ${c.action}(id=${c.params.id})`}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)} style={{ transform: `translateX(${shake(f, at(0.4), 14, 14)}px)` }}>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>結果（記録）</Label>
          <Mono size={50} color={C.red}>{`carol を削除 → 名簿：${c.users_left.join('・')}`}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={120}>認可チェックの欠如</Title>
      <Pop d={at(0.2)}><Title size={52} color={C.dim}>ログインした ＝ 何でもしてよい？</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-862</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Actor icon="🧑‍💼" name="社員" />
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 140 }}>🏢</div>
        <Title size={40}>入口で 🪪 社員証</Title>
      </Pop>
      <Pop d={at(0.55)}><Sticker color={GREEN}>中に入れる</Sticker></Pop>
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center>
      <Building at={at} guard />
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center>
      <Building at={at} />
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 50, alignItems: 'center' }}>
        <Actor icon="🧑‍🎓" name="新人の社員" />
        <Arrow d={at(0.15)} />
        <Actor icon="🚪" name="金庫室" d={at(0.2)} />
        <Arrow d={at(0.35)} />
        <Actor icon="📁" name="大事な書類" d={at(0.4)} />
      </div>
      <Pop d={at(0.6)} style={{ transform: `translateX(${shake(f, at(0.63), 12, 12)}px)` }}><Sticker color={C.red}>そのまま 持ち出せる</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🏢 ビル', 'アプリ', 'call_admin()'],
    ['🪪 社員証', 'ログイン（認証）', 'session があるか'],
    ['🚪 金庫室', '管理者の機能', 'delete_user・export_users'],
    ['💂 扉の係', '認可のチェック', 'role が admin か'],
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
    <Center row gap={40}>
      <Pop>
        <Card color={GREEN} style={{ width: 640, textAlign: 'center' }}>
          <Label color={GREEN}>認証</Label>
          <Title size={50}>あなたは誰？</Title>
          <Title size={32} color={C.dim}>ログインで確かめた</Title>
        </Card>
      </Pop>
      <Pop d={at(0.35)}>
        <Card color={C.red} style={{ width: 640, textAlign: 'center' }}>
          <Label color={C.red}>認可</Label>
          <Title size={50}>それをしてよい？</Title>
          <Title size={32} color={C.red}>確かめていない</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[23, 24]} at={at(0.3)} fontSize={34} width={1780} />
    </Center>
  );
};

const Step1 = () => {
  const at = useAt();
  const c = EX.admin_export;
  const rows = c.result as { id: string; name: string; email: string }[];
  return (
    <Center gap={24}>
      <Pop><Title size={50} color={C.dim}>① 管理者の alice が 全員を書き出す</Title></Pop>
      <Pop d={at(0.2)}>
        <Card color={GREEN} style={{ width: 1300 }}>
          <Label>返ってきた名簿（記録・作り物）</Label>
          {rows.map((r) => (
            <div key={r.id}><Mono size={40} color={GREEN}>{`${r.id}  ${r.name}  ${r.email}`}</Mono></div>
          ))}
        </Card>
      </Pop>
    </Center>
  );
};

const Step2 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const c = EX.member_delete;
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>② 会員の bob が carol を削除</Title></Pop>
      <Pop d={at(0.15)}><Card style={{ width: 1400 }}><Label>送った操作</Label><Mono size={50}>{inputOf(c)}</Mono></Card></Pop>
      <Arrow d={at(0.4)} down />
      <div style={{ transform: `translateX(${shake(f, at(0.5), 12, 12)}px)` }}>
        <Pop d={at(0.45)}>
          <Card color={C.red} style={{ width: 1400 }}>
            <Label>結果（記録）</Label>
            <Mono size={46} color={C.red}>{`${JSON.stringify(c.result)}  名簿：${c.users_left.join('・')}`}</Mono>
          </Card>
        </Pop>
      </div>
    </Center>
  );
};

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
const Step3 = () => <Table side={EX} title="直す前：3 つの操作を試した記録（名簿は毎回 3 人から）" />;

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2021-39226</Mono></Pop>
      <Pop d={at(0.12)}><Title size={110}>Grafana</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>グラフを見せるソフトの スナップショット機能</Title></Pop>
      <Pop d={at(0.45)} style={{ marginTop: 16 }}><Sticker color={C.red}>特定のパスに 権限の確かめが無い</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="🕵️" name="ログインしていない人" />
      <Arrow d={at(0.15)} />
      <Pop d={at(0.2)}>
        <Card color={C.red} style={{ width: 640 }}>
          <Mono size={36}>/api/snapshots/:key</Mono>
          <div><Mono size={36}>/api/snapshots-delete/:deleteKey</Mono></div>
        </Card>
      </Pop>
      <Arrow d={at(0.4)} />
      <Pop d={at(0.45)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 120 }}>📊</div>
        <Sticker color={C.red}>見られる・消せる</Sticker>
      </Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  return <CvssCard score="7.3" sev="High" at={at} chips={[['AV:N', 'ネットワーク越し'], ['PR:N', 'ログイン不要'], ['UI:N', '誰の操作も不要']]} />;
};

const Kev = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card color={C.red} style={{ width: 1400, textAlign: 'center' }}>
          <Label>CISA の 悪用が確認された脆弱性の一覧</Label>
          <Title size={70} color={C.red}>2022 年 8 月 25 日 追加</Title>
        </Card>
      </Pop>
      <Pop d={at(0.4)}>
        <Card color={GREEN} style={{ width: 1400, textAlign: 'center' }}>
          <Label>直した版</Label>
          <Mono size={54} color={GREEN}>8.1.6 / 7.5.11</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="💂" name="扉の係" />
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)}>
        <Card style={{ width: 520 }}>
          <Label>📋 会社の名簿</Label>
          <Title size={42}>alice：役員</Title>
          <Title size={42}>bob：社員</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 140 }}>🧑‍💼</div>
        <Card color={C.red} style={{ padding: '14px 28px' }}><Title size={40} color={C.red}>「私は役員です」</Title></Card>
      </Pop>
      <Arrow d={at(0.3)} />
      <Pop d={at(0.35)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 140 }}>💂</div>
        <Sticker color={GREEN}>名簿では社員 → 通さない</Sticker>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.FIX} highlight={[24, 25]} at={at(0.2)} fontSize={32} width={1780} />
    </Center>
  );
};

const Deny = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.FIX} highlight={[27, 28]} at={at(0.2)} fontSize={32} width={1780} />
    </Center>
  );
};

const FixRec = () => <Table side={SO} title="直した後：同じ 3 つの操作を試した記録" />;

const Layers = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>画面で ボタンを隠すだけ</Label>
          <Title size={46} color={C.red}>API を直接呼ばれたら 止まらない</Title>
        </Card>
      </Pop>
      <Pop d={at(0.45)}>
        <Card color={GREEN} style={{ width: 1400 }}>
          <Label>サーバーで 操作ごとに確かめる</Label>
          <Title size={46} color={GREEN}>どこから呼ばれても 止まる</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>ログインだけを見る → 誰でも管理者の操作</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>操作ごとに サーバーで役割を確かめる</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-862', '認可チェックの欠如'],
        ['OWASP Top 10:2025 A01', 'Broken Access Control'],
        ['ASVS V8.2.1', '機能レベルのアクセス制御'],
        ['ASVS V8.3.1', '認可はサーバー側で強制する'],
      ]}
    />
  );
};

const Quiz = () => {
  const at = useAt();
  const c = SO.quiz_role_param;
  return (
    <Center gap={36}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1500 }}>
        <Label>直したコードに 届いた操作</Label>
        <Mono size={46}>{`${c.who} → ${c.action}`}</Mono>
        <div><Mono size={46} color={C.red}>{`params = ${JSON.stringify(c.params)}`}</Mono></div>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>通る？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={26}>
      <Title size={70} color={GREEN}>通らない</Title>
      <Row what="role を付けた" c={SO.quiz_role_param} d={at(0.15)} size={34} />
      <Pop d={at(0.45)}><CodePanel snippet={K.FIX} highlight={[24, 25]} at={at(0.5)} fontSize={30} width={1700} maxLines={4} /></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="会社のビルで考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab14_missing_authorization" />,
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
  deny: Deny,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab14_missing_authorization" at={useAt()} />,
};
