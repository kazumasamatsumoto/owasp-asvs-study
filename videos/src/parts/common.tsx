// 本編の場面で使い回す小さな部品（9 本目以降の動画で使う）
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../theme';
import { enter, pop } from './motion';

export const GREEN = '#4ade80';

export const Center: React.FC<{ children: React.ReactNode; row?: boolean; gap?: number }> = ({ children, row, gap = 0 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: row ? 'row' : 'column', gap, padding: '60px 80px 220px', ...enter(f) }}>
      {children}
    </AbsoluteFill>
  );
};
export const Pop: React.FC<{ d?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ d = 0, children, style }) => {
  const f = useCurrentFrame();
  const s = pop(f, d);
  return <div style={{ transform: `scale(${s})`, opacity: Math.min(1, s * 1.5), ...style }}>{children}</div>;
};
export const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 96, color = C.text }) => (
  <div style={{ fontFamily: sans, fontWeight: 900, fontSize: size, color, textAlign: 'center', lineHeight: 1.2 }}>{children}</div>
);
export const Card: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.line, style }) => (
  <div style={{ background: C.panel, border: `3px solid ${color}`, borderRadius: 24, padding: '28px 40px', boxShadow: '0 24px 60px #0008', ...style }}>{children}</div>
);
export const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.dim }) => (
  <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 30, color, marginBottom: 10 }}>{children}</div>
);
export const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 38, color = C.text }) => (
  <span style={{ fontFamily: mono, fontWeight: 800, fontVariantLigatures: 'none', fontSize: size, color, whiteSpace: 'pre', wordBreak: 'break-all' }}>{children}</span>
);
export const Arrow: React.FC<{ d?: number; down?: boolean }> = ({ d = 0, down }) => (
  <Pop d={d}>
    <div style={{ fontSize: 70, color: C.fire, fontWeight: 900 }}>{down ? '↓' : '→'}</div>
  </Pop>
);
export const Actor: React.FC<{ icon: string; name: string; d?: number; size?: number }> = ({ icon, name, d = 0, size = 150 }) => (
  <Pop d={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ fontSize: size }}>{icon}</div>
    <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 44, color: C.text, textAlign: 'center' }}>{name}</div>
  </Pop>
);

/** 1 件の試した記録：何を送ったか／結果 */
export const ResultRow: React.FC<{ what: string; input: string; result: string; ok: boolean; bad?: boolean; d?: number; size?: number; width?: number; whatWidth?: number }> = ({
  what,
  input,
  result,
  ok,
  bad,
  d = 0,
  size = 34,
  width = 1650,
  whatWidth = 330,
}) => {
  const color = bad ? C.red : ok ? GREEN : C.dim;
  return (
    <Pop d={d}>
      <Card color={bad ? C.red : ok ? GREEN : C.line} style={{ width, display: 'flex', alignItems: 'center', gap: 26, padding: '16px 30px' }}>
        <div style={{ width: whatWidth, flexShrink: 0 }}><Title size={size}>{what}</Title></div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}><Mono size={size * 0.78} color={C.dim}>{input}</Mono></div>
        <div style={{ flexShrink: 0, textAlign: 'right', maxWidth: 560 }}>
          <Title size={size} color={color}>{result}</Title>
        </div>
      </Card>
    </Pop>
  );
};

/** 参照の一覧 */
export const RefList: React.FC<{ refs: [string, string][]; at: (x: number) => number }> = ({ refs, at }) => (
  <Center gap={22}>
    {refs.map(([k, v], i) => (
      <Pop key={k} d={at(0.05 + i * 0.2)}>
        <Card color={C.fire} style={{ width: 1600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 36px' }}>
          <Mono size={42} color={C.gold}>{k}</Mono>
          <Title size={38}>{v}</Title>
        </Card>
      </Pop>
    ))}
  </Center>
);

/** CVSS の点数と 3 つの指標 */
export const CvssCard: React.FC<{ score: string; sev: string; chips: [string, string][]; at: (x: number) => number; source?: string }> = ({ score, sev, chips, at, source = 'NVD CVSS 3.1' }) => {
  const color = sev === 'Critical' ? C.red : C.fire;
  return (
    <Center gap={50}>
      <Pop>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}>
          <Mono size={56} color={C.dim}>{source}</Mono>
          <span style={{ fontFamily: sans, fontWeight: 900, fontSize: 200, color }}>{score}</span>
          <StickerLite color={color}>{sev}</StickerLite>
        </div>
      </Pop>
      <div style={{ display: 'flex', gap: 30 }}>
        {chips.map(([k, v], i) => (
          <Pop key={k} d={at(0.3 + i * 0.15)}>
            <Card color={C.fire} style={{ textAlign: 'center', width: 480 }}>
              <Mono size={50} color={C.gold}>{k}</Mono>
              <Title size={36}>{v}</Title>
            </Card>
          </Pop>
        ))}
      </div>
    </Center>
  );
};

const StickerLite: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <div style={{ display: 'inline-block', background: color, color: '#111', fontFamily: sans, fontWeight: 900, fontSize: 44, padding: '10px 28px', borderRadius: 10, transform: 'rotate(-4deg)' }}>{children}</div>
);

/** 最後の場面（演習の場所） */
export const OutroCard: React.FC<{ lab: string; at: (x: number) => number }> = ({ lab, at }) => (
  <Center gap={40}>
    <Title size={80}>自分で直してみる</Title>
    <Pop d={at(0.2)}>
      <Card color={C.fire}>
        <Mono size={46} color={C.gold}>github.com/kazumasamatsumoto/owasp-asvs-study</Mono>
      </Card>
    </Pop>
    <Pop d={at(0.4)}><Mono size={40} color={C.dim}>{`labs/${lab}`}</Mono></Pop>
  </Center>
);
