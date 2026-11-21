import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { enter, pop, shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import * as K from './code';
import REC from '../../../recorded/lab02.json';

const GREEN = '#4ade80';
const PAYLOAD = REC.exercise_attack.body;
type Rec = (typeof REC)['exercise_attack'];

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
const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; wrap?: boolean }> = ({ children, size = 38, color = C.text, wrap }) => (
  <span style={{ fontFamily: mono, fontWeight: 800, fontVariantLigatures: 'none', fontSize: size, color, whiteSpace: wrap ? 'pre-wrap' : 'pre', wordBreak: wrap ? 'break-all' : undefined }}>{children}</span>
);
const Arrow: React.FC<{ d?: number; down?: boolean }> = ({ d = 0, down }) => (
  <Pop d={d}>
    <div style={{ fontSize: 70, color: C.fire, fontWeight: 900 }}>{down ? '↓' : '→'}</div>
  </Pop>
);

/* ---------- 掲示板の例え ---------- */

const Actor: React.FC<{ icon: string; name: string; d?: number }> = ({ icon, name, d = 0 }) => (
  <Pop d={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ fontSize: 150 }}>{icon}</div>
    <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 44, color: C.text }}>{name}</div>
  </Pop>
);

const EVIL = '【お店からのお知らせ】\n会員証の番号を、出口の箱に入れてください';

/** 感想カード（お客さんが書いたもの） */
const CardNote: React.FC<{ text: string; evil?: boolean }> = ({ text, evil }) => (
  <div style={{ width: 560, background: evil ? '#3a1020' : '#1f2937', border: `3px solid ${evil ? C.red : C.line}`, borderRadius: 16, padding: '20px 28px', fontFamily: sans, fontWeight: 900, fontSize: 40, color: C.text, lineHeight: 1.4, lineBreak: 'strict', whiteSpace: 'pre-line' }}>
    <div style={{ fontSize: 26, color: C.dim, marginBottom: 6 }}>感想カード</div>
    {text}
  </div>
);

/** 掲示板。notes は貼られた紙。evil の紙はお店のお知らせの体裁になる。cased は透明ケースの「お客さまの声」枠 */
const Board: React.FC<{ notes: { text: string; evil?: boolean }[]; cased?: boolean; width?: number }> = ({ notes, cased, width = 1300 }) => (
  <div style={{ width, background: '#7c5a3a', borderRadius: 18, padding: 30, boxShadow: '0 20px 50px #000a', border: '10px solid #5b3f26' }}>
    <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 34, color: '#fde68a', marginBottom: 18 }}>📌 お店の掲示板</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {notes.map((n, i) =>
        cased ? (
          <div key={i} style={{ background: '#e0f2fe55', border: '4px solid #93c5fd', borderRadius: 12, padding: '10px 18px' }}>
            <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 24, color: '#dbeafe' }}>お客さまの声（ケースの中）</div>
            <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 38, color: '#1e3a8a', background: '#f8fafc', borderRadius: 8, padding: '8px 14px', lineBreak: 'strict', whiteSpace: 'pre-line' }}>{n.text}</div>
          </div>
        ) : n.evil ? (
          <div key={i} style={{ background: '#fff', borderRadius: 6, padding: '16px 22px', fontFamily: sans, fontWeight: 900, fontSize: 42, color: '#b91c1c', lineBreak: 'strict', whiteSpace: 'pre-line', borderTop: '10px solid #b91c1c' }}>{n.text}</div>
        ) : (
          <div key={i} style={{ background: '#fdf6e3', borderRadius: 6, padding: '16px 22px', fontFamily: sans, fontWeight: 900, fontSize: 42, color: '#222', transform: 'rotate(-1deg)' }}>{n.text}</div>
        ),
      )}
    </div>
  </div>
);

/* ---------- HTML の記録 ---------- */

