import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Background } from './parts/Background';
import { SceneLength } from './parts/sceneLength';
import { pop } from './parts/motion';
import type { Line } from './makeVideo';
import { C, FPS, sans } from './theme';

/**
 * 本編（横 1920×1080）の場面と声をそのまま使って、縦型（1080×1920）のショートを作る。
 * 横の場面は縮めて画面の中ほどに置き、上に題名、下に大きな字幕を出す（中央を切り抜かないので字幕やコードが切れない）。
 * 声は本編と同じ public/voice/<name>/<id>.wav。
 */
export interface ShortOptions {
  /** 画面上の題名（例: 危険なファイルのアップロード） */
  title: string;
  /** 題名の上の小さな札（例: CWE-434） */
  tag: string;
  /** 最後の場面の後半に出す案内（例: 実際の事件とクイズは本編で） */
  end: string;
  credit?: string;
}

const PAD = 0.15;
const OVERLAP = 10;
export const SHORT_W = 1080;
export const SHORT_H = 1920;
/** 横の場面の見せ方。左右の余白を少し削り、下の字幕用の空きを切る */
const SRC_W = 1920;
const SRC_H = 1080;
const SHOW_W = 1700; // 場面の中身はほぼ幅 1700 に収まっている
const SHOW_H = 940; // 本編は下 140px ほどを字幕に空けている
const S = SHORT_W / SHOW_W;
const BOX_TOP = 430;
const SUB_TOP = BOX_TOP + SHOW_H * S + 40;

const Push: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, len], [1, 1.03], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

/** 横の場面を縮めて置く窓 */
const SceneBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: BOX_TOP,
      width: SHORT_W,
      height: SHOW_H * S,
      overflow: 'hidden',
      borderTop: `3px solid ${C.line}`,
      borderBottom: `3px solid ${C.line}`,
    }}
  >
    <div style={{ position: 'absolute', left: -((SRC_W - SHOW_W) / 2) * S, top: 0, width: SRC_W, height: SRC_H, transform: `scale(${S})`, transformOrigin: '0 0' }}>
      <Background />
      {children}
    </div>
  </div>
);

const Header: React.FC<{ title: string; tag: string }> = ({ title, tag }) => {
  const f = useCurrentFrame();
  const s = pop(f, 0, 200);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: s, transform: `translateY(${(1 - s) * -30}px)` }}>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 38, color: C.bg, background: C.gold, borderRadius: 12, padding: '6px 22px' }}>{tag}</div>
      <div lang="ja" style={{ fontFamily: sans, fontWeight: 900, fontSize: 76, lineHeight: 1.2, color: C.text, textAlign: 'center', wordBreak: 'auto-phrase' as React.CSSProperties['wordBreak'], textWrap: 'balance' }}>
        {title}
      </div>
    </div>
  );
};

/** 字幕を、場面の窓のすぐ下に大きく出す */
const ShortSubtitle: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: SUB_TOP }}>
    <SubtitleBox text={text} />
  </div>
);
const SubtitleBox: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  const s = pop(f, 2, 260);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '0 50px' }}>
      <div
        lang="ja"
        style={{
          maxWidth: 880,
          fontFamily: sans,
          fontWeight: 900,
          fontSize: 52,
          lineHeight: 1.4,
          color: C.text,
          textAlign: 'center',
          wordBreak: 'auto-phrase' as React.CSSProperties['wordBreak'],
          textWrap: 'balance',
          padding: '16px 34px',
          background: '#000c',
          borderRadius: 18,
          border: `2px solid ${C.line}`,
          transform: `translateY(${(1 - s) * 30}px)`,
          opacity: s,
        }}
      >
        {keepNumbers(text)}
      </div>
    </div>
  );
};

/** 「1 つ」「28 個」などの数と助数詞の間で改行しない */
const keepNumbers = (text: string) =>
  text.split(/(\d[\d.,]*\s?(?:つ|個|回|秒|年|月|日|位|件|文字|万回|点|バイト))/).map((t, i) =>
    i % 2 ? <span key={i} style={{ whiteSpace: 'nowrap' }}>{t}</span> : t,
  );

/** 最後の場面の後半に出す、本編への案内 */
const EndBanner: React.FC<{ text: string; from: number }> = ({ text, from }) => {
  const f = useCurrentFrame();
  const s = pop(f, from, 200);
  if (f < from) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', justifyContent: 'center', opacity: s, transform: `scale(${0.9 + s * 0.1})` }}>
      <div lang="ja" style={{ fontFamily: sans, fontWeight: 900, fontSize: 44, color: C.bg, background: C.fire, borderRadius: 16, padding: '14px 30px', maxWidth: 880, textAlign: 'center', wordBreak: 'auto-phrase' as React.CSSProperties['wordBreak'] }}>
        {text}
      </div>
    </div>
  );
};

export function makeShort(name: string, script: Line[], ids: string[], scenes: Record<string, React.FC>, durations: Record<string, number>, opt: ShortOptions) {
  const lines = ids.map((id) => {
    const l = script.find((x) => x.id === id);
    if (!l || !scenes[id] || durations[id] == null) throw new Error(`short ${name}: ${id} がない`);
    return l;
  });
  const framesOf = (l: Line) => Math.ceil((durations[l.id] + PAD + (l.hold ?? 0)) * FPS);
  const Video: React.FC = () => (
    <AbsoluteFill>
      <Background />
      <Header title={opt.title} tag={opt.tag} />
      <TransitionSeries>
        {lines.flatMap((l, i) => {
          const Scene = scenes[l.id];
          const len = framesOf(l) + OVERLAP;
          const seq = (
            <TransitionSeries.Sequence key={l.id} durationInFrames={len} name={l.id}>
              <SceneLength.Provider value={len}>
                <SceneBox>
                  <Push len={len}>
                    <Scene />
                  </Push>
                </SceneBox>
              </SceneLength.Provider>
              <ShortSubtitle text={l.text} />
              {i === lines.length - 1 && <EndBanner text={opt.end} from={Math.round(len * 0.45)} />}
              <Audio src={staticFile(`voice/${name}/${l.id}.wav`)} />
            </TransitionSeries.Sequence>
          );
          if (i === 0) return [seq];
          return [
            <TransitionSeries.Transition key={`t-${l.id}`} presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: OVERLAP })} />,
            seq,
          ];
        })}
      </TransitionSeries>
      {opt.credit && <div style={{ position: 'absolute', left: 40, top: 70, fontFamily: sans, fontWeight: 500, fontSize: 28, color: C.dim }}>{opt.credit}</div>}
    </AbsoluteFill>
  );
  return { Video, frames: lines.reduce((n, l) => n + framesOf(l) + OVERLAP, 0) - OVERLAP * (lines.length - 1) };
}
