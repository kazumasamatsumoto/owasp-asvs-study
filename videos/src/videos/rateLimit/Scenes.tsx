import { interpolate, useCurrentFrame } from 'remotion';
import { C } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import { Actor, Arrow, Card, Center, CvssCard, GREEN, Label, Mono, OutroCard, Pop, RefList, Title } from '../../parts/common';
import * as K from './code';
import REC from '../../../recorded/lab17.json';

type Try = { n: number; password: string; result: 'fail' | 'locked' | 'success' };
type Side = { normal: string; tries: Try[]; found_at: number | null; counts: Record<string, number>; quiz_owner_right_after: string; owner_after_15min: string };
const EX = REC.exercise as unknown as Side;
const SO = REC.solution as unknown as Side;

const COLOR = { fail: C.dim, locked: C.gold, success: C.red } as const;
const LABEL = { fail: '失敗', locked: 'ロック', success: '当たり' } as const;

/** 30 回の試行を、時間とともに並べる */
const Grid: React.FC<{ side: Side; from: number; to: number; title: string }> = ({ side, from, to, title }) => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, [from, to], [0, side.tries.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <Label>{title}</Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 282px)', gap: 8 }}>
        {side.tries.map((t, i) => {
          const shown = i < n;
          const hit = t.result === 'success';
          return (
            <div
              key={t.n}
              style={{
                opacity: shown ? 1 : 0.12,
                background: C.panel,
                border: `3px solid ${shown ? (hit ? C.red : t.result === 'locked' ? C.gold : C.line) : C.line}`,
                borderRadius: 12,
                padding: '6px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Mono size={19} color={hit ? C.red : C.text}>{`${t.n}. ${t.password}`}</Mono>
              <Mono size={18} color={COLOR[t.result]}>{LABEL[t.result]}</Mono>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** ダイヤル錠 */
const Dial: React.FC<{ code: string; color?: string; note?: string }> = ({ code, color = C.line, note }) => (
  <Card color={color} style={{ width: 540, textAlign: 'center' }}>
    <div style={{ fontSize: 110 }}>🔒</div>
    <Mono size={64}>{code}</Mono>
    {note && <Title size={32} color={color}>{note}</Title>}
  </Card>
);

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={30}>
      <Pop><Title size={60}>よく使われるパスワードを 上から順に</Title></Pop>
      <Pop d={at(0.2)} style={{ transform: `translateX(${shake(f, at(0.5), 14, 14)}px)` }}>
        <Card color={C.red} style={{ width: 1300, textAlign: 'center' }}>
          <Label>記録</Label>
          <Title size={70} color={C.red}>{`${EX.found_at} 回目で alice に入れた`}</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={120}>回数制限がない</Title>
      <Pop d={at(0.2)}><Title size={52} color={C.dim}>パスワードの総当たり</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-307</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => (
  <Center>
    <Dial code="? ? ? ?" note="4 けたで開く金庫" />
  </Center>
);

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Pop><Dial code="0 0 0 0" color={C.dim} note="ちがう" /></Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><Dial code="0 0 0 1" color={C.dim} note="ちがう" /></Pop>
      <Arrow d={at(0.45)} />
      <Pop d={at(0.5)}><Title size={50}>すぐ次へ…</Title></Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  const codes = ['1 2 3 4', '0 1 0 1', '1 1 1 1', '0 3 1 4'];
  return (
    <Center row gap={30}>
      <Actor icon="🦹" name="泥棒" />
      <Arrow d={at(0.1)} />
      {codes.map((c, i) => (
        <Pop key={c} d={at(0.15 + i * 0.12)}><Card style={{ padding: '14px 22px' }}><Mono size={44}>{c}</Mono></Card></Pop>
      ))}
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={30}>
      <Pop style={{ transform: `translateX(${shake(f, at(0.4), 12, 12)}px)` }}><Dial code="0 3 1 4" color={C.red} note="開いた" /></Pop>
      <Pop d={at(0.5)}><Sticker color={C.red}>時間さえあれば いつかは当たる</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🔒 金庫', 'アカウント', 'alice'],
    ['🔢 番号', 'パスワード', 'sunshine2024'],
    ['🔁 何度でも回せる', '回数制限の無いログイン', 'login() が失敗を数えない'],
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
  return (
    <Center row gap={40}>
      <Pop><Card style={{ width: 440, textAlign: 'center' }}><Title size={46}>失敗</Title><Title size={34} color={C.dim}>数えない</Title></Card></Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><Card style={{ width: 440, textAlign: 'center' }}><Title size={46}>次を試す</Title><Title size={34} color={C.dim}>止められない</Title></Card></Pop>
      <Arrow d={at(0.45)} />
      <Pop d={at(0.5)}><Card color={C.red} style={{ width: 440, textAlign: 'center' }}><Title size={46} color={C.red}>いつか当たる</Title></Card></Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[18, 19]} at={at(0.3)} fontSize={34} width={1780} />
    </Center>
  );
};

const Step1 = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop><Title size={50} color={C.dim}>① 本人が 正しいパスワードで</Title></Pop>
      <Pop d={at(0.15)}><Card style={{ width: 1200 }}><Label>入力</Label><Mono size={54}>alice / sunshine2024</Mono></Card></Pop>
      <Arrow d={at(0.4)} down />
      <Pop d={at(0.45)}><Card color={GREEN} style={{ width: 1200, textAlign: 'center' }}><Label>結果（記録）</Label><Title size={60} color={GREEN}>{EX.normal === 'success' ? '成功' : EX.normal}</Title></Card></Pop>
    </Center>
  );
};

const Step2 = () => {
  const at = useAt();
  return (
    <Center>
      <Grid side={EX} from={at(0.15)} to={at(0.95)} title="② 攻撃者が よく使われる 30 個を 1 秒ごとに（直す前・記録）" />
    </Center>
  );
};

const Step3 = () => {
  const at = useAt();
  return (
    <Center gap={26}>
      <Grid side={EX} from={-1} to={0} title="直す前：30 回の記録" />
      <Pop d={at(0.3)}>
        <Card color={C.red} style={{ width: 1300, textAlign: 'center' }}>
          <Title size={50} color={C.red}>{`${(EX.found_at ?? 0) - 1} 回失敗 → ${EX.found_at} 回目で当たり。止められた回数 ${EX.counts.locked}`}</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2026-116238</Mono></Pop>
      <Pop d={at(0.12)}><Title size={110}>pgAdmin 4</Title></Pop>
      <Pop d={at(0.25)}><Title size={44} color={C.dim}>データベースの管理ツール（server mode）</Title></Pop>
      <Pop d={at(0.45)} style={{ marginTop: 16 }}><Sticker color={C.red}>3 回でロック … のはずが 回避できた</Sticker></Pop>
    </Center>
  );
};

const Cve2 = () => {
  const at = useAt();
  return (
    <Center gap={26}>
      <Pop>
        <Card color={C.red} style={{ width: 1300 }}>
          <Label>回避のしかた（NVD の説明から）</Label>
          <Title size={46}>① 別の入口（/login）から送る</Title>
          <Title size={46}>② 利用者名の 大文字・小文字を変える</Title>
        </Card>
      </Pop>
      <Pop d={at(0.5)}><Sticker color={C.red}>失敗が 数えられなかった</Sticker></Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  return <CvssCard score="9.8" sev="Critical" at={at} chips={[['AV:N', 'ネットワーク越し'], ['PR:N', 'ログイン不要'], ['UI:N', '誰の操作も不要']]} />;
};

const Fixed = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Pop>
        <Card style={{ width: 1400, textAlign: 'center' }}>
          <Label>CISA の 悪用が確認された脆弱性の一覧</Label>
          <Title size={60} color={C.dim}>載っていない</Title>
        </Card>
      </Pop>
      <Pop d={at(0.35)}>
        <Card color={GREEN} style={{ width: 1400, textAlign: 'center' }}>
          <Label>直した版</Label>
          <Mono size={54} color={GREEN}>9.19</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Pop><Dial code="✕ ✕ ✕ ✕ ✕" color={C.gold} note="15 分で 5 回まちがい" /></Pop>
      <Arrow d={at(0.3)} />
      <Pop d={at(0.35)}><Card color={C.gold} style={{ width: 520, textAlign: 'center' }}><div style={{ fontSize: 100 }}>⏳</div><Title size={44}>15 分 回せない</Title></Card></Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Dial code="0 3 1 4" color={C.gold} note="正しい番号でも 開かない" /></Pop>
      <Pop d={at(0.45)}><Sticker color={GREEN}>当たったかどうかを 教えない</Sticker></Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.FIX} highlight={[18, 19]} at={at(0.2)} fontSize={30} width={1800} maxLines={11} />
    </Center>
  );
};

const Count = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.FIX} steps={[{ lines: [25, 26], at: at(0.05) }, { lines: [27, 28, 29], at: at(0.5) }]} fontSize={30} width={1800} maxLines={11} />
    </Center>
  );
};

