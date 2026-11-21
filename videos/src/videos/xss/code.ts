import type { Snippet } from '../../parts/snippet';

export const BEFORE: Snippet = {
  repo: 'labs',
  file: 'lab02_output_encoding/exercise.py',
  start: 5,
  code: `def render_comment(author: str, body: str) -> str:
    return f'<div class="comment"><b>{author}</b>: {body}</div>'`,
};

export const AFTER: Snippet = {
  repo: 'labs',
  file: 'lab02_output_encoding/solution.py',
  start: 9,
  code: `def render_comment(author: str, body: str) -> str:
    # ✅ HTML 要素コンテキスト: & < > " ' をエスケープ（V1.2.1）
    return f'<div class="comment"><b>{html.escape(author)}</b>: {html.escape(body)}</div>'`,
};
