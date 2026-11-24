// 画面に出すコードを labs/ の実物から行範囲で切り出し、src/videos/fileUpload/code.ts を作る。
// 使い方: node scripts/code-fileUpload.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const PICK = {
  BEFORE: ['lab05_file_upload/exercise.py', 7, 12],
  AFTER: ['lab05_file_upload/solution.py', 21, 34],
  MAGIC: ['lab05_file_upload/solution.py', 13, 18],
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
let out = "import type { Snippet } from '../../parts/snippet';\n";
for (const [name, [file, from, to]] of Object.entries(PICK)) {
  const code = readFileSync(`../labs/${file}`, 'utf8').split('\n').slice(from - 1, to).join('\n');
  out += `\nexport const ${name}: Snippet = {\n  repo: 'labs',\n  file: '${file}',\n  start: ${from},\n  code: \`${esc(code)}\`,\n};\n`;
}
writeFileSync('src/videos/fileUpload/code.ts', out);
console.log(out);
