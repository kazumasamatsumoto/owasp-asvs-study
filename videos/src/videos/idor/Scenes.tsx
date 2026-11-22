import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { enter, pop, shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import * as K from './code';
import REC from '../../../recorded/lab04.json';

const GREEN = '#4ade80';
type Get = { invoice_id: number; ok?: Record<string, string | number>; error?: string };

/* ---------- 共通の部品 ---------- */

const Center: React.FC<{ children: React.ReactNode; row?: boolean; gap?: number }> = ({ children, row, gap = 0 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: row ? 'row' : 'column', gap, padding: '60px 80px 220px', ...enter(f) }}>
      {children}
    </AbsoluteFill>
  );
};
const Pop: React.FC<{ d?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ d = 0, children, style }) => {
  const f = useCurrentFrame();
  const s = pop(f, d);
  return <div style={{ transform: `scale(${s})`, opacity: Math.min(1, s * 1.5), ...style }}>{children}</div>;
};
const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 96, color = C.text }) => (
  <div style={{ fontFamily: sans, fontWeight: 900, fontSize: size, color, textAlign: 'center', lineHeight: 1.2 }}>{children}</div>
);
const Card: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.line, style }) => (
  <div style={{ background: C.panel, border: `3px solid ${color}`, borderRadius: 24, padding: '28px 40px', boxShadow: '0 24px 60px #0008', ...style }}>{children}</div>
);
const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.dim }) => (
  <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 30, color, marginBottom: 10 }}>{children}</div>
);
const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 38, color = C.text }) => (
  <span style={{ fontFamily: mono, fontWeight: 800, fontVariantLigatures: 'none', fontSize: size, color, whiteSpace: 'pre' }}>{children}</span>
);
const Arrow: React.FC<{ d?: number; down?: boolean }> = ({ d = 0, down }) => (
  <Pop d={d}>
    <div style={{ fontSize: 70, color: C.fire, fontWeight: 900 }}>{down ? '↓' : '→'}</div>
  </Pop>
);
const Actor: React.FC<{ icon: string; name: string; d?: number }> = ({ icon, name, d = 0 }) => (
  <Pop d={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ fontSize: 150 }}>{icon}</div>
    <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 44, color: C.text }}>{name}</div>
  </Pop>
);

/* ---------- クリーニング店の例え ---------- */

/** 番号の札 */
const Tag: React.FC<{ no: string; color?: string; size?: number }> = ({ no, color = '#fde68a', size = 64 }) => (
  <div style={{ background: color, color: '#111', fontFamily: mono, fontWeight: 800, fontSize: size, padding: '10px 26px', borderRadius: 12, border: '4px solid #0006', boxShadow: '0 10px 0 #0006' }}>
    🏷 {no}
  </div>
);
/** ハンガーに掛かった服。owner は持ち主 */
const Cloth: React.FC<{ no: string; icon: string; owner: string; hot?: boolean; dim?: boolean }> = ({ no, icon, owner, hot, dim }) => (
  <div style={{ width: 230, textAlign: 'center', background: hot ? '#3a1020' : '#1f2937', border: `3px solid ${hot ? C.red : C.line}`, borderRadius: 18, padding: '14px 10px', opacity: dim ? 0.4 : 1 }}>
    <div style={{ fontSize: 110 }}>{icon}</div>
    <Mono size={40} color={C.gold}>{no}</Mono>
    <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 28, color: C.dim }}>{owner}</div>
  </div>
);
const RACK: [string, string, string][] = [
  ['101', '👕', 'あなた'],
  ['102', '🧥', '佐藤さん'],
  ['103', '👗', '鈴木さん'],
  ['104', '👔', '田中さん'],
];
const Rack: React.FC<{ hot?: string[]; d?: number }> = ({ hot = [], d = 0 }) => {
  const at = useAt();
  return (
    <div style={{ display: 'flex', gap: 24, borderTop: '10px solid #94a3b8', paddingTop: 20 }}>
      {RACK.map(([no, icon, owner], i) => (
        <Pop key={no} d={d + at(i * 0.05)}>
          <Cloth no={no} icon={icon} owner={owner} hot={hot.includes(no)} />
        </Pop>
      ))}
    </div>
  );
};

/* ---------- 記録 ---------- */

