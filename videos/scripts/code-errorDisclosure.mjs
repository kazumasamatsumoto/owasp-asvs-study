// 画面に出すコードを labs/ の実物から行範囲で切り出し、src/videos/errorDisclosure/code.ts を作る。
// 使い方: node scripts/code-errorDisclosure.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PICK = {
  BEFORE: ['lab18_error_disclosure/exercise.py', 9, 16],
  FIX: ['lab18_error_disclosure/solution.py', 10, 19],
  ORDERS: ['lab18_error_disclosure/orders.py', 10, 17],
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
let out = "import type { Snippet } from '../../parts/snippet';\n";
for (const [name, [file, from, to]] of Object.entries(PICK)) {
  const code = readFileSync(`../labs/${file}`, 'utf8').split('\n').slice(from - 1, to).join('\n');
  out += `\nexport const ${name}: Snippet = {\n  repo: 'labs',\n  file: '${file}',\n  start: ${from},\n  code: \`${esc(code)}\`,\n};\n`;
}
writeFileSync('src/videos/errorDisclosure/code.ts', out);
console.log(out);
