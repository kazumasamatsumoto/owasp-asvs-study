// 画面に出すコード（src/videos/*/code.ts）が、labs/ の実物と一字一句同じかを確かめる。
// 使い方: node scripts/verify-code.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';

let bad = 0;
for (const v of readdirSync('src/videos')) {
  const p = `src/videos/${v}/code.ts`;
  if (!existsSync(p)) continue;
  const src = readFileSync(p, 'utf8');
  const re = /repo: 'labs',\s*file: '([^']+)',\s*start: (\d+),\s*code: `([\s\S]*?)`,\n\};/g;
  for (const m of src.matchAll(re)) {
    const code = m[3].replace(/\\`/g, '`').replace(/\\\$\{/g, '${').replace(/\\\\/g, '\\');
    const lines = readFileSync('../labs/' + m[1], 'utf8').split('\n');
    const want = lines.slice(+m[2] - 1, +m[2] - 1 + code.split('\n').length).join('\n');
    const ok = want === code;
    if (!ok) bad++;
    console.log(ok ? '一致  ' : '不一致', v, m[1], m[2]);
  }
}
console.log(bad ? `不一致 ${bad} か所` : 'すべて一致');
process.exit(bad ? 1 : 0);