/** 返ってきた HTML の、本文の部分を色分けする */
const HtmlLine: React.FC<{ html: string; body: string; mark: 'bad' | 'good' | 'none'; size?: number }> = ({ html, body, mark, size = 32 }) => {
  const i = html.lastIndexOf(': ') + 2;
  const j = html.lastIndexOf('</div>');
  const color = mark === 'bad' ? C.red : mark === 'good' ? GREEN : C.gold;
  return (
    <div style={{ lineHeight: 1.5 }}>
      <Mono size={size} color={C.dim} wrap>{html.slice(0, i)}</Mono>
      <span style={{ background: mark === 'none' ? undefined : `${color}22`, borderRadius: 8 }}>
        <Mono size={size} color={color} wrap>{html.slice(i, j)}</Mono>
      </span>
      <Mono size={size} color={C.dim}>{html.slice(j)}</Mono>
    </div>
  );
};

/** 入力 → 返ってきた HTML。すべて recorded/lab02.json の値 */
const RecordFlow: React.FC<{ rec: Rec; mark: 'bad' | 'good' | 'none' }> = ({ rec, mark }) => {
  const at = useAt();
  return (
    <Center gap={18}>
      <Pop>
        <Card style={{ width: 1600 }}>
          <Label>入力（body）</Label>
          <Mono size={46} color={C.gold}>{rec.body}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.15)} down />
      <Pop d={at(0.2)}>
        <Card color={mark === 'bad' ? C.red : mark === 'good' ? GREEN : C.line} style={{ width: 1600 }}>
          <Label>render_comment が返した HTML（記録）</Label>
          <HtmlLine html={rec.html} body={rec.body} mark={mark} />
        </Card>
      </Pop>
    </Center>
  );
};

/** HTML をブラウザと同じ規則（html.parser）で読んだ部品の列 */
const PartsView: React.FC<{ rec: Rec; good?: boolean }> = ({ rec, good }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const shown = rec.parts.filter(([k]) => k !== 'end');
  return (
    <Center gap={30}>
      <Label>HTML として読んだ部品（Python の html.parser の記録）</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', maxWidth: 1700 }}>
        {shown.map(([k, v], i) => {
          const isScript = k === 'script' || (k === 'tag' && v === 'script');
          const color = isScript ? C.red : k === 'tag' ? C.fn : C.text;
          return (
            <Pop key={i} d={at(0.05 + i * 0.07)}>
              <Card color={color} style={{ padding: '16px 26px', transform: `translateX(${isScript ? shake(f, at(0.55), 10, 14) : 0}px)` }}>
                <Label color={color}>{k === 'tag' ? 'タグ' : k === 'script' ? 'プログラム' : '文字'}</Label>
                <Mono size={36} color={color}>{k === 'tag' ? `<${v}>` : JSON.stringify(v)}</Mono>
              </Card>
            </Pop>
          );
        })}
      </div>
      <Pop d={at(0.6)}>
        <Sticker color={good ? GREEN : C.red}>script タグ：{rec.script_tags} 個</Sticker>
      </Pop>
    </Center>
  );
};

/* ---------- 場面 ---------- */

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  const typed = PAYLOAD.slice(0, Math.max(0, Math.floor((f - at(0.05)) / 2)));
  return (
    <Center gap={40}>
      <Card style={{ width: 1200 }}>
        <Label>コメント</Label>
        <div style={{ border: `3px solid ${C.line}`, borderRadius: 12, padding: '14px 20px', minHeight: 70 }}>
          <Mono size={44} color={C.gold}>{typed}</Mono>
        </div>
      </Card>
      <Pop d={at(0.6)} style={{ display: 'flex', gap: 40 }}>
        {['🧑', '👩', '🧔'].map((p, i) => (
          <div key={p} style={{ textAlign: 'center', transform: `translateX(${shake(f, at(0.65) + i * 4, 12, 14)}px)` }}>
            <div style={{ fontSize: 110 }}>{p}</div>
            <Sticker color={C.red} size={30} rotate={i - 1}>⚠ 動いた</Sticker>
          </div>
        ))}
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Title size={120}>クロスサイトスクリプティング</Title>
      <Pop d={at(0.2)}><Mono size={110} color={C.gold}>XSS</Mono></Pop>
      <Pop d={at(0.5)}><Sticker>CWE Top 25（2025） 第 1 位</Sticker></Pop>
    </Center>
  );
};

