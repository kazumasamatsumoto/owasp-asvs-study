// 画面に出すコードを labs/ の実物から行範囲で切り出し、src/videos/xss/code.ts を作る。
// 使い方: node scripts/code-xss.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PICK = {
  BEFORE: ['lab02_output_encoding/exercise.py', 5, 6],
  AFTER: ['lab02_output_encoding/solution.py', 9, 11],
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
let out = "import type { Snippet } from '../../parts/snippet';\n";
for (const [name, [file, from, to]] of Object.entries(PICK)) {
  const code = readFileSync(`../labs/${file}`, 'utf8').split('\n').slice(from - 1, to).join('\n');
  out += `\nexport const ${name}: Snippet = {\n  repo: 'labs',\n  file: '${file}',\n  start: ${from},\n  code: \`${esc(code)}\`,\n};\n`;
}
writeFileSync('src/videos/xss/code.ts', out);
console.log(out);
