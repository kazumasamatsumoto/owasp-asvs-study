// 画面に出すコードを labs/ の実物から行範囲で切り出し、src/videos/missingAuthorization/code.ts を作る。
// 使い方: node scripts/code-missingAuthorization.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PICK = {
  BEFORE: ['lab14_missing_authorization/exercise.py', 20, 24],
  FIX: ['lab14_missing_authorization/solution.py', 20, 29],
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
let out = "import type { Snippet } from '../../parts/snippet';\n";
for (const [name, [file, from, to]] of Object.entries(PICK)) {
  const code = readFileSync(`../labs/${file}`, 'utf8').split('\n').slice(from - 1, to).join('\n');
  out += `\nexport const ${name}: Snippet = {\n  repo: 'labs',\n  file: '${file}',\n  start: ${from},\n  code: \`${esc(code)}\`,\n};\n`;
}
writeFileSync('src/videos/missingAuthorization/code.ts', out);
console.log(out);
