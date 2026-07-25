import Head from 'next/head';
import NextLink from 'next/link';
import { useEffect, useState, ReactNode } from 'react';
import { Box, Container, Typography, Button, Stack, Grid, IconButton, Drawer, Divider } from '@mui/material';
import { Restaurant, Public, Chat, Email, VerifiedUser, Security, Menu as MenuIcon, Close } from '@mui/icons-material';

// ── Shared warm Material-3 palette ──
export const PRIMARY = '#9d4300';
export const ORANGE = '#f97316';
export const SURFACE = '#fff8f2';
export const ON_SURFACE = '#1f1b15';
export const ON_VAR = '#584237';
export const PEACH = '#ffdad3';
export const SEC_CONT = '#f1dcc9';
export const ON_SEC_CONT = '#6f6051';
export const PRIMARY_FIXED = '#ffdbca';
export const SC_LOW = '#fbf2e8';
export const GRAD = `linear-gradient(90deg, ${PRIMARY}, ${ORANGE})`;

export const pill = (extra: any = {}) => ({
  borderRadius: 99, fontWeight: 700, textTransform: 'none', px: 3, py: 1.25,
  fontSize: 14, boxShadow: 'none', ...extra,
});

const navLinks = [
  { label: 'Xizmatlar', href: '/' },
  { label: 'Narxlar', href: '/pricing' },
  { label: 'Biz haqimizda', href: '/about' },
  { label: 'Bog‘lanish', href: '/contact' },
];

const footerCols = [
  { h: 'Mahsulot', links: [['Xizmatlar', '/'], ['Narxlar', '/pricing'], ['Yangiliklar', '#'], ['API Hujjatlari', '#']] },
  { h: 'Kompaniya', links: [['Biz haqimizda', '/about'], ['Karyera', '#'], ['Blog', '#'], ["Bog'lanish", '/contact']] },
  { h: 'Huquqiy', links: [['Maxfiylik siyosati', '#'], ['Foydalanish shartlari', '#'], ['Cookie siyosati', '#']] },
];

