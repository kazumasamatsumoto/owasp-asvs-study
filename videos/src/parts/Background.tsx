import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../theme';

/** ゆっくり流れる方眼と、左上・右下の炎色のにじみ */
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const shift = (f * 0.6) % 80;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line}55 1px, transparent 1px), linear-gradient(90deg, ${C.line}55 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          backgroundPosition: `${shift}px ${shift}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 12% 10%, ${C.fire}33, transparent 38%), radial-gradient(circle at 90% 95%, ${C.red}2a, transparent 40%)`,
        }}
      />
    </AbsoluteFill>
  );
};
