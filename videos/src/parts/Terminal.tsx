import { interpolate, useCurrentFrame } from 'remotion';
import { C, mono } from '../theme';
import { pop } from './motion';

/** 行ごとの色。Vitest の出力の見出しに合わせる */
function colorOf(line: string): string {
  if (/✓|passed|✔/.test(line) && !/failed/.test(line)) return '#4ade80';
  if (/×|FAIL|failed|✘|ERROR|AssertionError/.test(line)) return C.red;
  if (/^Expected/.test(line.trim())) return '#4ade80';
  if (/^Received/.test(line.trim())) return C.red;
  if (/^\$ /.test(line)) return C.text;
  return C.dim;
}

/** 記録したターミナルの出力を、上から順に流す（at から 1 行ずつ） */
export const Terminal: React.FC<{ lines: string[]; at?: number; perLine?: number; fontSize?: number; width?: number; title?: string }> = ({
  lines,
  at = 6,
  perLine = 3,
  fontSize = 30,
  width = 1600,
  title = 'Terminal',
}) => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, [at, at + lines.length * perLine], [0, lines.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <div style={{ width, background: '#0a0a0e', border: `2px solid ${C.line}`, borderRadius: 20, overflow: 'hidden', transform: `scale(${0.94 + pop(f, 0, 160) * 0.06})`, opacity: pop(f, 0, 160), boxShadow: '0 30px 80px #000a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px', borderBottom: `2px solid ${C.line}` }}>
        {[C.red, C.gold, '#4ade80'].map((c) => (
          <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
        <span style={{ marginLeft: 12, fontFamily: mono, fontSize: 22, color: C.dim }}>{title}</span>
      </div>
      <div style={{ padding: '18px 28px', fontFamily: mono, fontVariantLigatures: 'none', fontSize, lineHeight: 1.5, whiteSpace: 'pre' }}>
        {lines.slice(0, n).map((l, i) => (
          <div key={i} style={{ color: colorOf(l) }}>
            {l.startsWith('$ ') ? (
              <>
                <span style={{ color: C.fire }}>$ </span>
                {l.slice(2)}
              </>
            ) : (
              l || ' '
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