/** 請求書 1 枚。recorded/lab04.json の値をそのまま出す */
const Invoice: React.FC<{ inv: Record<string, string | number>; bad?: boolean }> = ({ inv, bad }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 40, rowGap: 6 }}>
    {Object.entries(inv).map(([k, v]) => (
      <div key={k} style={{ display: 'contents' }}>
        <Mono size={40} color={C.dim}>{k}</Mono>
        <Mono size={40} color={bad && (k === 'owner_id' || k === 'amount') ? C.red : k === 'status' && v === 'paid' ? C.red : C.text}>{JSON.stringify(v)}</Mono>
      </div>
    ))}
  </div>
);

/** 誰が何番を頼み、何が返ったか */
const GetFlow: React.FC<{ rec: Get; fn?: string; mark: 'ok' | 'bad' | 'good' | 'none' }> = ({ rec, fn = 'get_invoice', mark }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const color = mark === 'bad' ? C.red : mark === 'good' ? GREEN : C.line;
  return (
    <Center row gap={40}>
      <Pop>
        <Card style={{ width: 620 }}>
          <Label>頼んだ人（ログイン中）</Label>
          <Title size={56}>👩 アリス</Title>
          <div style={{ textAlign: 'center' }}><Mono size={34} color={C.dim}>user.id = {REC.exercise.get_100.user.id}</Mono></div>
          <div style={{ height: 24 }} />
          <Label>頼んだ番号</Label>
          <div style={{ textAlign: 'center' }}><Mono size={80} color={C.gold}>{rec.invoice_id}</Mono></div>
        </Card>
      </Pop>
      <Arrow d={at(0.15)} />
      <Pop d={at(0.2)} style={{ transform: `translateX(${mark === 'bad' ? shake(f, at(0.5), 12, 12) : 0}px)` }}>
        <Card color={color} style={{ width: 760 }}>
          <Label>{fn} が返したもの（記録）</Label>
          {rec.ok ? <Invoice inv={rec.ok} bad={mark === 'bad'} /> : <Mono size={52} color={mark === 'good' ? GREEN : C.gold}>{rec.error}</Mono>}
        </Card>
      </Pop>
    </Center>
  );
};

