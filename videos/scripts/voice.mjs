// 台本の yomi を読み上げ、public/voice/<動画>/<id>.wav と src/videos/<動画>/durations.json を作る。
// 使い方: node scripts/voice.mjs <動画の名前（vit・vitShort・kar）>
//   既定は VOICEVOX（手元のエンジン http://127.0.0.1:50021）の「青山龍星」。
//   ENGINE=say で macOS の say（仮の声）に切り替える。SPEAKER・STYLE・SPEED で声と速さを変える。
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const name = process.argv[2];
if (!name) throw new Error('動画の名前を渡す（例: vit）');
const src = readFileSync(`src/videos/${name}/script.ts`, 'utf8');
const lines = [...src.matchAll(/id: '([a-zA-Z0-9]+)',\s*(?:hold: [\d.]+,\s*)?text: '[^']*',\s*yomi: '([^']*)'/g)].map((m) => ({ id: m[1], yomi: m[2] }));
// 読みに英字が残っていると読み上げが崩れる（ng を「ング」と読むなど）。カタカナにしてから作る
const latin = lines.filter((l) => /[A-Za-z]/.test(l.yomi));
if (latin.length) throw new Error('読みに英字が残っている: ' + latin.map((l) => `${l.id}「${l.yomi}」`).join(' '));
const engine = process.env.ENGINE ?? 'voicevox';
const VV = process.env.VOICEVOX_URL ?? 'http://127.0.0.1:50021';
mkdirSync(`public/voice/${name}`, { recursive: true });

async function voicevoxSpeaker() {
  const speakerName = process.env.SPEAKER ?? '青山龍星';
  const styleName = process.env.STYLE ?? 'ノーマル';
  const speakers = await (await fetch(`${VV}/speakers`)).json();
  const sp = speakers.find((s) => s.name === speakerName);
  if (!sp) throw new Error(`${speakerName} が見つからない: ${speakers.map((s) => s.name).join(' ')}`);
  const st = sp.styles.find((s) => s.name === styleName) ?? sp.styles[0];
  console.log('声:', sp.name, st.name, st.id);
  return st.id;
}

async function voicevox(text, wav, speaker) {
  const q = await (await fetch(`${VV}/audio_query?speaker=${speaker}&text=${encodeURIComponent(text)}`, { method: 'POST' })).json();
  q.speedScale = Number(process.env.SPEED ?? '1.15');
  q.prePhonemeLength = 0.05;
  q.postPhonemeLength = 0.1;
  const res = await fetch(`${VV}/synthesis?speaker=${speaker}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
  if (!res.ok) throw new Error(`synthesis ${res.status}`);
  writeFileSync(wav, Buffer.from(await res.arrayBuffer()));
}

function say(text, wav) {
  const aiff = wav.replace(/\.wav$/, '.aiff');
  execFileSync('say', ['-v', process.env.VOICE ?? 'Kyoko', '-r', process.env.RATE ?? '210', '-o', aiff, text]);
  execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16@44100', aiff, wav]);
  execFileSync('rm', [aiff]);
}

const speaker = engine === 'voicevox' ? await voicevoxSpeaker() : null;
const durations = {};
for (const { id, yomi } of lines) {
  const wav = `public/voice/${name}/${id}.wav`;
  if (engine === 'voicevox') await voicevox(yomi, wav, speaker);
  else say(yomi, wav);
  const info = execFileSync('afinfo', [wav], { encoding: 'utf8' });
  durations[id] = Number(info.match(/estimated duration: ([\d.]+)/)[1]);
  console.log(id, durations[id].toFixed(2), 's');
}
writeFileSync(`src/videos/${name}/durations.json`, JSON.stringify(durations, null, 2) + '\n');
console.log('合計', Object.values(durations).reduce((a, b) => a + b, 0).toFixed(1), 's');
