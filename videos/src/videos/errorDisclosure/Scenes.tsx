import { useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, ResultRow, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab18.json';

type Case = { order_id: string; status: number; body: Record<string, unknown>; log: { incident: string; error: string }[] };
type Side = Record<'ok' | 'quote' | 'missing', Case>;
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

/** 返ったエラーを | で区切って並べる */
const parts = (s: string) => s.split(' | ');
const LEAKY = /SELECT|orders|card_last4|db-primary|5432|PostgreSQL/;

const ROWS: [string, keyof Side][] = [
  ['ある注文', 'ok'],
  ['引用符を足す', 'quote'],
  ['無い注文', 'missing'],
];
const shortBody = (c: Case) => {
  if (c.status === 200) return `${c.body.item}・${c.body.price} 円`;
  const e = String(c.body.error);
  if (LEAKY.test(JSON.stringify(c.body))) return 'SQL 文とサーバー名';
  return c.body.incident ? `${e}（番号付き）` : e;
};
const Row: React.FC<{ what: string; c: Case; d?: number; size?: number }> = ({ what, c, d, size = 30 }) => {
  const leak = LEAKY.test(JSON.stringify(c.body));
  return <ResultRow what={what} input={`${c.order_id} → ${c.status}`} result={shortBody(c)} ok={!leak && c.status === 200} bad={leak} d={d} size={size} whatWidth={300} />;
};

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const err = String(EX.quote.body.error);
  return (
    <Center gap={30}>
      <Pop>
        <Card style={{ width: 1500 }}>
          <Label>頼んだ注文番号</Label>
          <Mono size={60}>
            1001<span style={{ color: C.red }}>&apos;</span>
          </Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.2)} down />
      <Pop d={at(0.25)} style={{ transform: `translateX(${shake(f, at(0.4), 14, 14)}px)` }}>
        <Card color={C.red} style={{ width: 1700 }}>
          <Label>{`返ってきたエラー（記録・作り物）  ${EX.quote.status}`}</Label>
          {parts(err).map((p) => (
            <div key={p}><Mono size={28} color={C.red}>{p}</Mono></div>
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
      <Title size={110}>エラーで内部の情報が漏れる</Title>
      <Pop d={at(0.2)}><Title size={52} color={C.dim}>失敗の説明が 攻撃者への地図に</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-209</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Actor icon="🙂" name="客" />
      <Arrow d={at(0.25)} />
      <Actor icon="🏦" name="銀行の窓口" d={at(0.3)} />
      <Pop d={at(0.55)}><Sticker color={C.gold}>手続きが うまくいかない</Sticker></Pop>
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="🧑‍💼" name="正直すぎる窓口の人" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}>
        <Card color={C.red} style={{ width: 860 }}>
          <Title size={40}>「奥の金庫室の 3 番の棚の鍵が、</Title>
          <Title size={40}>今朝から壊れていまして…」</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Pop><Card style={{ width: 600, textAlign: 'center' }}><div style={{ fontSize: 100 }}>🙂</div><Title size={40}>ふつうの客</Title><Title size={32} color={C.dim}>どうでもいい話</Title></Card></Pop>
      <Pop d={at(0.35)}><Card color={C.red} style={{ width: 600, textAlign: 'center' }}><div style={{ fontSize: 100 }}>🦹</div><Title size={40}>泥棒</Title><Title size={32} color={C.red}>場所と弱いところが分かる</Title></Card></Pop>
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 50, alignItems: 'center' }}>
        <Actor icon="🦹" name="わざと失敗させる" />
        <Arrow d={at(0.15)} />
        <Actor icon="🧑‍💼" name="正直に説明" d={at(0.2)} />
        <Arrow d={at(0.35)} />
        <Actor icon="🗺️" name="中の地図" d={at(0.4)} />
      </div>
      <Pop d={at(0.6)} style={{ transform: `translateX(${shake(f, at(0.63), 12, 12)}px)` }}><Sticker color={C.red}>話を 聞き出していく</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🏦 窓口', 'アプリ', 'handle()'],
    ['🗣️ 正直すぎる説明', '詳しいエラーメッセージ', '例外の中身をそのまま返す'],
    ['🗺️ 金庫室の場所', 'SQL 文・サーバー名・版', '表や列の名前、DB の種類'],
  ];
  return (
    <Center gap={22}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.05 + i * 0.25)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, width: 1600 }}>
            <Card style={{ width: 520, padding: '16px 28px' }}><Title size={42}>{a}</Title></Card>
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
      <Actor icon="🗄️" name="内部のエラー" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><Card color={C.red} style={{ width: 640, textAlign: 'center' }}><Title size={46} color={C.red}>そのまま</Title><Title size={34} color={C.dim}>type(e).__name__ と str(e)</Title></Card></Pop>
      <Arrow d={at(0.45)} />
      <Actor icon="🧑‍💻" name="利用者（攻撃者も）" d={at(0.5)} />
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[14, 15, 16]} at={at(0.3)} fontSize={36} width={1700} />
    </Center>
  );
};

