import { useCurrentFrame } from 'remotion';
import { C, sans } from '../theme';
import { pop } from './motion';

/** 斜めに貼られる札（Fireship のラベルの感じ） */
export const Sticker: React.FC<{ children: React.ReactNode; delay?: number; rotate?: number; color?: string; size?: number }> = ({
  children,
  delay = 0,
  rotate = -4,
  color = C.gold,
  size = 44,
}) => {
  const f = useCurrentFrame();
  const s = pop(f, delay, 220);
  return (
    <div
      style={{
        display: 'inline-block',
        background: color,
        color: '#111',
        fontFamily: sans,
        fontWeight: 900,
        fontSize: size,
        padding: '10px 26px',
        borderRadius: 10,
        boxShadow: '0 10px 0 #0006',
        transform: `rotate(${rotate}deg) scale(${s})`,
      }}
    >
      {children}
    </div>
  );
};