/* ---------- 場面 ---------- */

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const changed = f >= at(0.3);
  return (
    <Center gap={40}>
      <Card style={{ width: 1300 }}>
        <Label>アドレス</Label>
        <Mono size={56}>
          /invoices/<span style={{ color: changed ? C.red : C.gold, background: changed ? `${C.red}22` : undefined }}>{changed ? '200' : '100'}</span>
        </Mono>
      </Card>
      <Pop d={at(0.45)} style={{ transform: `translateX(${shake(f, at(0.5), 14, 14)}px)` }}>
        <Sticker color={C.red}>👀 他人の請求書が見えた</Sticker>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Mono size={150} color={C.gold}>IDOR</Mono>
      <Pop d={at(0.15)}><Title size={56} color={C.dim}>Insecure Direct Object Reference</Title></Pop>
      <Pop d={at(0.35)}><Title size={64}>番号さえ分かれば 他人のデータに届く</Title></Pop>
      <Pop d={at(0.6)}><Sticker>OWASP Top 10:2025 A01 アクセス制御の不備</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="🙂" name="お客さん" />
      <Pop d={at(0.15)}><div style={{ fontSize: 120 }}>👕</div></Pop>
      <Arrow d={at(0.25)} />
      <Actor icon="🧑‍💼" name="店員" d={at(0.3)} />
      <Arrow d={at(0.5)} />
      <Pop d={at(0.55)}><Tag no="101" size={80} /></Pop>
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={70}>🙂「101 番です」</Title></Pop>
      <Pop d={at(0.2)}><Rack hot={[]} /></Pop>
      <Pop d={at(0.6)} style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
        <Title size={56}>🧑‍💼 → 👕 101</Title>
        <div style={{ fontSize: 90, color: GREEN }}>✓</div>
      </Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Pop style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 160 }}>😈</div>
        <Label>持っている札</Label>
        <Tag no="101" />
      </Pop>
      <Pop d={at(0.35)}>
        <Card color={C.red} style={{ textAlign: 'center' }}>
          <Title size={80} color={C.red}>「102 番です」</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <Pop><Title size={60}>🧑‍💼 番号しか見ていない</Title></Pop>
      <Pop d={at(0.2)}><Rack hot={['102']} /></Pop>
      <Pop d={at(0.55)} style={{ transform: `translateX(${shake(f, at(0.6), 14, 14)}px)` }}>
        <Sticker color={C.red}>佐藤さんのコートが 渡された</Sticker>
      </Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const n = Math.min(4, Math.max(1, Math.floor((f - at(0.15)) / Math.max(1, at(0.15))) + 1));
  return (
    <Center gap={40}>
      <Pop><Title size={64}>😈「102」「103」「104」…</Title></Pop>
      <Pop d={at(0.1)}><Rack hot={RACK.slice(1, n).map(([no]) => no)} /></Pop>
      <Pop d={at(0.7)}><Sticker color={C.red}>順に言えば 全部持っていける</Sticker></Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['👕 服', '請求書などのデータ', 'Invoice'],
    ['🏷 番号', 'リクエストの ID', '/invoices/200'],
    ['🧑‍💼 店員', 'サーバーのプログラム', 'get_invoice'],
  ];
  return (
    <Center gap={28}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.12 + i * 0.22)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, width: 1500 }}>
            <Card style={{ width: 480 }}><Title size={52}>{a}</Title></Card>
            <div style={{ fontSize: 60, color: C.fire }}>＝</div>
            <Card color={C.fire} style={{ flex: 1 }}>
              <Title size={52}>{b}</Title>
              <div style={{ textAlign: 'center' }}><Mono size={30} color={C.dim}>{c}</Mono></div>
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
    <Center gap={50}>
      <div style={{ display: 'flex', gap: 60 }}>
        <Pop d={at(0.1)}>
          <Card color={GREEN} style={{ width: 640, textAlign: 'center' }}>
            <Title size={50}>番号は合っている？</Title>
            <div style={{ fontSize: 100, color: GREEN }}>✓ 見ている</div>
          </Card>
        </Pop>
        <Pop d={at(0.35)}>
          <Card color={C.red} style={{ width: 640, textAlign: 'center' }}>
            <Title size={50}>この人の物？</Title>
            <div style={{ fontSize: 100, color: C.red }}>✗ 見ていない</div>
          </Card>
        </Pop>
      </div>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[15, 17]} at={at(0.3)} fontSize={38} />
    </Center>
  );
};

const Normal = () => <GetFlow rec={REC.exercise.get_100} mark="ok" />;
const Attack = () => <GetFlow rec={REC.exercise.get_200} mark="bad" />;
const Missing = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Label>直す前の get_invoice の記録（アリスが頼んだ番号ごと）</Label>
      {([REC.exercise.get_200, REC.exercise.get_999] as Get[]).map((r, i) => (
        <Pop key={r.invoice_id} d={at(0.1 + i * 0.25)}>
          <Card color={r.ok ? C.red : C.gold} style={{ width: 1400, display: 'flex', alignItems: 'center', gap: 50 }}>
            <Mono size={70} color={C.gold}>{r.invoice_id}</Mono>
            <div style={{ fontSize: 50, color: C.fire }}>→</div>
            <Mono size={44} color={r.ok ? C.red : C.gold}>{r.ok ? `請求書（owner_id ${r.ok.owner_id}）` : r.error}</Mono>
          </Card>
        </Pop>
      ))}
      <Pop d={at(0.65)}><Sticker color={C.gold}>答えの違いで 本物の番号が分かる</Sticker></Pop>
    </Center>
  );
};

const Why = () => {
  const at = useAt();
  const items: [string, string][] = [
    ['🧾', '請求書'],
    ['📦', '注文'],
    ['💬', 'メッセージ'],
    ['🖼', '写真'],
  ];
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 34 }}>
        {items.map(([i, t], n) => (
          <Pop key={t} d={at(0.05 + n * 0.15)}>
            <Card color={C.red} style={{ width: 340, textAlign: 'center' }}>
              <div style={{ fontSize: 120 }}>{i}</div>
              <Title size={46}>{t}</Title>
              <Mono size={30} color={C.dim}>/{n + 1}00</Mono>
            </Card>
          </Pop>
        ))}
      </div>
      <Pop d={at(0.7)}><Title size={56} color={C.gold}>番号で取りに行くものは すべて同じ危険</Title></Pop>
    </Center>
  );
};

