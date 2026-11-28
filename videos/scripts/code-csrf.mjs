// 画面に出すコードを labs/ の実物から行範囲で切り出し、src/videos/csrf/code.ts を作る。
// 使い方: node scripts/code-csrf.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PICK = {
  BEFORE: ['lab09_csrf/exercise.py', 20, 25],
  METHOD: ['lab09_csrf/solution.py', 24, 29],
  TOKEN: ['lab09_csrf/solution.py', 30, 34],
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
let out = "import type { Snippet } from '../../parts/snippet';\n";
for (const [name, [file, from, to]] of Object.entries(PICK)) {
  const code = readFileSync(`../labs/${file}`, 'utf8').split('\n').slice(from - 1, to).join('\n');
  out += `\nexport const ${name}: Snippet = {\n  repo: 'labs',\n  file: '${file}',\n  start: ${from},\n  code: \`${esc(code)}\`,\n};\n`;
}
writeFileSync('src/videos/csrf/code.ts', out);
console.log(out);
