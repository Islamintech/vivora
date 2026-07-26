import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

/** The plain header when a restaurant hasn't uploaded a cover photo. */
const PLAIN = 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)';

/**
 * The header behind a restaurant's name on the customer-facing pages.
 *
 * The cover photo is whatever the owner uploaded, so nothing can be assumed
 * about it - it may be a bright, busy shot of a dining room. A fixed dark
 * scrim sits between the photo and the text: over a worst-case pure white
 * image it still leaves white text at roughly 5:1, comfortably readable, and
 * over a dark photo it simply looks like the gradient it replaces.
 *
 * Deliberately not a blur or a low-opacity wash - both look fine on the photo
 * you tested and fail on the one the restaurant actually uploads.
 */
export default function CoverHeader({
  image, children, sx,
}: {
  image?: string | null;
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', ...sx }}>
      {image ? (
        <>
          <Box
            aria-hidden
            sx={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: 'absolute', inset: 0,
              background:
                'linear-gradient(180deg, rgba(15,23,42,0.62) 0%, rgba(15,23,42,0.74) 55%, rgba(15,23,42,0.86) 100%)',
            }}
          />
        </>
      ) : (
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, background: PLAIN }} />
      )}

      {/* Above both layers; the shadow buys a little extra separation where a
          photo happens to be light right behind a glyph. */}
      <Box sx={{ position: 'relative', textShadow: image ? '0 1px 12px rgba(0,0,0,0.45)' : 'none' }}>
        {children}
      </Box>
    </Box>
  );
}
