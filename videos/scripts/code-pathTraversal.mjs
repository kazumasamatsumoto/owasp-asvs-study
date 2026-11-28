// 画面に出すコードを labs/ の実物から行範囲で切り出し、src/videos/pathTraversal/code.ts を作る。
// 使い方: node scripts/code-pathTraversal.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PICK = {
  BEFORE: ['lab10_path_traversal/exercise.py', 10, 13],
  NAME: ['lab10_path_traversal/solution.py', 9, 13],
  RESOLVE: ['lab10_path_traversal/solution.py', 14, 18],
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
let out = "import type { Snippet } from '../../parts/snippet';\n";
for (const [name, [file, from, to]] of Object.entries(PICK)) {
  const code = readFileSync(`../labs/${file}`, 'utf8').split('\n').slice(from - 1, to).join('\n');
  out += `\nexport const ${name}: Snippet = {\n  repo: 'labs',\n  file: '${file}',\n  start: ${from},\n  code: \`${esc(code)}\`,\n};\n`;
}
writeFileSync('src/videos/pathTraversal/code.ts', out);
console.log(out);
