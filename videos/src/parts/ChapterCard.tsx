import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../theme';
import { pop } from './motion';

/** 章の扉。番号と題を大きく出す */
export const ChapterCard: React.FC<{ no: string; title: string; sub?: string }> = ({ no, title, sub }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
      <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 40, color: C.fire, letterSpacing: 8, opacity: pop(f) }}>CHAPTER</div>
      <div
        style={{
          marginTop: 10,
          fontFamily: sans,
          fontWeight: 900,
          fontSize: 200,
          lineHeight: 1,
          color: '#111',
          background: C.gold,
          borderRadius: 30,
          padding: '10px 60px',
          boxShadow: `0 18px 0 ${C.fire}`,
          transform: `scale(${pop(f, 4, 240)}) rotate(-3deg)`,
        }}
      >
        {no}
      </div>
      <div style={{ marginTop: 70, fontFamily: sans, fontWeight: 900, fontSize: 84, color: C.text, transform: `scale(${pop(f, 14)})` }}>{title}</div>
      {sub && <div style={{ marginTop: 20, fontFamily: mono, fontSize: 36, color: C.dim, opacity: pop(f, 24) }}>{sub}</div>}
    </AbsoluteFill>
  );
};
