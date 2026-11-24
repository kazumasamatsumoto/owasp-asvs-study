import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { enter, pop, shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import * as K from './code';
import REC from '../../../recorded/lab05.json';

const GREEN = '#4ade80';
type Rec = { filename: string; data: string; saved?: string; saved_data?: string; error?: string; files_in_uploads: string[] };

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

/* ---------- 写真プリント店の例え ---------- */

/** USB の中のファイル 1 つ */
const FileChip: React.FC<{ icon: string; name: string; evil?: boolean; ok?: boolean }> = ({ icon, name, evil, ok }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: evil ? '#3a1020' : '#1f2937', border: `3px solid ${evil ? C.red : ok ? GREEN : C.line}`, borderRadius: 16, padding: '14px 26px' }}>
    <span style={{ fontSize: 70 }}>{icon}</span>
    <Mono size={44} color={evil ? C.red : C.text}>{name}</Mono>
  </div>
);
/** 店のパソコンの画面 */
const Pc: React.FC<{ children: React.ReactNode; color?: string; label?: string }> = ({ children, color = C.line, label = '🖥 店のパソコン' }) => (
  <div style={{ width: 640, background: '#0b1220', border: `6px solid ${color}`, borderRadius: 20, padding: 24, boxShadow: '0 20px 50px #000a' }}>
    <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 28, color: C.dim, marginBottom: 12 }}>{label}</div>
    <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>{children}</div>
  </div>
);

/* ---------- 記録 ---------- */

/** アップロードしたファイル → save_upload の結果 → uploads/ の中身。すべて recorded/lab05.json の値 */
const UploadFlow: React.FC<{ rec: Rec; fn: string; mark: 'none' | 'bad' | 'good' }> = ({ rec, fn, mark }) => {
  const at = useAt();
  const f = useCurrentFrame();
  const color = mark === 'bad' ? C.red : mark === 'good' ? GREEN : C.line;
  return (
    <Center gap={16}>
      <Pop>
        <Card style={{ width: 1600 }}>
          <Label>上げたファイル</Label>
          <div style={{ display: 'flex', gap: 40, alignItems: 'baseline' }}>
            <Mono size={48} color={C.gold}>{rec.filename}</Mono>
            <Mono size={32} color={C.dim}>中身: {rec.data}</Mono>
          </div>
        </Card>
      </Pop>
      <Arrow d={at(0.15)} down />
      <Pop d={at(0.2)} style={{ transform: `translateX(${mark === 'bad' ? shake(f, at(0.5), 12, 12) : 0}px)` }}>
        <Card color={color} style={{ width: 1600 }}>
          <Label>{fn} の結果（記録）</Label>
          {rec.saved ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><Mono size={30} color={C.dim}>保存名  </Mono><Mono size={42} color={mark === 'bad' ? C.red : mark === 'good' ? GREEN : C.text}>uploads/{rec.saved}</Mono></div>
              <div><Mono size={30} color={C.dim}>中身    </Mono><Mono size={32} color={mark === 'bad' ? C.red : C.text}>{rec.saved_data}</Mono></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Mono size={40} color={GREEN}>{rec.error}</Mono>
              <div><Mono size={30} color={C.dim}>uploads/ の中身  </Mono><Mono size={36} color={GREEN}>{rec.files_in_uploads.length ? rec.files_in_uploads.join(' ') : '（空）'}</Mono></div>
            </div>
          )}
        </Card>
      </Pop>
    </Center>
  );
};

