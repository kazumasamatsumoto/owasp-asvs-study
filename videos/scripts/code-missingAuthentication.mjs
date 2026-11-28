// 画面に出すコードを labs/ の実物から行範囲で切り出し、src/videos/missingAuthentication/code.ts を作る。
// 使い方: node scripts/code-missingAuthentication.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PICK = {
  BEFORE: ['lab16_missing_authentication/exercise.py', 20, 33],
  PUBLIC: ['lab16_missing_authentication/solution.py', 26, 27],
  FIX: ['lab16_missing_authentication/solution.py', 30, 42],
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
let out = "import type { Snippet } from '../../parts/snippet';\n";
for (const [name, [file, from, to]] of Object.entries(PICK)) {
  const code = readFileSync(`../labs/${file}`, 'utf8').split('\n').slice(from - 1, to).join('\n');
  out += `\nexport const ${name}: Snippet = {\n  repo: 'labs',\n  file: '${file}',\n  start: ${from},\n  code: \`${esc(code)}\`,\n};\n`;
}
writeFileSync('src/videos/missingAuthentication/code.ts', out);
console.log(out);
