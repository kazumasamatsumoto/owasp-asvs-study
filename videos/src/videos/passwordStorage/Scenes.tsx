import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../../theme';
import { ChapterCard } from '../../parts/ChapterCard';
import { CodePanel } from '../../parts/CodePanel';
import { Sticker } from '../../parts/Sticker';
import { enter, pop, shake } from '../../parts/motion';
import { useAt } from '../../parts/sceneLength';
import * as K from './code';
import REC from '../../../recorded/lab03.json';

const GREEN = '#4ade80';
const EX = REC.exercise;
const SO = REC.solution;
const man = (n: number) => `約 ${Math.round(n / 10000)} 万回`;

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
  <span style={{ fontFamily: mono, fontWeight: 800, fontVariantLigatures: 'none', fontSize: size, color, whiteSpace: 'pre', wordBreak: 'break-all' }}>{children}</span>
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
/** 保存値 1 行（長い scrypt の値は折り返す） */
const Stored: React.FC<{ who: string; value: string; color: string; size?: number }> = ({ who, value, color, size = 34 }) => (
  <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
    <Mono size={34} color={C.dim}>{who.padEnd(6)}</Mono>
    <span style={{ fontFamily: mono, fontWeight: 800, fontVariantLigatures: 'none', fontSize: size, color, wordBreak: 'break-all' }}>{value}</span>
  </div>
);

/* ---------- 場面 ---------- */

const Hook = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={36}>
      <Card style={{ width: 1300 }}>
        <Label>盗まれた保存値</Label>
        <Mono size={56} color={C.gold}>{EX.alice}</Mono>
      </Card>
      <Arrow d={at(0.2)} down />
      <Pop d={at(0.3)}><Title size={46} color={C.dim}>よくあるパスワード {REC.dictionary_size} 個と比べる</Title></Pop>
      <Pop d={at(0.55)} style={{ transform: `translateX(${shake(f, at(0.6), 14, 14)}px)` }}>
        <Sticker color={C.red}>{`🔓 ${EX.crack.tries} 個目で「${EX.crack.found}」`}</Sticker>
      </Pop>
    </Center>
  );
};

const What = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Title size={120}>パスワードの保存</Title>
      <Pop d={at(0.2)}><Title size={50} color={C.dim}>Use of Password Hash With Insufficient Computational Effort</Title></Pop>
      <Pop d={at(0.5)}><Sticker>CWE-916</Sticker></Pop>
    </Center>
  );
};

const Juice: React.FC<{ fruit: string; extra?: string; color?: string; label?: string }> = ({ fruit, extra, color = '#f59e0b', label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <div style={{ fontSize: 80 }}>{fruit}{extra ?? ''}</div>
    <div style={{ fontSize: 60, color: C.fire, fontWeight: 900 }}>↓</div>
    <div style={{ width: 120, height: 150, borderRadius: '0 0 30px 30px', border: '6px solid #e5e7eb', background: color }} />
    {label && <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 32, color: C.text }}>{label}</div>}
  </div>
);

const Shop1 = () => {
  const at = useAt();
  return (
    <Center row gap={40}>
      <Actor icon="🙂" name="会員" />
      <Pop d={at(0.12)}><Title size={50} color={C.gold}>「りんご」</Title></Pop>
      <Arrow d={at(0.2)} />
      <Actor icon="🌀" name="ミキサー" d={at(0.3)} />
      <Arrow d={at(0.45)} />
      <Pop d={at(0.5)}><Juice fruit="🍎" label="名簿に保管" /></Pop>
    </Center>
  );
};

const Shop2 = () => {
  const at = useAt();
  return (
    <Center row gap={50}>
      <Pop><Juice fruit="🍎" label="今つくった" /></Pop>
      <Pop d={at(0.25)}><Title size={90} color={GREEN}>＝</Title></Pop>
      <Pop d={at(0.3)}><Juice fruit="📒" label="保管していた" /></Pop>
      <Pop d={at(0.6)}><Sticker color={GREEN}>本人 ✓</Sticker></Pop>
    </Center>
  );
};

const Shop3 = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Title size={56}>😈 よくある果物を 片っぱしから</Title></Pop>
      <div style={{ display: 'flex', gap: 30 }}>
        {[
          ['🍌', '#fde047', false],
          ['🍇', '#7c3aed', false],
          ['🍊', '#fb923c', false],
          ['🍎', '#f59e0b', true],
        ].map(([fr, col, hit], i) => (
          <Pop key={fr as string} d={at(0.15 + i * 0.15)} style={{ textAlign: 'center' }}>
            <Juice fruit={fr as string} color={col as string} />
            <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 64, color: hit ? C.red : C.dim }}>{hit ? '一致!' : '✗'}</div>
          </Pop>
        ))}
      </div>
    </Center>
  );
};