const FixRec = () => {
  const at = useAt();
  return (
    <Center gap={20}>
      <Grid side={SO} from={at(0.05)} to={at(0.7)} title="直した後：同じ 30 個を 1 秒ごとに（記録）" />
      <Pop d={at(0.75)}>
        <Card color={GREEN} style={{ width: 1300, textAlign: 'center' }}>
          <Title size={46} color={GREEN}>{`失敗 ${SO.counts.fail} 回でロック → 残り ${SO.counts.locked} 回は止められた。当たり ${SO.counts.success} 回`}</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Layers = () => {
  const at = useAt();
  const items = ['IP ごとの回数制限', '多要素認証', '漏れたパスワードの拒否'];
  return (
    <Center gap={22}>
      <Pop><Label>本番では 組み合わせる</Label></Pop>
      {items.map((t, i) => (
        <Pop key={t} d={at(0.15 + i * 0.2)}><Card color={C.gold} style={{ width: 1100, textAlign: 'center', padding: '18px 30px' }}><Title size={50}>{t}</Title></Card></Pop>
      ))}
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70} color={C.red}>失敗を数えない → いつかは当てられる</Title></Pop>
      <Pop d={at(0.45)}><Title size={70} color={GREEN}>失敗を数えて 一定の回数で止める</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  return (
    <RefList
      at={at}
      refs={[
        ['CWE-307', '認証の試行回数を制限しない'],
        ['OWASP Top 10:2025 A07', 'Authentication Failures'],
        ['ASVS V6.3.1', '総当たり・クレデンシャルスタッフィング対策'],
        ['ASVS V2.4.1', '自動化された大量の操作を防ぐ'],
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
        <Label>攻撃でロックされた 直後に 本人が入力</Label>
        <Mono size={58}>alice / sunshine2024</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>入れる？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  const word = (r: string) => (r === 'locked' ? 'ロック中で 入れない' : r === 'success' ? '入れた' : r);
  return (
    <Center gap={26}>
      <Title size={70} color={GREEN}>入れない</Title>
      <Pop d={at(0.15)}>
        <Card style={{ width: 1400 }}>
          <Label>記録（直した後）</Label>
          <Title size={44}>{`直後：${word(SO.quiz_owner_right_after)}`}</Title>
          <Title size={44} color={GREEN}>{`15 分と 1 秒あと：${word(SO.owner_after_15min)}`}</Title>
        </Card>
      </Pop>
      <Pop d={at(0.5)}><Sticker color={C.gold}>本人には 通知で知らせる</Sticker></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="ダイヤル錠の金庫で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab17_rate_limit" />,
  code: Code,
  step1: Step1,
  step2: Step2,
  step3: Step3,
  ch3: () => <ChapterCard no="3" title="実際に起きた事件" />,
  cve: Cve,
  cve2: Cve2,
  cvss: Cvss,
  fixed: Fixed,
  ch4: () => <ChapterCard no="4" title="防ぐには" />,
  shop5: Shop5,
  shop6: Shop6,
  fix: Fix,
  count: Count,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: () => <OutroCard lab="lab17_rate_limit" at={useAt()} />,
};
