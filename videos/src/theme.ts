import { loadFont as loadSans } from '@remotion/google-fonts/NotoSansJP';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

export const sans = loadSans('normal', { weights: ['500', '900'] }).fontFamily;
export const mono = loadMono('normal', { weights: ['500', '800'] }).fontFamily;

/** Fireship 風: ほぼ黒の地に、炎の橙と黄、Angular の赤を差し色に */
export const C = {
  bg: '#0d0d12',
  panel: '#16161f',
  line: '#2a2a3a',
  text: '#f4f4f6',
  dim: '#8b8ba0',
  fire: '#ff6b2c',
  gold: '#ffd23f',
  red: '#ff2d55',
  kw: '#ff79c6',
  str: '#a5e844',
  fn: '#7dd3fc',
  num: '#ffd23f',
  comment: '#6b6b80',
};

export const FPS = 30;
