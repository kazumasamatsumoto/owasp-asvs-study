import { useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, ResultRow, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab13.json';

type Case = { cookie_head: string; loaded: boolean; cart?: { items: unknown[] }; reason?: string; pwned_created: boolean };
type Side = Record<'normal' | 'evil' | 'quiz_negative', Case>;
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

const resultOf = (c: Case) => (c.pwned_created ? 'pwned が作られた' : c.loaded ? '読めた（A1 × 2）' : `拒否 ${c.reason}`);
const Row: React.FC<{ what: string; c: Case; d?: number; size?: number }> = ({ what, c, d, size = 32 }) => (
  <ResultRow what={what} input={c.cookie_head} result={resultOf(c)} ok={c.loaded && !c.pwned_created} bad={c.pwned_created} d={d} size={size} whatWidth={300} />
);

/** 箱と中の紙 */
const Box: React.FC<{ paper: string[]; evil?: boolean; title?: string }> = ({ paper, evil, title = '📄 組み立て説明書' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
    <div style={{ fontSize: 100 }}>📦</div>
    <div style={{ width: 440, borderRadius: 12, background: '#f4efe2', border: `6px solid ${evil ? C.red : GREEN}`, padding: '14px 22px', boxShadow: '0 16px 40px #000a' }}>
      <div style={{ fontSize: 26, color: '#555', fontWeight: 700 }}>{title}</div>
      {paper.map((l, i) => (
        <Title key={l} size={30} color={evil && i === paper.length - 1 ? C.red : '#222'}>{l}</Title>
      ))}
    </div>
  </div>
);

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1400 }}>
          <Label>送ったカートの Cookie（先頭だけ）</Label>
          <Mono size={52} color={C.red}>{EX.evil.cookie_head}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)} style={{ transform: `translateX(${shake(f, at(0.4), 14, 14)}px)` }}>
        <Card color={C.red} style={{ width: 1400, textAlign: 'center' }}>
          <Label>サーバーが読み戻した結果（記録）</Label>
          <Title size={60} color={C.red}>pwned というファイルが作られた</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={110}>安全でないデシリアライズ</Title>
      <Pop d={at(0.2)}><Mono size={56} color={C.dim}>pickle.loads(届いたデータ)</Mono></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-502</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Box paper={['① 脚を 4 本付ける', '② 天板をのせる']} /></Pop>
      <Arrow d={at(0.3)} />
      <Actor icon="🧑‍🔧" name="職人" d={at(0.35)} />
      <Arrow d={at(0.5)} />
      <Actor icon="🪑" name="家具" d={at(0.55)} />
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Actor icon="🧑‍🔧" name="職人" />
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)}>
        <Card color={C.gold} style={{ width: 640, textAlign: 'center' }}>
          <Title size={44}>書かれた作業を</Title>
          <Title size={44}>全部 そのままこなす</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="😈" name="悪い客の箱" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><Box evil paper={['① 脚を 4 本付ける', '⓪ その前に 裏口の鍵を開けておけ']} /></Pop>
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 50, alignItems: 'center' }}>
        <Actor icon="🧑‍🔧" name="説明書どおり" />
        <Arrow d={at(0.15)} />
        <Actor icon="🚪" name="裏口の鍵が開く" d={at(0.2)} />
        <Arrow d={at(0.35)} />
        <Actor icon="🪑" name="（家具はまだ）" d={at(0.4)} />
      </div>
      <Pop d={at(0.6)} style={{ transform: `translateX(${shake(f, at(0.63), 12, 12)}px)` }}><Sticker color={C.red}>組み立てる前に もう手遅れ</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🧑‍🔧 職人', 'pickle', 'pickle.loads()'],
    ['📄 説明書', 'Cookie のバイト列', 'カートを直列化したもの'],
    ['🚪 鍵を開ける作業', '攻撃者のコード', '読み戻すときに動く'],
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
        <Card color={C.red} style={{ width: 640, textAlign: 'center' }}>
          <Label color={C.red}>pickle</Label>
          <Title size={44}>データ ＋ 命令</Title>
          <Title size={32} color={C.dim}>読み戻すと 命令が動く</Title>
        </Card>
      </Pop>
      <Pop d={at(0.35)}>
        <Card color={GREEN} style={{ width: 640, textAlign: 'center' }}>
          <Label color={GREEN}>JSON</Label>
          <Title size={44}>データだけ</Title>
          <Title size={32} color={C.dim}>文字・数・リスト・辞書</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[16]} at={at(0.3)} fontSize={34} width={1780} />
    </Center>
  );
};

const Step1 = () => {
  const at = useAt();
  const c = EX.normal;
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>① ふつうのカート</Title></Pop>
      <Pop d={at(0.15)}><Card style={{ width: 1400 }}><Label>Cookie（先頭だけ）</Label><Mono size={50}>{c.cookie_head}</Mono></Card></Pop>
      <Arrow d={at(0.4)} down />
      <Pop d={at(0.45)}><Card color={GREEN} style={{ width: 1400 }}><Label>読み戻した中身（記録）</Label><Mono size={46} color={GREEN}>{JSON.stringify(c.cart)}</Mono></Card></Pop>
    </Center>
  );
};

