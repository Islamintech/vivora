import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export type FlagCode = 'uz' | 'en' | 'ru' | 'ko';

/**
 * Inline SVG flags. Emoji flags don't render at all on Windows browsers, so
 * anything a restaurant owner might view on a desktop needs real artwork.
 */
export default function Flag({ code, w = 24 }: { code: FlagCode; w?: number }) {
  const p = { width: w, height: (w * 2) / 3, viewBox: '0 0 24 16', style: { display: 'block' } };
  let svg: ReactNode;

  if (code === 'uz') {
    svg = (
      <svg {...p}>
        <rect width="24" height="16" fill="#1EB53A" />
        <rect width="24" height="10.4" fill="#fff" />
        <rect width="24" height="5" fill="#0099B5" />
        <rect y="5" width="24" height="0.7" fill="#CE1126" />
        <rect y="10.4" width="24" height="0.7" fill="#CE1126" />
        <circle cx="4" cy="2.6" r="1.7" fill="#fff" />
        <circle cx="4.8" cy="2.6" r="1.45" fill="#0099B5" />
      </svg>
    );
  } else if (code === 'en') {
    svg = (
      <svg {...p}>
        <rect width="24" height="16" fill="#012169" />
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="3.2" />
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1.3" />
        <rect x="9.5" width="5" height="16" fill="#fff" />
        <rect y="5.5" width="24" height="5" fill="#fff" />
        <rect x="10.6" width="2.8" height="16" fill="#C8102E" />
        <rect y="6.6" width="24" height="2.8" fill="#C8102E" />
      </svg>
    );
  } else if (code === 'ru') {
    svg = (
      <svg {...p}>
        <rect width="24" height="16" fill="#D52B1E" />
        <rect width="24" height="10.66" fill="#0039A6" />
        <rect width="24" height="5.33" fill="#fff" />
      </svg>
    );
  } else {
    svg = (
      <svg {...p}>
        <rect width="24" height="16" fill="#fff" />
        <circle cx="12" cy="8" r="4" fill="#CD2E3A" />
        <path d="M8,8 a4,4 0 0 0 8,0 z" fill="#0047A0" />
        <circle cx="10" cy="7.4" r="2" fill="#CD2E3A" />
        <circle cx="14" cy="8.6" r="2" fill="#0047A0" />
        {[
          'translate(4.4,3.4) rotate(-33)',
          'translate(19.6,3.4) rotate(33)',
          'translate(4.4,12.6) rotate(33)',
          'translate(19.6,12.6) rotate(-33)',
        ].map((tr) => (
          <g key={tr} transform={tr} fill="#000">
            <rect x="-1.7" y="-1.25" width="3.4" height="0.55" />
            <rect x="-1.7" y="-0.28" width="3.4" height="0.55" />
            <rect x="-1.7" y="0.7" width="3.4" height="0.55" />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        borderRadius: '3px', overflow: 'hidden', lineHeight: 0,
        border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0, display: 'inline-block',
      }}
    >
      {svg}
    </Box>
  );
}
