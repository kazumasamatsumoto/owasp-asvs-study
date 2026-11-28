import { Composition } from 'remotion';
import { makeVideo } from './makeVideo';
import { makeShort, SHORT_H, SHORT_W } from './makeShort';
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
import { SCRIPT as PS } from './videos/passwordStorage/script';
import { SCENES as PS_SCENES } from './videos/passwordStorage/Scenes';
import psDurations from './videos/passwordStorage/durations.json';
import { SCRIPT as SF } from './videos/sessionFixation/script';
import { SCENES as SF_SCENES } from './videos/sessionFixation/Scenes';
import sfDurations from './videos/sessionFixation/durations.json';
import { SCRIPT as JWT } from './videos/jwtVerification/script';
import { SCENES as JWT_SCENES } from './videos/jwtVerification/Scenes';
import jwtDurations from './videos/jwtVerification/durations.json';
import { SCRIPT as SH } from './videos/securityHeaders/script';
import { SCENES as SH_SCENES } from './videos/securityHeaders/Scenes';
import shDurations from './videos/securityHeaders/durations.json';
import { SCRIPT as CSRF } from './videos/csrf/script';
import { SCENES as CSRF_SCENES } from './videos/csrf/Scenes';
import csrfDurations from './videos/csrf/durations.json';
import { SCRIPT as PT } from './videos/pathTraversal/script';
import { SCENES as PT_SCENES } from './videos/pathTraversal/Scenes';
import ptDurations from './videos/pathTraversal/durations.json';
import { SCRIPT as CI } from './videos/commandInjection/script';
import { SCENES as CI_SCENES } from './videos/commandInjection/Scenes';
import ciDurations from './videos/commandInjection/durations.json';
import { SCRIPT as SSRF } from './videos/ssrf/script';
import { SCENES as SSRF_SCENES } from './videos/ssrf/Scenes';
import ssrfDurations from './videos/ssrf/durations.json';
import { SCRIPT as DESER } from './videos/deserialization/script';
import { SCENES as DESER_SCENES } from './videos/deserialization/Scenes';
import deserDurations from './videos/deserialization/durations.json';
import { SCRIPT as MA } from './videos/missingAuthorization/script';
import { SCENES as MA_SCENES } from './videos/missingAuthorization/Scenes';
import maDurations from './videos/missingAuthorization/durations.json';
import { SCRIPT as CI2 } from './videos/codeInjection/script';
import { SCENES as CI2_SCENES } from './videos/codeInjection/Scenes';
import ci2Durations from './videos/codeInjection/durations.json';

const credit = 'VOICEVOX:青山龍星';
const sqli = makeVideo('sqlInjection', SQLI, SQLI_SCENES, sqliDurations, { credit });
const xss = makeVideo('xss', XSS, XSS_SCENES, xssDurations, { credit });
const idor = makeVideo('idor', IDOR, IDOR_SCENES, idorDurations, { credit });
const fu = makeVideo('fileUpload', FU, FU_SCENES, fuDurations, { credit });
// ショート: 本編の場面と声から、60 秒以内に収まる行だけを選ぶ
const fuShort = makeShort('fileUpload', FU, ['hook', 'attack', 'why1', 'fixRec', 'recap'], FU_SCENES, fuDurations, {
  title: '危険なファイルのアップロード',
  tag: 'CWE-434',
  end: '実際の事件とクイズは本編で',
  credit,
});
const ps = makeVideo('passwordStorage', PS, PS_SCENES, psDurations, { credit });
const sf = makeVideo('sessionFixation', SF, SF_SCENES, sfDurations, { credit });
const jwt = makeVideo('jwtVerification', JWT, JWT_SCENES, jwtDurations, { credit });
const sh = makeVideo('securityHeaders', SH, SH_SCENES, shDurations, { credit });
const csrf = makeVideo('csrf', CSRF, CSRF_SCENES, csrfDurations, { credit });
const pt = makeVideo('pathTraversal', PT, PT_SCENES, ptDurations, { credit });
const ci = makeVideo('commandInjection', CI, CI_SCENES, ciDurations, { credit });
const ssrf = makeVideo('ssrf', SSRF, SSRF_SCENES, ssrfDurations, { credit });
const deser = makeVideo('deserialization', DESER, DESER_SCENES, deserDurations, { credit });
const ma = makeVideo('missingAuthorization', MA, MA_SCENES, maDurations, { credit });
const ci2 = makeVideo('codeInjection', CI2, CI2_SCENES, ci2Durations, { credit });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="SqlInjection" component={sqli.Video} durationInFrames={sqli.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="Xss" component={xss.Video} durationInFrames={xss.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="Idor" component={idor.Video} durationInFrames={idor.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="FileUpload" component={fu.Video} durationInFrames={fu.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="SessionFixation" component={sf.Video} durationInFrames={sf.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="JwtVerification" component={jwt.Video} durationInFrames={jwt.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="SecurityHeaders" component={sh.Video} durationInFrames={sh.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="PasswordStorage" component={ps.Video} durationInFrames={ps.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="FileUploadShort" component={fuShort.Video} durationInFrames={fuShort.frames} fps={FPS} width={SHORT_W} height={SHORT_H} />
    <Composition id="Csrf" component={csrf.Video} durationInFrames={csrf.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="PathTraversal" component={pt.Video} durationInFrames={pt.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="CommandInjection" component={ci.Video} durationInFrames={ci.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="Ssrf" component={ssrf.Video} durationInFrames={ssrf.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="Deserialization" component={deser.Video} durationInFrames={deser.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="MissingAuthorization" component={ma.Video} durationInFrames={ma.frames} fps={FPS} width={1920} height={1080} />
    <Composition id="CodeInjection" component={ci2.Video} durationInFrames={ci2.frames} fps={FPS} width={1920} height={1080} />
  </>
);