const Shop4 = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Sticker color={C.red}>🌀 一瞬で 何百万杯</Sticker></Pop>
      <Pop d={at(0.4)}>
        <div style={{ display: 'flex', gap: 60 }}>
          <Juice fruit="🍎" label="alice" />
          <Juice fruit="🍎" label="bob" />
        </div>
      </Pop>
      <Pop d={at(0.6)}><Title size={50} color={C.gold}>同じ果物なら 同じジュース</Title></Pop>
    </Center>
  );
};

const MapRows: React.FC<{ rows: [string, string, string][] }> = ({ rows }) => {
  const at = useAt();
  return (
    <Center gap={30}>
      {rows.map(([a, b, c], i) => (
        <Pop key={a} d={at(0.1 + i * 0.25)}>
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

const Map = () => (
  <MapRows
    rows={[
      ['🗣 合言葉', 'パスワード', REC.password],
      ['🥤 ジュース', 'ハッシュ（保存値）', EX.alice],
      ['🌀 ミキサー', 'MD5', 'hashlib.md5'],
    ]}
  />
);

const Core = () => {
  const at = useAt();
  return (
    <Center gap={50}>
      <div style={{ display: 'flex', gap: 50 }}>
        {[
          ['計算の重さ', '✗ 軽すぎる'],
          ['人ごとの違い', '✗ 付けていない'],
        ].map(([q, a], i) => (
          <Pop key={q} d={at(0.1 + i * 0.25)}>
            <Card color={C.red} style={{ width: 640, textAlign: 'center' }}>
              <Title size={54}>{q}</Title>
              <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 70, color: C.red }}>{a}</div>
            </Card>
          </Pop>
        ))}
      </div>
    </Center>
  );
};

const Code = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.BEFORE} highlight={[14, 15]} at={at(0.3)} fontSize={40} />
    </Center>
  );
};

const Same = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card style={{ width: 1500 }}>
          <Label>登録したパスワード</Label>
          <Mono size={50} color={C.gold}>alice: {REC.password}   bob: {REC.password}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.15)} down />
      <Pop d={at(0.2)}>
        <Card color={C.red} style={{ width: 1500 }}>
          <Label>保存された値（記録）</Label>
          <Stored who="alice" value={EX.alice} color={C.red} size={44} />
          <Stored who="bob" value={EX.bob} color={C.red} size={44} />
        </Card>
      </Pop>
      <Pop d={at(0.55)}><Sticker color={C.red}>まったく同じ</Sticker></Pop>
    </Center>
  );
};

const VerifyRow: React.FC<{ typed: string; ok: boolean; fn: string; d: number; bad?: boolean }> = ({ typed, ok, fn, d, bad }) => (
  <Pop d={d}>
    <Card color={bad ? C.red : GREEN} style={{ width: 1500 }}>
      <Label>{fn}（記録）</Label>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Mono size={44} color={C.gold}>{typed}</Mono>
        <Mono size={50} color={bad ? C.red : GREEN}>{ok ? 'True  ログインできた' : 'False  ログインできない'}</Mono>
      </div>
    </Card>
  </Pop>
);

const Lower = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Title size={50} color={C.dim}>登録は {REC.password}。打ったのは 小文字だけ</Title></Pop>
      <VerifyRow typed={REC.password.toLowerCase()} ok={EX.verify_lowercase} fn="verify_password" d={at(0.25)} bad />
    </Center>
  );
};

const Crack = () => {
  const at = useAt();
  const f = useCurrentFrame();
  return (
    <Center gap={26}>
      <Pop>
        <Card style={{ width: 1500 }}>
          <Label>盗まれた保存値</Label>
          <Mono size={46} color={C.gold}>{EX.alice}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.15)} down />
      <Pop d={at(0.2)}>
        <Card style={{ width: 1500 }}>
          <Label>試す候補：labs の common_passwords.txt（{REC.dictionary_size} 個）</Label>
          <Mono size={34} color={C.dim}>123456, 123456789, 12345678, password, qwerty123 …</Mono>
        </Card>
      </Pop>
      <Pop d={at(0.45)} style={{ transform: `translateX(${shake(f, at(0.5), 12, 12)}px)` }}>
        <Card color={C.red} style={{ width: 1500 }}>
          <Label>結果（記録）</Label>
          <Mono size={48} color={C.red}>{`${EX.crack.tries} 個目で一致 → ${EX.crack.found}`}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Speed = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Label>この PC で測った MD5 の速さ（記録）</Label></Pop>
      <Pop d={at(0.1)}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 60, color: C.text }}>1 秒に</span>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 180, color: C.red }}>{man(EX.hashes_per_sec)}</span>
        </div>
      </Pop>
      <Pop d={at(0.5)}><Title size={56} color={C.gold}>候補が何億個あっても すぐ終わる</Title></Pop>
    </Center>
  );
};

