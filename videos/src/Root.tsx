import { Composition } from 'remotion';
import { makeVideo } from './makeVideo';
import { FPS } from './theme';
import { SCRIPT as SQLI } from './videos/sqlInjection/script';
import { SCENES as SQLI_SCENES } from './videos/sqlInjection/Scenes';
import sqliDurations from './videos/sqlInjection/durations.json';

const credit = 'VOICEVOX:青山龍星';
const sqli = makeVideo('sqlInjection', SQLI, SQLI_SCENES, sqliDurations, { credit });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="SqlInjection" component={sqli.Video} durationInFrames={sqli.frames} fps={FPS} width={1920} height={1080} />
  </>
);