const Step1 = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>① 注文 1001</Title></Pop>
      <Pop d={at(0.2)}><Card color={GREEN} style={{ width: 1200 }}><Label>{`返ってきた本文（記録） ${EX.ok.status}`}</Label><Mono size={46} color={GREEN}>{JSON.stringify(EX.ok.body)}</Mono></Card></Pop>
    </Center>
  );
};

const Step2 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const ps = parts(String(EX.quote.body.error));
  const what = ['エラーの種類', '実行した SQL 文（表と列の名前）', 'サーバー名・ポート・版'];
  return (
    <Center gap={18}>
      <Pop><Title size={46} color={C.dim}>② 1001 の後ろに 引用符を足す</Title></Pop>
      {ps.map((p, i) => (
        <Pop key={p} d={at(0.15 + i * 0.15)} style={{ transform: `translateX(${shake(f, at(0.7), 8, 8)}px)` }}>
          <Card color={C.red} style={{ width: 1750, padding: '14px 26px' }}>
            <Label color={C.red}>{what[i] ?? ''}</Label>
            <Mono size={26} color={C.red}>{p}</Mono>
          </Card>
        </Pop>
      ))}
    </Center>
  );
};

const Step3 = () => {
  const at = useAt();
  const items: [string, string][] = [
    ['card_last4', 'カードの下 4 けたの列がある'],
    ['PostgreSQL 15.2', 'データベースの種類と版'],
    ['db-primary.internal:5432', '中のサーバーの名前'],
  ];
  return (
    <Center gap={20}>
      {items.map(([k, v], i) => (
        <Pop key={k} d={at(0.05 + i * 0.18)}>
          <Card color={C.red} style={{ width: 1500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 32px' }}>
            <Mono size={40} color={C.red}>{k}</Mono>
            <Title size={40}>{v}</Title>
          </Card>
        </Pop>
      ))}
      <Pop d={at(0.65)}><Sticker color={C.red}>次の攻撃の 材料になる</Sticker></Pop>
    </Center>
  );
};

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2024-29059</Mono></Pop>
      <Pop d={at(0.12)}><Title size={100}>.NET Framework</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>Information Disclosure Vulnerability</Title></Pop>
      <Pop d={at(0.45)} style={{ marginTop: 16 }}><Sticker color={C.red}>NVD の分類：CWE-209（エラーメッセージから漏れる）</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="📄" name="漏れた情報" />
      <Arrow d={at(0.2)} />
      <Actor icon="🪜" name="足がかり" d={at(0.25)} />
      <Arrow d={at(0.45)} />
      <Actor icon="💥" name="別の攻撃" d={at(0.5)} />
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  return (
    <Center gap={10}>
      <CvssCard source="CVSS 3.1（Microsoft）" score="7.5" sev="High" at={at} chips={[['AV:N', 'ネットワーク越し'], ['PR:N', 'ログイン不要'], ['C:H', '情報が大きく漏れる']]} />
    </Center>
  );
};

const Kev = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card color={C.red} style={{ width: 1400, textAlign: 'center' }}>
          <Label>CISA の 悪用が確認された脆弱性の一覧</Label>
          <Title size={70} color={C.red}>2025 年 2 月 4 日 追加</Title>
        </Card>
      </Pop>
      <Pop d={at(0.4)}><Label>CVSS は NVD に載っている Microsoft の評価</Label></Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="🧑‍💼" name="窓口の人" />
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}>
        <Card color={GREEN} style={{ width: 820 }}>
          <Title size={42}>「ただいま手続きができません。</Title>
          <Title size={42}>受付番号は 27 番です」</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Pop><Card style={{ width: 360, textAlign: 'center' }}><Title size={50}>27 番</Title></Card></Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}>
        <Card color={GREEN} style={{ width: 760 }}>
          <Label color={GREEN}>📒 奥の記録帳</Label>
          <Title size={36}>27 番：金庫室 3 番の棚の鍵が故障</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.FIX} steps={[{ lines: [13, 14], at: at(0.05) }, { lines: [19], at: at(0.35) }]} fontSize={30} width={1800} />
    </Center>
  );
};