const Cve = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Mono size={64} color={C.gold}>CVE-2019-9080</Mono></Pop>
      <Pop d={at(0.15)}><Title size={96}>DomainMOD</Title></Pop>
      <Pop d={at(0.3)}><Title size={46} color={C.dim}>ドメイン管理ツール（4.14.0 より前）</Title></Pop>
      <Pop d={at(0.5)}><Sticker color={C.red}>ソルトなしの MD5 で パスワードを保存</Sticker></Pop>
    </Center>
  );
};

const Cvss = () => {
  const at = useAt();
  const chips: [string, string][] = [
    ['AV:N', 'ネットワーク越し'],
    ['PR:N', 'ログイン不要'],
    ['C:H', '秘密が大きく漏れる'],
  ];
  return (
    <Center gap={50}>
      <Pop>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}>
          <Mono size={56} color={C.dim}>NVD CVSS 3.1</Mono>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 200, color: C.fire }}>7.5</span>
          <Sticker color={C.fire}>High</Sticker>
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

const Shop5 = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop><Title size={56}>🧂 ひとりずつ 違う隠し味</Title></Pop>
      <div style={{ display: 'flex', gap: 80 }}>
        <Pop d={at(0.2)}><Juice fruit="🍎" extra="🌿" color="#16a34a" label="alice" /></Pop>
        <Pop d={at(0.35)}><Juice fruit="🍎" extra="🌶" color="#dc2626" label="bob" /></Pop>
      </div>
      <Pop d={at(0.6)}><Title size={48} color={GREEN}>同じ合言葉でも 別のジュース</Title></Pop>
    </Center>
  );
};

const Shop6 = () => {
  const at = useAt();
  return (
    <Center row gap={60}>
      <Pop style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 150 }}>🐢🌀</div>
        <Title size={46}>わざと重いミキサー</Title>
      </Pop>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        <Pop d={at(0.25)}><Card color={GREEN}><Title size={44}>🧑‍💼 受付：1 杯でいい</Title></Card></Pop>
        <Pop d={at(0.45)}><Card color={C.red}><Title size={44}>😈 泥棒：何百万杯は無理</Title></Card></Pop>
      </div>
    </Center>
  );
};

const Map2 = () => (
  <MapRows
    rows={[
      ['🧂 隠し味', 'ソルト', 'os.urandom(16)'],
      ['🐢 重いミキサー', '計算の重い関数', 'hashlib.scrypt'],
    ]}
  />
);

const Fix = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel
        snippet={K.AFTER}
        steps={[
          { lines: [37], at: at(0.12) },
          { lines: [38, 33], at: at(0.35) },
          { lines: [40], at: at(0.65) },
        ]}
        fontSize={30}
      />
    </Center>
  );
};

const Params = () => {
  const at = useAt();
  return (
    <Center>
      <CodePanel snippet={K.PARAMS} highlight={[16, 17]} at={at(0.25)} fontSize={40} width={1500} />
    </Center>
  );
};

const FixSame = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card style={{ width: 1600 }}>
          <Label>直した hash_password に 2 回渡す</Label>
          <Mono size={50} color={C.gold}>{REC.password}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.15)} down />
      <Pop d={at(0.2)}>
        <Card color={GREEN} style={{ width: 1600 }}>
          <Label>保存された値（記録）</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Stored who="1 回目" value={SO.alice} color={GREEN} size={30} />
            <Stored who="2 回目" value={SO.bob} color={GREEN} size={30} />
          </div>
        </Card>
      </Pop>
      <Pop d={at(0.6)}><Sticker color={GREEN}>別物になった</Sticker></Pop>
    </Center>
  );
};

const FixCrack = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Label>同じ {REC.dictionary_size} 個を 直した verify_password で試す（記録）</Label></Pop>
      <div style={{ display: 'flex', gap: 40 }}>
        <Pop d={at(0.1)}>
          <Card color={C.red} style={{ width: 700, textAlign: 'center' }}>
            <Label>直す前（MD5）</Label>
            <Title size={56} color={C.red}>{`1 秒に ${man(EX.hashes_per_sec)}`}</Title>
            <Mono size={34} color={C.dim}>{`${EX.crack.tries} 個目で一致`}</Mono>
          </Card>
        </Pop>
        <Pop d={at(0.35)}>
          <Card color={GREEN} style={{ width: 700, textAlign: 'center' }}>
            <Label>直した後（scrypt）</Label>
            <Title size={56} color={GREEN}>{`1 秒に ${SO.hashes_per_sec} 回`}</Title>
            <Mono size={34} color={C.dim}>{`${SO.crack.tries} 個で 約 ${Math.round(SO.crack.seconds)} 秒`}</Mono>
          </Card>
        </Pop>
      </div>
    </Center>
  );
};

