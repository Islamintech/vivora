import Box from '@mui/material/Box';

/**
 * The Vivora mark (public/logo.png). One component so every surface - marketing
 * nav, dashboard sidebar, login - shows the same asset at the same proportions.
 */
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <Box
      component="img"
      src="/logo.png"
      alt="Vivora"
      sx={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  );
}