const Logit = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.FIX} highlight={[17, 18]} at={at(0.2)} fontSize={30} width={1800} />
    </Center>
  );
};

const FixRec = () => {
  const at = useAt();
  return (
    <Center gap={18}>
      <Pop><Label>直す前と直した後：同じ 3 つを頼んだ記録（利用者に返った本文）</Label></Pop>
      {ROWS.map(([w, k], i) => (
        <Row key={`ex-${k}`} what={`前：${w}`} c={EX[k]} d={at(0.05 + i * 0.1)} />
      ))}
      {ROWS.map(([w, k], i) => (
        <Row key={`so-${k}`} what={`後：${w}`} c={SO[k]} d={at(0.4 + i * 0.1)} />
      ))}
    </Center>
  );
};

const Layers = () => {
  const at = useAt();
  return (
    <Center gap={26}>
      <Pop><Card color={C.gold} style={{ width: 1300 }}><Label>本番では</Label><Mono size={48} color={C.gold}>DEBUG = False</Mono></Card></Pop>
      <Pop d={at(0.4)}><Sticker color={C.gold}>詳しいエラー画面を 本番で出さない</Sticker></Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>エラーの中身をそのまま返す → 中の作りが知られる</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>利用者には短く 詳しくはログに</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-209 ・ CWE-200', 'エラーメッセージからの情報の露出'],
        ['OWASP Top 10:2025 A02', 'Security Misconfiguration'],
        ['ASVS V16.5.1', '利用者には汎用的なエラーメッセージ'],
        ['ASVS V13.4.2', '本番ではデバッグを無効にする'],
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
        <Label>直したコードで 利用者に返ったもの</Label>
        <Mono size={50}>{JSON.stringify(SO.quote.body)}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={66}>エラーの詳しい中身は 消えてしまう？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  const l = SO.quote.log[0];
  return (
    <Center gap={26}>
      <Title size={70} color={GREEN}>消えない</Title>
      <Pop d={at(0.15)}>
        <Card color={GREEN} style={{ width: 1750 }}>
          <Label>サーバーのログ（記録）</Label>
          <Mono size={34} color={GREEN}>{`incident: ${l.incident}`}</Mono>
          {parts(l.error).map((p) => (
            <div key={p}><Mono size={24}>{p}</Mono></div>
          ))}
        </Card>
      </Pop>
      <Pop d={at(0.5)}><Sticker color={GREEN}>同じ番号で たどれる</Sticker></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="銀行の窓口で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab18_error_disclosure" />,
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
  logit: Logit,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab18_error_disclosure" at={useAt()} />,
};