const Layers = () => {
  const at = useAt();
  const items: [string, string, string][] = [
    ['根本対策', 'ソルト付きの 重い関数で保存', C.gold],
    ['多層防御', 'よくあるパスワードは登録させない', C.fn],
    ['多層防御', '切り詰めない・小文字にしない', C.fn],
    ['多層防御', '長いパスワードも許す（64 文字以上）', C.fn],
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

const Reject = () => {
  const at = useAt();
  return (
    <Center gap={30}>
      <Pop>
        <Card style={{ width: 1500 }}>
          <Label>登録しようとしたパスワード</Label>
          <Mono size={56} color={C.gold}>{REC.password}</Mono>
        </Card>
      </Pop>
      <Arrow d={at(0.15)} down />
      <Pop d={at(0.2)}>
        <Card color={GREEN} style={{ width: 1500 }}>
          <Label>直した validate_password（記録）</Label>
          <Mono size={44} color={GREEN}>{SO.validate}</Mono>
        </Card>
      </Pop>
    </Center>
  );
};

const Recap = () => {
  const at = useAt();
  return (
    <Center gap={40}>
      <Pop><Title size={80} color={C.red}>速いハッシュ → すぐ当てられる</Title></Pop>
      <Pop d={at(0.45)}><Title size={80} color={GREEN}>ソルト ＋ 重い計算で保存</Title></Pop>
    </Center>
  );
};

const Refs = () => {
  const at = useAt();
  const refs: [string, string][] = [
    ['CWE-916', '計算の軽すぎるパスワードハッシュ'],
    ['OWASP Top 10:2025 A04', 'Cryptographic Failures'],
    ['ASVS V11.4.2 / V6.2.4', '重い KDF で保存・よくある PW を拒否'],
  ];
  return (
    <Center gap={26}>
      {refs.map(([k, v], i) => (
        <Pop key={k} d={at(0.1 + i * 0.25)}>
          <Card color={C.fire} style={{ width: 1600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Mono size={46} color={C.gold}>{k}</Mono>
            <Title size={40}>{v}</Title>
          </Card>
        </Pop>
      ))}
    </Center>
  );
};

const Quiz = () => {
  const at = useAt();
  return (
    <Center gap={36}>
      <Sticker>QUIZ</Sticker>
      <Card style={{ width: 1500 }}>
        <Label>直す前のコード</Label>
        <div><Mono size={30} color={C.dim}>登録  </Mono><Mono size={48} color={C.gold}>{REC.quiz_registered}</Mono><Mono size={30} color={C.dim}>  （20 文字）</Mono></div>
        <div><Mono size={30} color={C.dim}>入力  </Mono><Mono size={48} color={C.gold}>{REC.quiz_registered}</Mono><Mono size={48} color={C.red}>{REC.quiz_typed.slice(REC.quiz_registered.length)}</Mono></div>
      </Card>
      <Pop d={at(0.5)}><Title size={66}>後ろに足して打つと 通る？</Title></Pop>
    </Center>
  );
};

const Answer = () => {
  const at = useAt();
  return (
    <Center gap={28}>
      <Title size={90} color={C.red}>通ってしまう</Title>
      <VerifyRow typed={REC.quiz_typed} ok={EX.quiz_verify_longer} fn="直す前の verify_password" d={at(0.2)} bad />
      <Pop d={at(0.45)}><Mono size={40} color={C.dim}>hash_password(pw[:20]) … 先頭 20 文字だけで比べている</Mono></Pop>
      <VerifyRow typed={REC.quiz_typed} ok={SO.quiz_verify_longer} fn="直した verify_password" d={at(0.65)} />
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
      <Pop d={at(0.4)}><Mono size={40} color={C.dim}>labs/lab03_password_storage</Mono></Pop>
    </Center>
  );
};

export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  what: What,
  ch1: () => <ChapterCard no="1" title="ジュースで考える" />,
  shop1: Shop1,
  shop2: Shop2,
  shop3: Shop3,
  shop4: Shop4,
  map: Map,
  core: Core,
  ch2: () => <ChapterCard no="2" title="実際に動かしてみる" sub="labs/lab03_password_storage" />,
  code: Code,
  same: Same,
  lower: Lower,
  crack: Crack,
  speed: Speed,
  ch3: () => <ChapterCard no="3" title="実際に報告された脆弱性" />,
  cve: Cve,
  cvss: Cvss,
  ch4: () => <ChapterCard no="4" title="防ぐには" />,
  shop5: Shop5,
  shop6: Shop6,
  map2: Map2,
  fix: Fix,
  params: Params,
  fixSame: FixSame,
  fixCrack: FixCrack,
  layers: Layers,
  reject: Reject,
  recap: Recap,
  refs: Refs,
  quiz: Quiz,
  answer: Answer,
  outro: Outro,
};
