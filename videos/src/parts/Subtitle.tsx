import { useCurrentFrame } from 'remotion';
import { C, sans } from '../theme';
import { pop } from './motion';

/** 画面下の字幕。コードの綴り（ng test など）はそのまま出す */
export const Subtitle: React.FC<{ text: string; vertical?: boolean }> = ({ text, vertical = false }) => {
  const f = useCurrentFrame();
  const s = pop(f, 2, 260);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: vertical ? 330 : 56, display: 'flex', justifyContent: 'center', padding: '0 40px' }}>
      <div
        lang="ja"
        style={{
          maxWidth: vertical ? 1000 : 1600,
          fontFamily: sans,
          fontWeight: 900,
          fontSize: vertical ? 50 : 46,
          lineHeight: 1.35,
          color: C.text,
          textAlign: 'center',
          wordBreak: 'auto-phrase' as React.CSSProperties['wordBreak'],
          textWrap: 'balance',
          padding: '14px 36px',
          background: '#000c',
          borderRadius: 16,
          border: `2px solid ${C.line}`,
          transform: `translateY(${(1 - s) * 30}px)`,
          opacity: s,
        }}
      >
        {text}
      </div>
    </div>
  );
};