/* ---------- 場面 ---------- */

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={40}>
      <Card style={{ width: 1200 }}>
        <Label>プロフィール画像を選ぶ</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <div style={{ fontSize: 90 }}>📄</div>
          <Mono size={60} color={C.red}>{REC.exercise_attack.filename}</Mono>
          <Pop d={at(0.25)}><Sticker color={C.gold} size={34} rotate={0}>アップロード</Sticker></Pop>
        </div>
      </Card>
      <Pop d={at(0.5)} style={{ transform: `translateX(${shake(f, at(0.55), 14, 14)}px)` }}>
        <Sticker color={C.red}>🖥 サーバーで 他人のプログラムが動く</Sticker>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={110}>危険なファイルのアップロード</Title>
      <Pop d={at(0.2)}><Title size={50} color={C.dim}>Unrestricted Upload of File with Dangerous Type</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE Top 25（2025） 第 12 位</Sticker></Pop>
    </Center>
  );
};

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="🙂" name="お客さん" />
      <Pop d={at(0.12)}><div style={{ fontSize: 110 }}>💾</div></Pop>
      <Arrow d={at(0.2)} />
      <Actor icon="🧑‍💼" name="店員" d={at(0.25)} />
      <Arrow d={at(0.4)} />
      <Actor icon="🖥" name="店のパソコン" d={at(0.45)} />
      <Arrow d={at(0.6)} />
      <Actor icon="🖨" name="印刷" d={at(0.65)} />
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><FileChip icon="🖼" name="猫.jpg" /></Pop>
      <Arrow d={at(0.25)} />
      <Pop d={at(0.3)}>
        <Pc>
          <div style={{ fontSize: 150 }}>🐱</div>
          <Title size={40} color={GREEN}>写真が開いた</Title>
        </Pc>
      </Pop>
      <Pop d={at(0.6)}><div style={{ fontSize: 110, color: GREEN }}>✓</div></Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Pop style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 160 }}>😈</div>
        <div style={{ fontSize: 100 }}>💾</div>
      </Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.3)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Label>USB の中身</Label>
        <FileChip icon="⚙️" name="program.exe" evil />
        <Sticker color={C.red} size={34}>写真ではない</Sticker>
      </Pop>
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center row gap={50}>
      <Pop><Title size={56}>🧑‍💼 確かめずに開く</Title></Pop>
      <Arrow d={at(0.15)} />
      <Pop d={at(0.2)} style={{ transform: `translateX(${shake(f, at(0.45), 16, 16)}px)` }}>
        <Pc color={C.red}>
          <div style={{ fontSize: 130 }}>⚙️💥</div>
          <Title size={40} color={C.red}>他人のプログラムが動く</Title>
        </Pc>
      </Pop>
    </Center>
  );
};

const Map = () => {
  const at = useAt();
  const rows: [string, string, string][] = [
    ['💾 USB のファイル', 'アップロードされたファイル', 'shell.php'],
    ['🖥 店のパソコン', 'Web サーバー', 'uploads/'],
  ];
  return (
    <Center gap={34}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.12 + i * 0.3)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, width: 1500 }}>
            <Card style={{ width: 560 }}><Title size={50}>{a}</Title></Card>
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
      <div style={{ display: 'flex', gap: 50 }}>
        {[
          ['何のファイル？', '✗ 見ていない'],
          ['名前は？', '✗ そのまま使う'],
        ].map(([q, a], i) => (
          <Pop key={q} d={at(0.1 + i * 0.25)}>
            <Card color={C.red} style={{ width: 640, textAlign: 'center' }}>
              <Title size={54}>{q}</Title>
              <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 70, color: C.red }}>{a}</div>
            </Card>
          </Pop>
        ))}
      </div>
      <Pop d={at(0.65)}><Title size={60} color={C.gold}>受け取って そのまま置いてしまう</Title></Pop>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[9, 11]} at={at(0.3)} fontSize={40} />
    </Center>
  );
};

const Normal = () => <UploadFlow rec={REC.exercise_normal} fn="save_upload" mark="none" />;
const Attack = () => <UploadFlow rec={REC.exercise_attack} fn="save_upload" mark="bad" />;

const Why1 = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Label>もし PHP が動くサーバーで、uploads/ が公開されていたら（説明の図。実行はしていない）</Label></Pop>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
        <Pop d={at(0.1)}>
          <Card style={{ width: 640 }}>
            <Label>開く URL</Label>
            <Mono size={36} color={C.gold}>/uploads/shell.php?c=命令</Mono>
          </Card>
        </Pop>
        <Arrow d={at(0.3)} />
        <Pop d={at(0.35)}>
          <Card color={C.red} style={{ width: 640 }}>
            <Label>サーバーの上で</Label>
            <Mono size={34} color={C.red}>system(命令) が動く</Mono>
          </Card>
        </Pop>
      </div>
    </Center>
  );
};