// Shared sticky navbar. Desktop shows inline links; on phones/tablets they
// collapse into a right-side drawer so every page (and login) stays reachable.
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 50, bgcolor: 'rgba(255,248,242,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(140,113,100,0.1)', transition: 'all .3s', py: scrolled ? 1 : 2, boxShadow: scrolled ? '0 8px 24px rgba(157,67,0,0.06)' : 'none' }}>
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack component={NextLink} href="/" direction="row" alignItems="center" spacing={1} sx={{ textDecoration: 'none', '&:hover .lg': { transform: 'rotate(6deg)' } }}>
            <Box className="lg" sx={{ width: 40, height: 40, borderRadius: 3, background: `linear-gradient(135deg, ${PRIMARY}, ${ORANGE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 18px rgba(157,67,0,0.3)', transition: 'transform .3s' }}>
              <Restaurant />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: PRIMARY, letterSpacing: '-0.02em' }}>Vivora</Typography>
          </Stack>
          <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((l) => (
              <Typography key={l.label} component={NextLink} href={l.href} sx={{ fontSize: 14, fontWeight: 600, color: ON_VAR, textDecoration: 'none', '&:hover': { color: PRIMARY } }}>{l.label}</Typography>
            ))}
          </Stack>
          <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
            <Button component={NextLink} href="/login" sx={pill({ display: { xs: 'none', sm: 'inline-flex' }, color: PRIMARY, bgcolor: SURFACE, border: '2px solid rgba(157,67,0,0.2)', '&:hover': { borderColor: 'rgba(157,67,0,0.4)', bgcolor: 'rgba(157,67,0,0.05)' } })}>Kirish</Button>
            <Button component={NextLink} href="/register" sx={pill({ color: '#fff', background: GRAD, boxShadow: '0 10px 20px rgba(157,67,0,0.3)', '&:hover': { boxShadow: '0 15px 30px rgba(157,67,0,0.4)', transform: 'translateY(-2px)' } })}>Bepul boshlash</Button>
            <IconButton aria-label="Menyuni ochish" onClick={() => setOpen(true)} sx={{ display: { md: 'none' }, color: PRIMARY }}>
              <MenuIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Container>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 300, maxWidth: '85vw', bgcolor: SURFACE, p: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: PRIMARY }}>Vivora</Typography>
          <IconButton aria-label="Menyuni yopish" onClick={() => setOpen(false)}><Close /></IconButton>
        </Stack>
        <Stack spacing={0.5}>
          {navLinks.map((l) => (
            <Typography key={l.label} component={NextLink} href={l.href} onClick={() => setOpen(false)}
              sx={{ fontSize: 16, fontWeight: 700, color: ON_SURFACE, textDecoration: 'none', py: 1.5, px: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'rgba(157,67,0,0.06)', color: PRIMARY } }}>
              {l.label}
            </Typography>
          ))}
        </Stack>
        <Divider sx={{ my: 3, borderColor: 'rgba(140,113,100,0.15)' }} />
        <Stack spacing={1.5}>
          <Button component={NextLink} href="/login" onClick={() => setOpen(false)} sx={pill({ color: PRIMARY, bgcolor: SURFACE, border: '2px solid rgba(157,67,0,0.2)' })}>Kirish</Button>
          <Button component={NextLink} href="/register" onClick={() => setOpen(false)} sx={pill({ color: '#fff', background: GRAD })}>Bepul boshlash</Button>
        </Stack>
      </Drawer>
    </Box>
  );
}

export default function MarketingLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <>
      <Head><title>{title}</title></Head>
      <Box sx={{ bgcolor: SURFACE, color: ON_SURFACE, overflowX: 'hidden', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        <MarketingNav />
        <Box component="main">{children}</Box>

        {/* Footer */}
        <Box component="footer" sx={{ bgcolor: 'rgba(234,225,215,0.5)', py: 10, borderTop: '1px solid rgba(140,113,100,0.1)' }}>
          <Container maxWidth="xl">
            <Grid container spacing={4}>
              <Grid item xs={12} lg={4}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}><Restaurant sx={{ fontSize: 18 }} /></Box>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: PRIMARY, letterSpacing: '-0.02em' }}>Vivora</Typography>
                </Stack>
                <Typography sx={{ fontSize: 16, color: ON_VAR, mb: 3, lineHeight: 1.6, maxWidth: 300 }}>Restoranlar uchun innovatsion boshqaruv tizimi. Xizmat sifatini oshiring va daromadingizni ko&apos;paytiring.</Typography>
                <Stack direction="row" spacing={1.5}>
                  {[<Public key="1" />, <Chat key="2" />, <Email key="3" />].map((ic, i) => (
                    <Box key={i} component="a" href="#" sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#fff', border: '1px solid rgba(140,113,100,0.1)', color: ON_VAR, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', '&:hover': { bgcolor: PRIMARY, color: '#fff', transform: 'translateY(-4px)' } }}>{ic}</Box>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} lg={8}>
                <Grid container spacing={4}>
                  {footerCols.map((col) => (
                    <Grid item xs={6} sm={4} key={col.h}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: PRIMARY, mb: 2, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{col.h}</Typography>
                      <Stack spacing={1.5}>
                        {col.links.map(([l, href]) => (
                          <Typography key={l} component={NextLink} href={href} sx={{ fontSize: 14, fontWeight: 600, color: ON_VAR, textDecoration: 'none', '&:hover': { color: PRIMARY } }}>{l}</Typography>
                        ))}
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: 8, pt: 4, borderTop: '1px solid rgba(140,113,100,0.1)' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: ON_VAR }}>© {new Date().getFullYear()} Vivora Technologies. Barcha huquqlar himoyalangan.</Typography>
              <Stack direction="row" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.5, py: 0.5, bgcolor: SURFACE, borderRadius: 99, border: '1px solid rgba(140,113,100,0.1)' }}>
                  <VerifiedUser sx={{ fontSize: 16, color: '#16A34A' }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: ON_VAR }}>PCI DSS Sertifikatlangan</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.5, py: 0.5, bgcolor: SURFACE, borderRadius: 99, border: '1px solid rgba(140,113,100,0.1)' }}>
                  <Security sx={{ fontSize: 16, color: '#2563EB' }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: ON_VAR }}>Data Encryption</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>
    </>
  );
}