const Board1 = () => {
  const at = useAt();
  return (
    <Center row gap={30}>
      <Actor icon="🙂" name="お客さん" />
      <Arrow d={at(0.15)} />
      <Actor icon="🧑‍💼" name="店員" d={at(0.2)} />
      <Arrow d={at(0.35)} />
      <Actor icon="📌" name="掲示板" d={at(0.4)} />
      <Arrow d={at(0.55)} />
      <Actor icon="👀" name="読む人" d={at(0.6)} />
    </Center>
  );
};

const Board2 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><CardNote text="おいしかったです" /></Pop>
      <Arrow d={at(0.3)} />
      <Pop d={at(0.35)}><Board width={760} notes={[{ text: 'おいしかったです' }, { text: 'また来ます' }]} /></Pop>
      <Pop d={at(0.6)}><div style={{ fontSize: 110, color: GREEN }}>✓</div></Pop>
    </Center>
  );
};

const Board3 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Pop><CardNote evil text={EVIL} /></Pop>
      <Arrow d={at(0.3)} />
      <Pop d={at(0.35)}><Board width={1000} notes={[{ text: 'おいしかったです' }, { text: EVIL, evil: true }]} /></Pop>
    </Center>
  );
};

const Board4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center row gap={60}>
      <Pop><Board width={1040} notes={[{ text: EVIL, evil: true }]} /></Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)} style={{ textAlign: 'center', transform: `translateX(${shake(f, at(0.4), 16, 18)}px)` }}>
        <div style={{ fontSize: 180 }}>🪪📥</div>
        <Sticker color={C.red}>従ってしまう</Sticker>
      </Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['🪧 感想カード', 'ユーザーの入力', 'body'],
    ['📌 掲示板', 'HTML のページ', '<div class="comment">…</div>'],
    ['👀 読む人', 'ブラウザ', 'Chrome・Safari・…'],
  ];
  return (
    <Center gap={28}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.12 + i * 0.22)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, width: 1500 }}>
            <Card style={{ width: 560 }}><Title size={52}>{a}</Title></Card>
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
    <Center gap={40}>
      <Board width={1300} notes={[{ text: 'おいしかったです' }, { text: EVIL, evil: true }]} />
      <div style={{ display: 'flex', gap: 40 }}>
        <Pop d={at(0.25)}><Sticker color={C.fn}>お客さんの言葉</Sticker></Pop>
        <Pop d={at(0.4)}><Sticker color={C.red} rotate={3}>お店のお知らせ</Sticker></Pop>
      </div>
      <Pop d={at(0.6)}><Title size={60} color={C.gold}>同じ掲示板の上で 区別できない</Title></Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[6]} at={at(0.3)} fontSize={34} />
    </Center>
  );
};

const Normal = () => <RecordFlow rec={REC.exercise_normal} mark="none" />;
const Attack = () => <RecordFlow rec={REC.exercise_attack} mark="bad" />;
const Parse = () => <PartsView rec={REC.exercise_attack} />;

const Why1 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Actor icon="😈" name="書いた人" />
      <Arrow d={at(0.15)} />
      <Actor icon="💬" name="コメント欄" d={at(0.2)} />
      <Arrow d={at(0.35)} />
      <Pop d={at(0.4)} style={{ display: 'flex', gap: 20 }}>
        {['🧑', '👩', '🧔', '👵'].map((p) => (
          <div key={p} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 120 }}>{p}</div>
            <Sticker color={C.red} size={28} rotate={0}>被害</Sticker>
          </div>
        ))}
      </Pop>
    </Center>
  );
};

const Why2 = () => {
  const at = useAt();
  const items: [string, string][] = [
    ['🍪', 'クッキーを盗む'],
    ['📝', '勝手に投稿する'],
    ['🔑', '偽のログイン画面'],
  ];
  return (
    <Center row gap={40}>
      {items.map(([i, t], n) => (
        <Pop key={t} d={at(0.05 + n * 0.25)}>
          <Card color={C.red} style={{ width: 480, textAlign: 'center' }}>
            <div style={{ fontSize: 130 }}>{i}</div>
            <Title size={46}>{t}</Title>
          </Card>
        </Pop>
      ))}
    </Center>
  );
};

