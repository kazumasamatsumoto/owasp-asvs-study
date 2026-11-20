import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { Background } from './parts/Background';
import { Subtitle } from './parts/Subtitle';
import { SceneLength } from './parts/sceneLength';
import { C, FPS, sans } from './theme';

export interface Line {
  id: string;
  text: string;
  yomi: string;
  /** 声のあとに、画面を読む間として足す秒数（その間もカメラは寄り続ける） */
  hold?: number;
}

export interface VideoOptions {
  /** 縦型（9:16）のショート動画 */
  vertical?: boolean;
  /** 画面の隅に出し続けるクレジット（例: VOICEVOX:青山龍星） */
  credit?: string;
}

/** 声と声の間。短くして、止まった感じを出さない */
const PAD = 0.15;
/** 場面の切り替えで前後を重ねるフレーム数。重ねる分だけ各場面を伸ばすので、声は切れない */
const OVERLAP = 10;

/** 場面の間ずっと、ゆっくり寄り続ける（止まって見えないように） */
const Push: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, len], [1, 1.035], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

/** 台本・場面・声の長さから、1 本の動画のコンポーネントと長さを作る。声は public/voice/<name>/<id>.wav */
export function makeVideo(
  name: string,
  script: Line[],
  scenes: Record<string, React.FC>,
  durations: Record<string, number>,
  { vertical = false, credit }: VideoOptions = {},
) {
  const holdOf = (id: string) => script.find((l) => l.id === id)?.hold ?? 0;
  const framesOf = (id: string) => Math.ceil((durations[id] + PAD + holdOf(id)) * FPS);
  // 章の扉（id が ch で始まる）へは横に滑って入り、ほかは溶けるように入れ替える
  const presentationOf = (id: string) => (/^ch\d/.test(id) ? slide({ direction: 'from-right' }) : fade());

  const Video: React.FC = () => (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        {script.flatMap((l, i) => {
          const Scene = scenes[l.id];
          const len = framesOf(l.id) + OVERLAP;
          const seq = (
            <TransitionSeries.Sequence key={l.id} durationInFrames={len} name={l.id}>
              <SceneLength.Provider value={len}>
                <Push len={len}>
                  <Scene />
                </Push>
              </SceneLength.Provider>
              <Subtitle text={l.text} vertical={vertical} />
              <Audio src={staticFile(`voice/${name}/${l.id}.wav`)} />
            </TransitionSeries.Sequence>
          );
          if (i === 0) return [seq];
          return [
            <TransitionSeries.Transition
              key={`t-${l.id}`}
              presentation={presentationOf(l.id)}
              timing={springTiming({ config: { damping: 200 }, durationInFrames: OVERLAP })}
            />,
            seq,
          ];
        })}
      </TransitionSeries>
      {credit && (
        <div style={{ position: 'absolute', left: 36, top: vertical ? 60 : 28, fontFamily: sans, fontWeight: 500, fontSize: 26, color: C.dim }}>{credit}</div>
      )}
    </AbsoluteFill>
  );
  // 重ねた分（切り替え 1 回につき OVERLAP）だけ全体は短くなる
  return { Video, frames: script.reduce((n, l) => n + framesOf(l.id) + OVERLAP, 0) - OVERLAP * (script.length - 1) };
}
