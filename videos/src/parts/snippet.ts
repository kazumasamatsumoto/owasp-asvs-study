/** 画面に出すコード。start は実物の行番号。scripts/verify-code.mjs で実物と照合する。 */
export interface Snippet {
  /** どこのファイルか（labs/ からの相対パス） */
  repo?: 'labs';
  file: string;
  start: number;
  code: string;
}