const Roundcube = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Sticker color={C.red}>2023</Sticker></Pop>
      <Pop d={at(0.12)}><Title size={110}>Roundcube Webmail</Title></Pop>
      <Pop d={at(0.3)}><Mono size={60} color={C.gold}>CVE-2023-5631</Mono></Pop>
      <Pop d={at(0.45)}><Title size={46} color={C.dim}>📧 細工した HTML メールを開くだけで、スクリプトが動く</Title></Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  const chips: [string, string][] = [
    ['AV:N', 'ネットワーク越し'],
    ['PR:L', '低い権限が要る'],
    ['UI:R', '誰かが開く必要あり'],
  ];
  return (
    <Center gap={50}>
      <Pop>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}>
          <Mono size={56} color={C.dim}>NVD CVSS 3.1</Mono>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 200, color: C.gold }}>5.4</span>
          <Sticker color={C.gold}>Medium</Sticker>
        </div>
      </Pop>
      <div style={{ display: 'flex', gap: 30 }}>
        {chips.map(([k, v], i) => (
          <Pop key={k} d={at(0.3 + i * 0.15)}>
            <Card color={k === 'UI:R' ? C.gold : C.fire} style={{ textAlign: 'center', width: 460 }}>
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
  return (
    <Center gap={40}>
      <Pop><Card color={C.red}><Title size={60}>CISA Known Exploited Vulnerabilities</Title><Label color={C.dim}>悪用が確認された脆弱性の一覧（2023-10-26 に追加）</Label></Card></Pop>
      <Pop d={at(0.5)}><Title size={64} color={C.gold}>点数が中くらいでも 油断できない</Title></Pop>
    </Center>
  );
};

const Case1 = () => (
  <Center>
    <Board cased width={1100} notes={[{ text: 'おいしかったです' }]} />
  </Center>
);

const Case2 = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Board cased width={1400} notes={[{ text: 'おいしかったです' }, { text: EVIL }]} />
      <Pop d={at(0.4)}>
        <Title size={56} color={GREEN}>👀「お客さんが こう書いた、という感想ね」</Title>
      </Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.AFTER} highlight={[11]} at={at(0.3)} fontSize={26} />
    </Center>
  );
};

const FixRec = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card color={GREEN} style={{ width: 1700 }}>
          <Label>直した render_comment が返した HTML（記録）</Label>
          <HtmlLine html={REC.solution_attack.html} body={REC.solution_attack.body} mark="good" size={26} />
        </Card>
      </Pop>
      <Pop d={at(0.35)}>
        <Card color={GREEN} style={{ width: 1700 }}>
          <Label>HTML として読んだ部品（Python の html.parser の記録）</Label>
          <Mono size={34} color={GREEN} wrap>{`文字 ${JSON.stringify(REC.solution_attack.parts.find(([k, v]) => k === 'text' && v.includes('script'))![1])}`}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.6)}><Sticker color={GREEN}>script タグ：{REC.solution_attack.script_tags} 個</Sticker></Pop>
    </Center>
  );
};

const FixWhy = () => {
  const at = useAt();
  const pairs: [string, string][] = [
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['&', '&amp;'],
    ['"', '&quot;'],
    ["'", '&#x27;'],
  ];
  return (
    <Center gap={30}>
      <div style={{ display: 'flex', gap: 26 }}>
        {pairs.map(([a, b], i) => (
          <Pop key={a} d={at(0.05 + i * 0.1)}>
            <Card color={i === 0 ? C.gold : C.line} style={{ textAlign: 'center', width: 280 }}>
              <Mono size={70} color={C.red}>{a}</Mono>
              <div style={{ fontSize: 40, color: C.fire }}>↓</div>
              <Mono size={44} color={GREEN}>{b}</Mono>
            </Card>
          </Pop>
        ))}
      </div>
      <Pop d={at(0.65)}><Title size={56}>タグの始まり ではなく 記号の文字 として表示</Title></Pop>
    </Center>
  );
};