const Why2 = () => {
  const at = useAt();
  const items: [string, string][] = [
    ['🗄', 'データを盗む'],
    ['✏️', '書き換える'],
    ['🎯', '攻撃の足場'],
  ];
  return (
    <Center gap={40}>
      <div style={{ display: 'flex', gap: 40 }}>
        {items.map(([i, t], n) => (
          <Pop key={t} d={at(0.05 + n * 0.2)}>
            <Card color={C.red} style={{ width: 440, textAlign: 'center' }}>
              <div style={{ fontSize: 130 }}>{i}</div>
              <Title size={48}>{t}</Title>
            </Card>
          </Pop>
        ))}
      </div>
      <Pop d={at(0.7)}><Title size={60} color={C.gold}>サーバーを乗っ取られたのと同じ</Title></Pop>
    </Center>
  );
};

const Wp = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Sticker color={C.red}>2020</Sticker></Pop>
      <Pop d={at(0.12)}><Title size={96}>WordPress「File Manager」</Title></Pop>
      <Pop d={at(0.3)}><Mono size={60} color={C.gold}>CVE-2020-25213</Mono></Pop>
      <Pop d={at(0.45)}><Title size={46} color={C.dim}>🔓 ログインなしで PHP ファイルを上げて 実行できた</Title></Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  const chips: [string, string][] = [
    ['AV:N', 'ネットワーク越し'],
    ['PR:N', 'ログイン不要'],
    ['UI:N', '誰の操作も要らない'],
  ];
  return (
    <Center gap={50}>
      <Pop>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}>
          <Mono size={56} color={C.dim}>NVD CVSS 3.1</Mono>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 200, color: C.red }}>9.8</span>
          <Sticker color={C.red}>Critical</Sticker>
        </div>
      </Pop>
      <div style={{ display: 'flex', gap: 30 }}>
        {chips.map(([k, v], i) => (
          <Pop key={k} d={at(0.3 + i * 0.15)}>
            <Card color={C.fire} style={{ textAlign: 'center', width: 460 }}>
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
      <Pop><Title size={70}>2020 年 8〜9 月 実際の攻撃に使われた</Title></Pop>
      <Pop d={at(0.4)}>
        <Card color={C.red}>
          <Title size={56}>CISA Known Exploited Vulnerabilities</Title>
          <Label color={C.dim}>悪用が確認された脆弱性の一覧（2021-11-03 に追加）</Label>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop5 = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Title size={60}>🧑‍💼 受け付けるのは写真だけ</Title></Pop>
      <div style={{ display: 'flex', gap: 30 }}>
        {[
          ['🖼', '猫.jpg', true],
          ['🖼', 'family.png', true],
          ['⚙️', 'program.exe', false],
          ['📄', 'shell.php', false],
        ].map(([i, n, ok], k) => (
          <Pop key={n as string} d={at(0.15 + k * 0.12)} style={{ textAlign: 'center' }}>
            <FileChip icon={i as string} name={n as string} evil={!ok} ok={!!ok} />
            <div style={{ fontSize: 70, color: ok ? GREEN : C.red }}>{ok ? '✓' : '✗'}</div>
          </Pop>
        ))}
      </div>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><FileChip icon="🖼" name="photo.png" /></Pop>
      <Arrow d={at(0.15)} />
      <Pop d={at(0.2)}>
        <Card color={GREEN} style={{ width: 700, textAlign: 'center' }}>
          <div style={{ fontSize: 110 }}>🔍</div>
          <Title size={46}>開く前に 先頭を見る</Title>
          <Title size={38} color={C.dim}>本当に写真の形？</Title>
        </Card>
      </Pop>
    </Center>
  );
};

const Shop7 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><FileChip icon="🖼" name="猫.jpg" /></Pop>
      <Arrow d={at(0.2)} />
      <Pop d={at(0.25)}><FileChip icon="🖼" name="000123.jpg" ok /></Pop>
      <Pop d={at(0.5)}><Sticker color={GREEN}>店が決めた名前</Sticker></Pop>
    </Center>
  );
};

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel
        snippet={K.AFTER}
        steps={[
          { lines: [22, 23], at: at(0.12) },
          { lines: [25, 26], at: at(0.3) },
          { lines: [27, 28], at: at(0.48) },
          { lines: [32], at: at(0.7) },
        ]}
        fontSize={32}
      />
    </Center>
  );
};

