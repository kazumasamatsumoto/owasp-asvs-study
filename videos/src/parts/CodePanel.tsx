import { interpolate, useCurrentFrame } from 'remotion';
import { C, mono, sans } from '../theme';
import type { Snippet } from './snippet';
import { pop } from './motion';

const KW = /\b(const|return|export|async|function|await|if|else|def|import|from|None|raise|is|not|in)\b/;

/** とても小さな色分け: コメント・文字列・キーワード・関数呼び出し・型 */
function tokens(line: string): { t: string; c: string }[] {
  const out: { t: string; c: string }[] = [];
  const re = /(\/\/.*$|#.*$)|(f?"[^"]*"|'[^']*')|(\?\?=|\?|:|=>|!)|(\b[A-Za-z_$][\w$]*\b)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [t] = m;
    if (m[1]) out.push({ t, c: C.comment });
    else if (m[2]) out.push({ t, c: C.str });
    else if (m[3]) out.push({ t, c: C.fire });
    else if (m[4]) {
      const next = line.slice(re.lastIndex);
      if (KW.test(t)) out.push({ t, c: C.kw });
      else if (/^\s*\(/.test(next)) out.push({ t, c: C.fn });
      else if (/^[A-Z]/.test(t)) out.push({ t, c: C.gold });
      else out.push({ t, c: C.text });
    } else out.push({ t, c: C.text });
  }
  return out;
}

/** 印を付ける行（実物の行番号）と、印が走り始めるフレーム */
export interface Mark {
  lines: number[];
  at: number;
}

/**
 * コードの窓。highlight の行に at フレームから印が走る。
 * steps を渡すと、時間に合わせて印を付ける行が移っていく（読み上げに合わせて指す）。
 */
export const CodePanel: React.FC<{ snippet: Snippet; highlight?: number[]; at?: number; steps?: Mark[]; fontSize?: number; width?: number; maxLines?: number; decodeUnicode?: boolean }> = ({
  snippet,
  highlight: fixed = [],
  at: fixedAt = 12,
  steps,
  fontSize = 34,
  width = 1680,
  maxLines = 12,
  decodeUnicode = false,
}) => {
  const f = useCurrentFrame();
  const s = pop(f, 0, 160);
  const marks = steps ?? [{ lines: fixed, at: fixedAt }];
  const current = [...marks].reverse().find((m) => f >= m.at) ?? marks[0];
  const highlight = current.lines;
  const at = current.at;
  // 行が多いときは maxLines 行だけ見せ、印の行が見える位置まで滑らせる
  const total = snippet.code.split('\n').length;
  const topOf = (m: Mark) => Math.max(0, Math.min(total - maxLines, (m.lines[0] ?? snippet.start) - snippet.start - 2));
  const idx = marks.indexOf(current);
  const prevTop = idx > 0 ? topOf(marks[idx - 1]) : topOf(current);
  const top = total > maxLines ? interpolate(f, [at - 8, at], [prevTop, topOf(current)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  // 束ねた出力は ɵ を \\u0275 と書くので、見せるときだけ読める字に戻す（照合は元の文字で行う）
  const shown = decodeUnicode ? snippet.code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) : snippet.code;
  const lines = shown.split('\n');
  // 一番長い行が窓に収まる大きさまで字を縮める（等幅の字の幅はおよそ 0.6em）
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(fontSize, Math.floor((width - 96 - 28 - 40) / (longest * 0.6)));
  const sweep = interpolate(f, [at, at + 10], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        background: C.panel,
        border: `2px solid ${C.line}`,
        borderRadius: 22,
        boxShadow: `0 30px 80px #000a, 0 0 0 1px ${C.fire}22`,
        transform: `translateY(${(1 - s) * 60}px) scale(${0.94 + s * 0.06})`,
        opacity: s,
        overflow: 'hidden',
        maxWidth: width,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: `2px solid ${C.line}` }}>
        {[C.red, C.gold, '#4ade80'].map((c) => (
          <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
        ))}
        <span style={{ marginLeft: 14, fontFamily: sans, fontWeight: 500, fontSize: 24, color: C.dim }}>{width < 1200 ? '…/' + snippet.file.split('/').slice(-3).join('/') : snippet.file}</span>
      </div>
      <div style={{ padding: '22px 0', fontFamily: mono, fontSize: size, lineHeight: 1.55, fontVariantLigatures: 'none' }}>
        <div style={{ height: total > maxLines ? maxLines * size * 1.55 : undefined, overflow: 'hidden' }}>
        <div style={{ transform: `translateY(${-top * size * 1.55}px)` }}>
        {lines.map((line, i) => {
          const no = snippet.start + i;
          const hot = highlight.includes(no);
          return (
            <div key={no} style={{ position: 'relative', display: 'flex', whiteSpace: 'pre', padding: '0 32px 0 0' }}>
              {hot && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${sweep}%`,
                    background: `linear-gradient(90deg, ${C.fire}44, ${C.gold}22)`,
                    borderLeft: `6px solid ${C.fire}`,
                  }}
                />
              )}
              <span style={{ position: 'relative', flexShrink: 0, width: 96, textAlign: 'right', paddingRight: 28, color: hot ? C.gold : C.dim }}>{no}</span>
              <span style={{ position: 'relative', opacity: highlight.length && !hot && f > at ? 0.45 : 1 }}>
                {tokens(line).map((tk, j) => (
                  <span key={j} style={{ color: tk.c }}>
                    {tk.t}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
        </div>
        </div>
      </div>
    </div>
  );
};