const Nextcloud = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Sticker color={C.red}>2020</Sticker></Pop>
      <Pop d={at(0.12)}><Title size={110}>Nextcloud Server</Title></Pop>
      <Pop d={at(0.3)}><Mono size={60} color={C.gold}>CVE-2020-8154</Mono></Pop>
      <Pop d={at(0.45)}><Title size={46} color={C.dim}>📱 他の利用者の端末を 遠隔で消去（リモートワイプ）できた</Title></Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  const chips: [string, string][] = [
    ['AV:N', 'ネットワーク越し'],
    ['PR:L', '普通の利用者で足りる'],
    ['UI:N', '誰の操作も要らない'],
  ];
  return (
    <Center gap={50}>
      <Pop>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}>
          <Mono size={56} color={C.dim}>NVD CVSS 3.1</Mono>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 200, color: C.red }}>7.7</span>
          <Sticker color={C.red}>High</Sticker>
        </div>
      </Pop>
      <div style={{ display: 'flex', gap: 30 }}>
        {chips.map(([k, v], i) => (
          <Pop key={k} d={at(0.3 + i * 0.15)}>
            <Card color={C.fire} style={{ textAlign: 'center', width: 480 }}>
              <Mono size={50} color={C.gold}>{k}</Mono>
              <Title size={38}>{v}</Title>
            </Card>
          </Pop>
        ))}
      </div>
    </Center>
  );
};

const Damage = () => {
  const at = useAt();
  const items: [string, string][] = [
    ['👀', '見る'],
    ['✏️', '書き換える'],
    ['🗑', '消す'],
  ];
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 40 }}>
        {items.map(([i, t], n) => (
          <Pop key={t} d={at(0.05 + n * 0.2)}>
            <Card color={C.red} style={{ width: 400, textAlign: 'center' }}>
              <div style={{ fontSize: 130 }}>{i}</div>
              <Title size={50}>{t}</Title>
            </Card>
          </Pop>
        ))}
      </div>
      <Pop d={at(0.7)}><Title size={56} color={C.gold}>番号を変えるだけで 他人の物に届く</Title></Pop>
    </Center>
  );
};

const Card1 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 150 }}>😈</div>
        <Tag no="102" />
      </Pop>
      <Arrow d={at(0.15)} />
      <Pop d={at(0.2)}>
        <Card color={GREEN} style={{ textAlign: 'center', width: 640 }}>
          <div style={{ fontSize: 120 }}>🧑‍💼🪪</div>
          <Title size={48}>会員カードも見る</Title>
          <Title size={40} color={C.dim}>102 番の持ち主 ＝ 佐藤さん</Title>
        </Card>
      </Pop>
      <Pop d={at(0.55)}><Sticker color={GREEN}>本人でなければ 渡さない</Sticker></Pop>
    </Center>
  );
};

const Card2 = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 50 }}>
        {[
          ['102', '他人の番号'],
          ['999', 'ない番号'],
        ].map(([no, k], i) => (
          <Pop key={no} d={at(0.1 + i * 0.2)}>
            <Card color={GREEN} style={{ width: 640, textAlign: 'center' }}>
              <Label>{k}</Label>
              <Tag no={no} />
              <div style={{ height: 20 }} />
              <Title size={46} color={GREEN}>「その番号はありません」</Title>
            </Card>
          </Pop>
        ))}
      </div>
      <Pop d={at(0.6)}><Title size={56}>あるかどうかも 教えない</Title></Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.AFTER} steps={[{ lines: [25], at: at(0.25) }, { lines: [19, 20], at: at(0.55) }]} fontSize={34} />
    </Center>
  );
};

const FixRec = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Label>直した get_invoice の記録（アリスが頼んだ番号ごと）</Label>
      {([REC.solution.get_100, REC.solution.get_200, REC.solution.get_999] as Get[]).map((r, i) => (
        <Pop key={r.invoice_id} d={at(0.05 + i * 0.2)}>
          <Card color={r.invoice_id === 100 ? C.line : GREEN} style={{ width: 1400, display: 'flex', alignItems: 'center', gap: 50 }}>
            <Mono size={70} color={C.gold}>{r.invoice_id}</Mono>
            <div style={{ fontSize: 50, color: C.fire }}>→</div>
            <Mono size={44} color={r.ok ? C.text : GREEN}>{r.ok ? `自分の請求書（owner_id ${r.ok.owner_id}）` : r.error}</Mono>
          </Card>
        </Pop>
      ))}
      <Pop d={at(0.7)}><Sticker color={GREEN}>他人の番号も ない番号も 同じ答え</Sticker></Pop>
    </Center>
  );
};

