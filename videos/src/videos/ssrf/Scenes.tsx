import { useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, ResultRow, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab12.json';

type Case = { url: string; resolved: string; fetched: boolean; body?: string; reason?: string; went_to: string[] };
type Side = Record<'image' | 'metadata' | 'localhost' | 'decimal' | 'quiz_rebind', Case>;
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

const ROWS: [string, keyof Side][] = [
  ['画像の置き場', 'image'],
  ['メタデータ', 'metadata'],
  ['localhost', 'localhost'],
  ['10 進の数', 'decimal'],
];
const resultOf = (k: keyof Side, c: Case) => {
  if (!c.fetched) return `拒否 ${c.reason}`;
  if (k === 'image') return '画像が届いた';
  if (k === 'metadata') return '鍵が届いた';
  return '管理画面に届いた';
};
const Row: React.FC<{ what: string; k: keyof Side; c: Case; d?: number; size?: number }> = ({ what, k, c, d, size = 32 }) => (
  <ResultRow what={what} input={c.url} result={resultOf(k, c)} ok={c.fetched} bad={c.fetched && k !== 'image'} d={d} size={size} />
);

/** ホテルの見取り図：外の店と、ホテルの中の金庫室 */
const Hotel: React.FC<{ to: 'shop' | 'vault'; at: (x: number) => number }> = ({ to, at }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
      <Pop>
        <Card color={GREEN} style={{ width: 600, textAlign: 'center' }}>
          <Label color={GREEN}>外の店（客も行ける）</Label>
          <div style={{ fontSize: 110 }}>🏪</div>
          <Title size={40}>写真屋</Title>
          {to === 'shop' && <Pop d={at(0.4)}><Sticker color={GREEN}>ここから取る</Sticker></Pop>}
        </Card>
      </Pop>
      <Pop d={at(0.15)}>
        <Card color={C.red} style={{ width: 600, textAlign: 'center', transform: to === 'vault' ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
          <Label color={C.red}>ホテルの中（従業員だけ）</Label>
          <div style={{ fontSize: 110 }}>🔐</div>
          <Title size={40}>金庫室の 鍵の束</Title>
          {to === 'vault' && <Pop d={at(0.45)}><Sticker color={C.red}>ここまで行ってしまう</Sticker></Pop>}
        </Card>
      </Pop>
    </div>
  );
};

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1500 }}>
          <Label>画像の URL として渡したもの</Label>
          <Mono size={50} color={C.red}>{EX.metadata.url}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)} style={{ transform: `translateX(${shake(f, at(0.4), 14, 14)}px)` }}>
        <Card color={C.red} style={{ width: 1500 }}>
          <Label>サーバーが取ってきた中身（記録・作り物）</Label>
          <Mono size={40} color={C.red}>{EX.metadata.body}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={150}>SSRF</Title>
      <Pop d={at(0.2)}><Title size={52} color={C.dim}>サーバーサイド・リクエスト・フォージェリ</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-918</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 150 }}>🙂</div>
        <Card style={{ padding: '14px 28px' }}><Title size={38}>📝 駅前の写真屋で 写真を</Title></Card>
      </Pop>
      <Arrow d={at(0.3)} />
      <Actor icon="🛎️" name="コンシェルジュ" d={at(0.35)} />
      <Arrow d={at(0.5)} />
      <Actor icon="🖼️" name="写真" d={at(0.55)} />
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Actor icon="🛎️" name="コンシェルジュ（従業員）" />
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)}>
        <Card color={C.gold} style={{ width: 620 }}>
          <Title size={42}>🚪 裏の通路</Title>
          <Title size={42}>🔐 金庫室</Title>
          <Label>客は入れないが、従業員は入れる</Label>
        </Card>
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
        <Card color={C.red} style={{ padding: '14px 28px' }}><Title size={38} color={C.red}>📝 ホテルの金庫室の 鍵の束を</Title></Card>
      </Pop>
      <Arrow d={at(0.35)} />
      <Actor icon="🛎️" name="コンシェルジュ" d={at(0.4)} />
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  return (
    <Center>
      <Hotel to="vault" at={at} />
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🛎️ コンシェルジュ', 'サーバー', 'fetch_url()'],
    ['📝 客が書いた住所', 'URL', '利用者の入力'],
    ['🔐 金庫室', '内部のネットワーク', '169.254.169.254・localhost・10.x'],
    ['🔑 鍵の束', 'クラウドの鍵', 'メタデータが返す資格情報'],
  ];
  return (
    <Center gap={22}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.05 + i * 0.2)}>
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
      <Actor icon="😈" name="攻撃者" />
      <Arrow d={at(0.15)} />
      <Actor icon="🖥️" name="サーバー" d={at(0.2)} />
      <Arrow d={at(0.35)} />
      <Pop d={at(0.4)}>
        <Card color={C.red} style={{ width: 520, textAlign: 'center' }}>
          <Label color={C.red}>内部のネットワーク</Label>
          <Title size={40}>外からは 届かない場所</Title>
        </Card>
      </Pop>
      <Pop d={at(0.6)} style={{ position: 'absolute', bottom: 300 }}><Sticker color={C.red} rotate={3}>サーバーが 代わりに取りに行く</Sticker></Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[14, 15]} at={at(0.3)} fontSize={36} width={1700} />
    </Center>
  );
};

