import { interpolate, spring } from 'remotion';
import { FPS } from '../theme';

/** 弾んで出る（0 → 1）。delay はフレーム */
export const pop = (frame: number, delay = 0, stiffness = 180) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping: 12, stiffness, mass: 0.6 } });

/** 場面の入り: 最初の数フレームで少し大きい所から寄る */
export const enter = (frame: number) => ({
  opacity: interpolate(frame, [0, 4], [0, 1], { extrapolateRight: 'clamp' }),
  transform: `scale(${interpolate(frame, [0, 7], [1.08, 1], { extrapolateRight: 'clamp' })})`,
});

/** 強調のときの小さな揺れ */
export const shake = (frame: number, from: number, len = 10, amp = 10) => {
  const t = frame - from;
  if (t < 0 || t > len) return 0;
  return Math.sin(t * 2.2) * amp * (1 - t / len);
};