const Layers = () => {
  const at = useAt();
  const items: [string, string, string][] = [
    ['根本対策', '取り出すたびに 持ち主を確かめる', C.gold],
    ['多層防御', '確認は 全部の入り口が通る共通の場所に', C.fn],
    ['多層防御', '番号を推測しにくく（UUID など）', C.fn],
    ['注意', '推測しにくいだけでは 守りにならない', C.red],
  ];
  return (
    <Center gap={22}>
      {items.map(([k, v, c], i) => (
        <Pop key={v} d={at(i === 0 ? 0 : 0.1 + i * 0.2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, width: 1500 }}>
            <Sticker color={c} size={34} rotate={0}>{k}</Sticker>
            <Title size={50}>{v}</Title>
          </div>
        </Pop>
      ))}
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={80} color={C.red}>番号が合うだけで渡す → 他人の物が取れる</Title></Pop>
      <Pop d={at(0.45)}><Title size={80} color={GREEN}>持ち主を毎回確かめる → 渡さない</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  const refs: [string, string][] = [
    ['CWE-639', '弱点の種類（IDOR）'],
    ['OWASP Top 10:2025 A01', 'Broken Access Control'],
    ['ASVS V8.2.2', 'データ単位のアクセス制御'],
  ];
  return (
    <Center gap={26}>
      {refs.map(([k, v], i) => (
        <Pop key={k} d={at(0.1 + i * 0.25)}>
          <Card color={C.fire} style={{ width: 1400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Mono size={52} color={C.gold}>{k}</Mono>
            <Title size={44}>{v}</Title>
          </Card>
        </Pop>
      ))}
    </Center>
  );
};

const CHANGES = '{' + Object.entries(REC.exercise.update_paid.changes).map(([k, v]) => `"${k}": "${v}"`).join(', ') + '}';
const QUIZ = `update_invoice(alice, ${REC.exercise.update_paid.invoice_id}, ${CHANGES})`;
const Quiz = () => {
  const at = useAt();
  return (
    <Center gap={50}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1600 }}>
        <Label>アリスが、自分の請求書 100 番に送った変更</Label>
        <Mono size={40}>{QUIZ}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>status まで変えられる？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  const before = REC.exercise.update_paid;
  const after = REC.solution.update_paid;
  return (
    <Center gap={28}>
      <Pop>
        <Card color={C.red} style={{ width: 1600 }}>
          <Label>直す前（記録）: 変更後の請求書</Label>
          <Mono size={40} color={C.red}>{`status ${JSON.stringify(before.after.status)}   memo ${JSON.stringify(before.after.memo)}`}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.3)}>
        <Card color={GREEN} style={{ width: 1600 }}>
          <Label>直した後（記録）</Label>
          <Mono size={40} color={GREEN}>{after.error}</Mono>
          <div style={{ height: 8 }} />
          <Mono size={34} color={C.dim}>{`変更後も status ${JSON.stringify(after.after.status)}   memo ${JSON.stringify(after.after.memo)}（一部だけ反映もしない）`}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.65)}><Title size={52} color={GREEN}>持ち主でも 変えていい項目は決まっている</Title></Pop>
    </Center>
  );
};

const Outro = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Title size={80}>自分で直してみる</Title>
      <Pop d={at(0.2)}>
        <Card color={C.fire}>
          <Mono size={46} color={C.gold}>github.com/kazumasamatsumoto/owasp-asvs-study</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.4)}><Mono size={40} color={C.dim}>labs/lab04_idor</Mono></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="クリーニング店で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  shop5: Shop5,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab04_idor" />,
  code: Code,
  normal: Normal,
  attack: Attack,
  missing: Missing,
  why: Why,
  ch3: () => <ChapterCard no="3" title="実際に起きた事件" />,
  nextcloud: Nextcloud,
  cvss: Cvss,
  damage: Damage,
  ch4: () => <ChapterCard no="4" title="防ぐには" />,
  card1: Card1,
  card2: Card2,
  fix: Fix,
  fixRec: FixRec,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: Outro,
};