const Step2 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const c = EX.evil;
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>② 細工した Cookie</Title></Pop>
      <Pop d={at(0.15)}><Card style={{ width: 1400 }}><Label>Cookie（先頭だけ）</Label><Mono size={50} color={C.red}>{c.cookie_head}</Mono></Card></Pop>
      <Arrow d={at(0.4)} down />
      <div style={{ transform: `translateX(${shake(f, at(0.5), 12, 12)}px)` }}>
        <Pop d={at(0.45)}>
          <Card color={C.red} style={{ width: 1400 }}>
            <Label>読み戻した結果（記録）</Label>
            <Title size={52} color={C.red}>{`pwned が作られた：${c.pwned_created ? 'はい' : 'いいえ'}`}</Title>
          </Card>
        </Pop>
      </div>
    </Center>
  );
};

const Step3 = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Card color={C.red} style={{ width: 1300, textAlign: 'center' }}><Title size={52}>ファイルを作れる</Title></Card></Pop>
      <Arrow d={at(0.25)} down />
      <Pop d={at(0.3)}><Card color={C.red} style={{ width: 1300, textAlign: 'center' }}><Title size={52}>＝ 好きな命令を動かせる</Title></Card></Pop>
      <Pop d={at(0.6)}><Sticker color={C.red}>読み戻す処理が 入口になる</Sticker></Pop>
    </Center>
  );
};

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2023-46604</Mono></Pop>
      <Pop d={at(0.12)}><Title size={110}>Apache ActiveMQ</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>メッセージを配るソフト</Title></Pop>
      <Pop d={at(0.45)} style={{ marginTop: 20 }}><Sticker color={C.red}>届いたデータの型を細工 → 好きなクラスを作らせる</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="😈" name="攻撃者" />
      <Arrow d={at(0.15)} />
      <Actor icon="📨" name="細工したデータ" d={at(0.2)} />
      <Arrow d={at(0.4)} />
      <Pop d={at(0.45)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 130 }}>🖥️</div>
        <Sticker color={C.red}>シェルのコマンドが動く</Sticker>
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
          <Title size={70} color={C.red}>2023 年 11 月 2 日 追加</Title>
        </Card>
      </Pop>
      <Pop d={at(0.4)}>
        <Card color={GREEN} style={{ width: 1400, textAlign: 'center' }}>
          <Label>直した版</Label>
          <Mono size={50} color={GREEN}>5.15.16 / 5.16.7 / 5.17.6 / 5.18.3</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Box title="📋 部品表" paper={['脚 × 4', '天板 × 1']} /></Pop>
      <Arrow d={at(0.3)} />
      <Actor icon="🧑‍🔧" name="部品表だけ 受け取る" d={at(0.35)} />
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Box evil title="📋 部品表" paper={['脚 × 4', '天板 × -3']} /></Pop>
      <Arrow d={at(0.3)} />
      <Pop d={at(0.35)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 130 }}>🧑‍🔧</div>
        <Sticker color={GREEN}>数がおかしい → 受け取らない</Sticker>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.JSON} highlight={[18]} at={at(0.2)} fontSize={32} width={1780} />
    </Center>
  );
};

const Shape = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.SHAPE} steps={[{ lines: [22, 23], at: at(0.05) }, { lines: [27, 28], at: at(0.45) }]} fontSize={28} width={1800} />
    </Center>
  );
};

const FixRec = () => {
  const at = useAt();
  return (
    <Center gap={18}>
      <Pop><Label>直す前と直した後：同じ 2 つの Cookie を渡した記録</Label></Pop>
      <Row what="前：ふつう" c={EX.normal} d={at(0.05)} />
      <Row what="前：細工" c={EX.evil} d={at(0.15)} />
      <Row what="後：ふつう" c={SO.normal} d={at(0.35)} />
      <Row what="後：細工" c={SO.evil} d={at(0.45)} />
    </Center>
  );
};

const Layers = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card color={C.red} style={{ width: 1400 }}>
          <Label>Cookie は利用者が書き換えられる</Label>
          <Mono size={46} color={C.red}>{'{"items": [...], "price": 0}'}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.45)}><Sticker color={GREEN}>値段などは サーバー側に置く</Sticker></Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={66} color={C.red}>命令も書ける形式で読み戻す → 読むだけで攻撃が動く</Title></Pop>
      <Pop d={at(0.45)}><Title size={66} color={GREEN}>データだけの形式 ＋ 形の確認</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-502', '信頼できないデータのデシリアライズ'],
        ['OWASP Top 10:2025 A08', 'Software or Data Integrity Failures'],
        ['ASVS V1.5.2', '安全でない仕組みを 信頼できない入力に使わない'],
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
        <Label>直したコードに 届いた Cookie の中身（正しい JSON）</Label>
        <Mono size={52}>{'{"items": [{"id": "A1", "qty": -3}]}'}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>受け付ける？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={26}>
      <Title size={70} color={GREEN}>受け付けない</Title>
      <Row what="qty が -3" c={SO.quiz_negative} d={at(0.15)} size={34} />
      <Pop d={at(0.45)}><CodePanel snippet={K.SHAPE} highlight={[27, 28]} at={at(0.5)} fontSize={27} width={1800} maxLines={4} /></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="家具の組み立てで考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab13_deserialization" />,
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
  shape: Shape,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab13_deserialization" at={useAt()} />,
};