const Step = ({ k, title }: { k: 'image' | 'metadata'; title: string }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const c = EX[k];
  const bad = k !== 'image';
  return (
    <Center gap={30}>
      <Pop><Title size={50} color={C.dim}>{title}</Title></Pop>
      <Pop d={at(0.15)}>
        <Card style={{ width: 1500 }}>
          <Label>渡した URL ／ 実際に取りに行った先（記録）</Label>
          <Mono size={44}>{c.url}</Mono>
          <div><Mono size={40} color={C.dim}>{`→ ${c.went_to[0]}`}</Mono></div>
        </Card>
      </Pop>
      <Arrow d={at(0.4)} down />
      <div style={{ transform: bad ? `translateX(${shake(f, at(0.5), 12, 12)}px)` : undefined }}>
        <Pop d={at(0.45)}>
          <Card color={bad ? C.red : GREEN} style={{ width: 1500 }}>
            <Label>返ってきた中身（作り物）</Label>
            <Mono size={40} color={bad ? C.red : GREEN}>{c.body}</Mono>
          </Card>
        </Pop>
      </div>
    </Center>
  );
};
const Step1 = () => <Step k="image" title="① 許可した画像の置き場" />;
const Step2 = () => <Step k="metadata" title="② クラウドのメタデータ" />;

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
const Step3 = () => <Table side={EX} title="直す前：4 つの URL を渡した記録" />;

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2021-26855</Mono></Pop>
      <Pop d={at(0.12)}><Title size={96}>Microsoft Exchange Server</Title></Pop>
      <Pop d={at(0.3)}><Title size={44} color={C.dim}>メールのサーバー</Title></Pop>
      <Pop d={at(0.5)}><Sticker color={C.red}>NVD の分類：CWE-918（SSRF）</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Pop><Card color={C.red} style={{ padding: '20px 30px' }}><Title size={44}>SSRF</Title></Card></Pop>
      <Pop d={at(0.15)}><Title size={70} color={C.fire}>＋</Title></Pop>
      <Pop d={at(0.2)}><Card style={{ padding: '20px 30px' }}><Title size={44}>ほかの弱点</Title></Card></Pop>
      <Arrow d={at(0.35)} />
      <Pop d={at(0.4)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 130 }}>📮</div>
        <Sticker color={C.red}>ログインなしで 乗っ取り</Sticker>
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
      <Pop d={at(0.4)}><Sticker color={C.red}>実際の攻撃に 使われている</Sticker></Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop>
        <Card style={{ width: 460 }}>
          <Label>📋 取りに行ってよい店</Label>
          <Title size={46}>駅前の写真屋</Title>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)}><Card color={C.red} style={{ width: 560, textAlign: 'center' }}><Title size={42}>名簿にない住所</Title><Sticker color={C.red}>行かない</Sticker></Card></Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card style={{ width: 1300, textAlign: 'center' }}>
          <Label>名簿にある「駅前の写真屋」を 地図で引いたら</Label>
          <Title size={50} color={C.red}>🗺️ → ホテルの中の金庫室</Title>
        </Card>
      </Pop>
      <Pop d={at(0.45)}><Sticker color={GREEN}>それでも 行かない</Sticker></Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.ALLOW} highlight={[15, 16]} at={at(0.2)} fontSize={32} width={1780} />
    </Center>
  );
};

const Ip = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.IP} steps={[{ lines: [18, 19, 20], at: at(0.1) }, { lines: [22], at: at(0.6) }]} fontSize={34} width={1780} />
    </Center>
  );
};

const FixRec = () => <Table side={SO} title="直した後：同じ 4 つの URL を渡した記録" />;

const Layers = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Card color={C.gold} style={{ width: 1400 }}><Label>クラウドの設定（例：AWS）</Label><Title size={48}>メタデータは トークン必須（IMDSv2）</Title></Card></Pop>
      <Pop d={at(0.45)}><Card color={C.gold} style={{ width: 1400 }}><Label>ネットワーク</Label><Title size={48}>サーバーから内部への通信を ファイアウォールで絞る</Title></Card></Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>渡された URL にそのまま行く → 内部まで届く</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>許可リストと 引いた IP で確かめる</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-918', 'サーバーサイド・リクエスト・フォージェリ'],
        ['OWASP Top 10:2025 A01', 'Broken Access Control'],
        ['ASVS V1.3.6', 'プロトコル・ドメイン・パス・ポートの許可リスト'],
      ]}
    />
  );
};

const Quiz = () => {
  const at = useAt();
  const c = SO.quiz_rebind;
  return (
    <Center gap={36}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1500 }}>
        <Label>直したコードに 渡された URL（許可したホスト）</Label>
        <Mono size={48} color={GREEN}>{c.url}</Mono>
        <div><Mono size={48} color={C.red}>{`名前を引いたら → ${c.resolved}`}</Mono></div>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>取りに行く？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  const c = SO.quiz_rebind;
  return (
    <Center gap={26}>
      <Title size={70} color={GREEN}>行かない</Title>
      <Pop d={at(0.15)}>
        <Card style={{ width: 1500 }}>
          <Label>記録</Label>
          <Mono size={42}>{`拒否 ${c.reason} ／ 取りに行った先：${c.went_to.length ? c.went_to.join(', ') : 'なし'}`}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.45)}><CodePanel snippet={K.IP} highlight={[19, 20]} at={at(0.5)} fontSize={30} width={1600} maxLines={4} /></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="ホテルのコンシェルジュで考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab12_ssrf" />,
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
  ip: Ip,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab12_ssrf" at={useAt()} />,
};