const Magic = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <CodePanel snippet={K.MAGIC} highlight={[14]} at={at(0.2)} fontSize={36} width={1300} />
      <Pop d={at(0.45)}>
        <Card color={GREEN} style={{ width: 1300 }}>
          <Label>cat.png の先頭 8 バイト（記録）</Label>
          <Mono size={46} color={GREEN}>{REC.exercise_normal.data}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const FixRec = () => <UploadFlow rec={REC.solution_attack} fn="直した save_upload" mark="good" />;
const FixNormal = () => <UploadFlow rec={REC.solution_normal} fn="直した save_upload" mark="good" />;

const Layers = () => {
  const at = useAt();
  const items: [string, string, string][] = [
    ['根本対策', '種類と中身を確かめ 名前は付け直す', C.gold],
    ['多層防御', '保存場所ではプログラムを動かさない', C.fn],
    ['多層防御', 'ファイルを配る場所を分ける', C.fn],
    ['多層防御', '大きさに上限を付ける', C.fn],
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
      <Pop><Title size={80} color={C.red}>そのまま受け取る → プログラムが置かれる</Title></Pop>
      <Pop d={at(0.45)}><Title size={80} color={GREEN}>種類と中身を確かめ 名前は付け直す</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  const refs: [string, string][] = [
    ['CWE-434', '危険な種類のファイルのアップロード'],
    ['OWASP Top 10:2025 A06', 'Insecure Design'],
    ['ASVS V5.2.2 / V5.3.2', '中身の検証・保存名の生成'],
  ];
  return (
    <Center gap={26}>
      {refs.map(([k, v], i) => (
        <Pop key={k} d={at(0.1 + i * 0.25)}>
          <Card color={C.fire} style={{ width: 1500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Mono size={50} color={C.gold}>{k}</Mono>
            <Title size={42}>{v}</Title>
          </Card>
        </Pop>
      ))}
    </Center>
  );
};

const Quiz = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1500 }}>
        <Label>上げるファイル</Label>
        <div><Mono size={30} color={C.dim}>名前  </Mono><Mono size={50} color={C.gold}>{REC.solution_quiz.filename}</Mono></div>
        <div><Mono size={30} color={C.dim}>中身  </Mono><Mono size={40} color={C.red}>{REC.solution_quiz.data}</Mono></div>
      </Card>
      <Pop d={at(0.5)}><Title size={66}>.png は許可されている。通る？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  const before = REC.exercise_quiz;
  const after = REC.solution_quiz;
  return (
    <Center gap={28}>
      <Title size={90} color={GREEN}>通らない</Title>
      <Pop d={at(0.2)}>
        <Card color={GREEN} style={{ width: 1600 }}>
          <Label>直した save_upload（記録）</Label>
          <Mono size={40} color={GREEN}>{after.error}</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.5)}>
        <Card color={C.red} style={{ width: 1600 }}>
          <Label>直す前の save_upload（記録）</Label>
          <Mono size={40} color={C.red}>{`uploads/${before.saved} に そのまま保存`}</Mono>
        </Card>
      </Pop>
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
      <Pop d={at(0.4)}><Mono size={40} color={C.dim}>labs/lab05_file_upload</Mono></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="写真プリント店で考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab05_file_upload" />,
  code: Code,
  normal: Normal,
  attack: Attack,
  why1: Why1,
  why2: Why2,
  ch3: () => <ChapterCard no="3" title="実際に起きた事件" />,
  wp: Wp,
  cvss: Cvss,
  damage: Damage,
  ch4: () => <ChapterCard no="4" title="防ぐには" />,
  shop5: Shop5,
  shop6: Shop6,
  shop7: Shop7,
  fix: Fix,
  magic: Magic,
  fixRec: FixRec,
  fixNormal: FixNormal,
  layers: Layers,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: Outro,
};
