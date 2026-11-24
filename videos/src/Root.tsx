import { Composition } from 'remotion';
import { makeVideo } from './makeVideo';
import { FPS } from './theme';
import { SCRIPT as SQLI } from './videos/sqlInjection/script';
import { SCENES as SQLI_SCENES } from './videos/sqlInjection/Scenes';
import sqliDurations from './videos/sqlInjection/durations.json';
import { SCRIPT as XSS } from './videos/xss/script';
import { SCENES as XSS_SCENES } from './videos/xss/Scenes';
import xssDurations from './videos/xss/durations.json';
import { SCRIPT as IDOR } from './videos/idor/script';
import { SCENES as IDOR_SCENES } from './videos/idor/Scenes';
import idorDurations from './videos/idor/durations.json';
import { SCRIPT as FU } from './videos/fileUpload/script';
import { SCENES as FU_SCENES } from './videos/fileUpload/Scenes';
import fuDurations from './videos/fileUpload/durations.json';

const credit = 'VOICEVOX:青山龍星';
const sqli = makeVideo('sqlInjection', SQLI, SQLI_SCENES, sqliDurations, { credit });
const xss = makeVideo('xss', XSS, XSS_SCENES, xssDurations, { credit });
const idor = makeVideo('idor', IDOR, IDOR_SCENES, idorDurations, { credit });
const fu = makeVideo('fileUpload', FU, FU_SCENES, fuDurations, { credit });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="SqlInjection" component={sqli.Video} durationInFrames={sqli.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="Xss" component={xss.Video} durationInFrames={xss.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="Idor" component={idor.Video} durationInFrames={idor.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="FileUpload" component={fu.Video} durationInFrames={fu.frames} fps={FPS} width={1920} height={1080} />
  </>
);