const Context = () => {
  const at = useAt();
  const items: [string, string, string][] = [
    ['要素の中', '<b>…</b>', 'html.escape'],
    ['属性の中', 'href="…"', '引用符もエスケープ'],
    ['URL', 'javascript:…', 'http / https だけ許可'],
    ['script の中', '<script>…</script>', 'JSON の < > & を \\u に'],
  ];
  return (
    <Center gap={20}>
      {items.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.05 + i * 0.18)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, width: 1600 }}>
            <Sticker color={C.fn} size={34} rotate={0}>{a}</Sticker>
            <div style={{ width: 560 }}><Mono size={36} color={C.dim}>{b}</Mono></div>
            <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 46, color: C.text }}>{c}</div>
          </div>
        </Pop>
      ))}
    </Center>
  );
};

const Layers = () => {
  const at = useAt();
  const items: [string, string, boolean][] = [
    ['根本対策', '出力するときにエスケープ', true],
    ['多層防御', 'テンプレートの自動エスケープを使う', false],
    ['多層防御', 'CSP で動かせるスクリプトを絞る', false],
    ['多層防御', 'クッキーに HttpOnly', false],
  ];
  return (
    <Center gap={22}>
      {items.map(([k, v, root], i) => (
        <Pop key={v} d={at(i === 0 ? 0 : 0.1 + i * 0.2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, width: 1400 }}>
            <Sticker color={root ? C.gold : C.fn} size={34} rotate={0}>{k}</Sticker>
            <Title size={52}>{v}</Title>
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
      <Pop><Title size={84} color={C.red}>そのまま埋め込む → タグになる</Title></Pop>
      <Pop d={at(0.45)}><Title size={84} color={GREEN}>エスケープする → 文字になる</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  const refs: [string, string][] = [
    ['CWE-79', '弱点の種類'],
    ['OWASP Top 10:2025 A05', 'Injection'],
    ['ASVS V1.2.1', '出力エンコーディング'],
  ];
  return (
    <Center gap={26}>
      {refs.map(([k, v], i) => (
        <Pop key={k} d={at(0.1 + i * 0.25)}>
          <Card color={C.fire} style={{ width: 1200, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Mono size={52} color={C.gold}>{k}</Mono>
            <Title size={44}>{v}</Title>
          </Card>
        </Pop>
      ))}
    </Center>
  );
};

const QUIZ = 'f\'<a href="{html.escape(url)}">{html.escape(name)}</a>\'';
const Quiz = () => {
  const at = useAt();
  return (
    <Center gap={50}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1600 }}>
        <Mono size={38}>{QUIZ}</Mono>
      </Card>
      <Pop d={at(0.5)}><Title size={70}>url がユーザーの入力。これは安全？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Title size={100} color={C.red}>安全ではない</Title>
      <Pop d={at(0.2)}>
        <Card style={{ width: 1600 }}>
          <Label>html.escape した結果（記録）</Label>
          <Mono size={40} color={C.red}>{REC.quiz.escaped}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.5)}>
        <Card color={GREEN} style={{ width: 1600 }}>
          <Label>直した render_profile_link（記録）</Label>
          <Mono size={34} color={GREEN}>{`ValueError: ${REC.quiz.solution_error}`}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.7)}><Title size={52} color={GREEN}>リンクは http / https だけを許可</Title></Pop>
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
      <Pop d={at(0.4)}><Mono size={40} color={C.dim}>labs/lab02_output_encoding</Mono></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="お店の掲示板で考える" />,
  board1: Board1,
  board2: Board2,
  board3: Board3,
  board4: Board4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab02_output_encoding" />,
  code: Code,
  normal: Normal,
  attack: Attack,
  parse: Parse,
  why1: Why1,
  why2: Why2,
  ch3: () => <ChapterCard no="3" title="実際に起きた事件" />,
  roundcube: Roundcube,
  cvss: Cvss,
  damage: Damage,
  ch4: () => <ChapterCard no="4" title="防ぐには" />,
  case1: Case1,
  case2: Case2,
  fix: Fix,
  fixRec: FixRec,
  fixWhy: FixWhy,
  context: Context,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: Outro,
};
