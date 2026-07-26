import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, ReactNode } from 'react';
import {
  Box, Container, Typography, Button, Stack, Grid, IconButton, Drawer,
  Divider, Menu, MenuItem,
} from '@mui/material';
import {
  Restaurant, Public, Chat, Email, VerifiedUser, Security,
  Menu as MenuIcon, Close, ExpandMore,
} from '@mui/icons-material';
import { useMarketingT, MARKETING_LOCALES, MLocale } from '@/lib/marketing-i18n';
import Flag from '@/components/Flag';

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

// Locale-aware nav links, built from the active dictionary.
function useNavLinks() {
  const { t } = useMarketingT();
  return [
    { label: t.nav.features, href: '/' },
    { label: t.nav.pricing, href: '/pricing' },
    { label: t.nav.about, href: '/about' },
    { label: t.nav.contact, href: '/contact' },
  ];
}

/** Flag button + menu that switches the Next.js locale in place. */
function LanguageSwitcher({ color, dark = false }: { color: string; dark?: boolean }) {
  const router = useRouter();
  const { locale } = useMarketingT();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const switchTo = (code: MLocale) => {
    setAnchor(null);
    // Remember the choice so Next's locale detection doesn't fight it later.
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000`;
    router.push(router.asPath, undefined, { locale: code });
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<ExpandMore sx={{ fontSize: 18 }} />}
        sx={{
          minWidth: 0, px: 1.75, py: 1.1, borderRadius: 99, fontWeight: 700, fontSize: 14,
          textTransform: 'none', color, gap: 0.9,
          border: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(140,113,100,0.18)'}`,
          transition: 'background .2s, border-color .2s',
          '&:hover': {
            bgcolor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(157,67,0,0.06)',
            borderColor: dark ? 'rgba(255,255,255,0.28)' : 'rgba(157,67,0,0.35)',
          },
        }}
        aria-label="Language"
      >
        <Flag code={locale} w={22} /> {locale.toUpperCase()}
      </Button>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { mt: 1, borderRadius: 3, minWidth: 190, boxShadow: '0 16px 40px rgba(0,0,0,0.14)' } }}
      >
        {MARKETING_LOCALES.map((l) => (
          <MenuItem key={l.code} selected={l.code === locale} onClick={() => switchTo(l.code)} sx={{ fontSize: 14.5, fontWeight: 600, gap: 1.5, py: 1.2 }}>
            <Flag code={l.code} w={22} /> {l.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// Shared sticky navbar. Desktop shows inline links; on phones/tablets they
// collapse into a right-side drawer so every page (and login) stays reachable.
// `dark` renders the variant used on dark pages.
export function MarketingNav({ dark = false }: { dark?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { t, locale } = useMarketingT();
  const router = useRouter();
  const navLinks = useNavLinks();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const c = dark
    ? {
        barBg: 'rgba(10,13,20,0.72)', barBorder: 'rgba(255,255,255,0.08)',
        brand: '#fff', link: '#9AA3B2', linkHover: '#fff',
        loginColor: '#E7EBF2', loginBg: 'transparent', loginBorder: '1.5px solid rgba(255,255,255,0.18)',
        loginHoverBorder: 'rgba(255,255,255,0.35)', loginHoverBg: 'rgba(255,255,255,0.06)',
        drawerBg: '#0E1219', drawerText: '#E7EBF2', drawerHoverBg: 'rgba(249,115,22,0.1)',
        divider: 'rgba(255,255,255,0.1)', shadow: '0 8px 24px rgba(0,0,0,0.4)',
        grad: 'linear-gradient(90deg, #F97316, #FB923C)', glow: 'rgba(249,115,22,0.35)',
      }
    : {
        barBg: 'rgba(255,248,242,0.7)', barBorder: 'rgba(140,113,100,0.1)',
        brand: PRIMARY, link: ON_VAR, linkHover: PRIMARY,
        loginColor: PRIMARY, loginBg: SURFACE, loginBorder: '2px solid rgba(157,67,0,0.2)',
        loginHoverBorder: 'rgba(157,67,0,0.4)', loginHoverBg: 'rgba(157,67,0,0.05)',
        drawerBg: SURFACE, drawerText: ON_SURFACE, drawerHoverBg: 'rgba(157,67,0,0.06)',
        divider: 'rgba(140,113,100,0.15)', shadow: '0 8px 24px rgba(157,67,0,0.06)',
        grad: GRAD, glow: 'rgba(157,67,0,0.3)',
      };

  const switchLocale = (code: MLocale) => {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000`;
    router.push(router.asPath, undefined, { locale: code });
  };

  return (
    <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 50, bgcolor: scrolled ? c.barBg : 'transparent', backdropFilter: scrolled ? 'blur(14px)' : 'none', borderBottom: `1px solid ${scrolled ? c.barBorder : 'transparent'}`, transition: 'all .3s', py: scrolled ? 1.5 : 2.5, boxShadow: scrolled ? c.shadow : 'none' }}>
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          {/* Brand */}
          <Stack component={NextLink} href="/" direction="row" alignItems="center" spacing={1.5} sx={{ textDecoration: 'none', flexShrink: 0, '&:hover .lg': { transform: 'rotate(-6deg) scale(1.05)' } }}>
            <Box className="lg" sx={{ width: { xs: 42, md: 50 }, height: { xs: 42, md: 50 }, borderRadius: '14px', background: `linear-gradient(135deg, ${PRIMARY}, ${ORANGE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 10px 22px ${c.glow}`, transition: 'transform .35s cubic-bezier(0.34,1.4,0.64,1)', '& svg': { fontSize: { xs: 22, md: 27 } } }}>
              <Restaurant />
            </Box>
            <Typography sx={{ fontSize: { xs: 24, md: 29 }, fontWeight: 800, color: c.brand, letterSpacing: '-0.03em' }}>Vivora</Typography>
          </Stack>

          {/* Links */}
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((l) => {
              const active = router.pathname === l.href;
              return (
                <Typography
                  key={l.href}
                  component={NextLink}
                  href={l.href}
                  sx={{
                    position: 'relative', fontSize: 15.5, fontWeight: 700, textDecoration: 'none',
                    color: active ? c.linkHover : c.link, px: 2, py: 1.1, borderRadius: 99,
                    transition: 'color .2s, background .2s',
                    '&:hover': { color: c.linkHover, bgcolor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(157,67,0,0.06)' },
                    '&::after': {
                      content: '""', position: 'absolute', left: '50%', bottom: 4, transform: 'translateX(-50%)',
                      width: active ? 18 : 0, height: 3, borderRadius: 99, background: c.grad, transition: 'width .25s',
                    },
                    '&:hover::after': { width: 18 },
                  }}
                >
                  {l.label}
                </Typography>
              );
            })}
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5 }} alignItems="center" sx={{ flexShrink: 0 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <LanguageSwitcher color={c.link} dark={dark} />
            </Box>
            <Button component={NextLink} href="/login" sx={pill({ display: { xs: 'none', sm: 'inline-flex' }, px: 3, py: 1.4, fontSize: 15, color: c.loginColor, bgcolor: c.loginBg, border: c.loginBorder, '&:hover': { borderColor: c.loginHoverBorder, bgcolor: c.loginHoverBg } })}>{t.nav.login}</Button>
            <Button component={NextLink} href="/register" sx={pill({ px: { xs: 2.5, md: 3.5 }, py: 1.4, fontSize: 15, color: '#fff', background: c.grad, boxShadow: `0 10px 22px ${c.glow}`, transition: 'transform .2s, box-shadow .2s', '&:hover': { boxShadow: `0 16px 32px ${c.glow}`, transform: 'translateY(-2px)' } })}>{t.nav.start}</Button>
            <IconButton aria-label="Menu" onClick={() => setOpen(true)} sx={{ display: { md: 'none' }, color: dark ? '#fff' : PRIMARY, border: `1px solid ${c.divider}`, borderRadius: 2.5, p: 1.1 }}>
              <MenuIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Container>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 300, maxWidth: '85vw', bgcolor: c.drawerBg, p: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: dark ? '#fff' : PRIMARY }}>Vivora</Typography>
          <IconButton aria-label="Close" onClick={() => setOpen(false)} sx={{ color: dark ? '#9AA3B2' : undefined }}><Close /></IconButton>
        </Stack>
        <Stack spacing={0.5}>
          {navLinks.map((l) => (
            <Typography key={l.href} component={NextLink} href={l.href} onClick={() => setOpen(false)}
              sx={{ fontSize: 16, fontWeight: 700, color: c.drawerText, textDecoration: 'none', py: 1.5, px: 1.5, borderRadius: 2, '&:hover': { bgcolor: c.drawerHoverBg, color: dark ? '#FB923C' : PRIMARY } }}>
              {l.label}
            </Typography>
          ))}
        </Stack>
        <Divider sx={{ my: 3, borderColor: c.divider }} />
        {/* Language row */}
        <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" useFlexGap>
          {MARKETING_LOCALES.map((l) => (
            <Button
              key={l.code}
              onClick={() => { setOpen(false); switchLocale(l.code); }}
              sx={{
                minWidth: 0, px: 1.5, py: 0.75, borderRadius: 99, fontWeight: 700, fontSize: 13, textTransform: 'none', gap: 0.75,
                color: l.code === locale ? '#fff' : c.drawerText,
                background: l.code === locale ? c.grad : 'transparent',
                border: l.code === locale ? 'none' : `1px solid ${c.divider}`,
              }}
            >
              <Flag code={l.code} w={18} /> {l.code.toUpperCase()}
            </Button>
          ))}
        </Stack>
        <Stack spacing={1.5}>
          <Button component={NextLink} href="/login" onClick={() => setOpen(false)} sx={pill({ color: c.loginColor, bgcolor: 'transparent', border: c.loginBorder })}>{t.nav.login}</Button>
          <Button component={NextLink} href="/register" onClick={() => setOpen(false)} sx={pill({ color: '#fff', background: c.grad })}>{t.nav.start}</Button>
        </Stack>
      </Drawer>
    </Box>
  );
}

// Locale-aware footer, shared between MarketingLayout and the landing page.
export function MarketingFooter() {
  const { t } = useMarketingT();
  const footerCols = [
    { h: t.footer.product, links: [[t.nav.features, '/'], [t.nav.pricing, '/pricing'], [t.footer.news, '#'], [t.footer.api, '#']] },
    { h: t.footer.company, links: [[t.nav.about, '/about'], [t.footer.careers, '#'], [t.footer.blog, '#'], [t.nav.contact, '/contact']] },
    { h: t.footer.legal, links: [[t.footer.privacy, '#'], [t.footer.terms, '#'], [t.footer.cookies, '#']] },
  ];

  return (
    <Box component="footer" sx={{ bgcolor: 'rgba(234,225,215,0.5)', py: { xs: 6, md: 9 }, borderTop: '1px solid rgba(140,113,100,0.1)' }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} lg={4}>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}><Restaurant sx={{ fontSize: 18 }} /></Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: PRIMARY, letterSpacing: '-0.02em' }}>Vivora</Typography>
            </Stack>
            <Typography sx={{ fontSize: 15, color: ON_VAR, mb: 3, lineHeight: 1.6, maxWidth: 300 }}>{t.footer.desc}</Typography>
            <Stack direction="row" spacing={1.5}>
              {[
                { ic: <Public key="1" />, href: '/' },
                { ic: <Chat key="2" />, href: 'https://t.me/vivora_support' },
                { ic: <Email key="3" />, href: '/contact' },
              ].map((s, i) => (
                <Box key={i} component="a" href={s.href} {...(s.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#fff', border: '1px solid rgba(140,113,100,0.1)', color: ON_VAR, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', '&:hover': { bgcolor: PRIMARY, color: '#fff', transform: 'translateY(-4px)' } }}>{s.ic}</Box>
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
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: { xs: 5, md: 8 }, pt: 4, borderTop: '1px solid rgba(140,113,100,0.1)' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: ON_VAR }}>© {new Date().getFullYear()} Vivora Technologies. {t.footer.rights}</Typography>
          <Stack direction="row" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.5, py: 0.5, bgcolor: SURFACE, borderRadius: 99, border: '1px solid rgba(140,113,100,0.1)' }}>
              <VerifiedUser sx={{ fontSize: 16, color: '#16A34A' }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: ON_VAR }}>{t.footer.securePay}</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.5, py: 0.5, bgcolor: SURFACE, borderRadius: 99, border: '1px solid rgba(140,113,100,0.1)' }}>
              <Security sx={{ fontSize: 16, color: '#2563EB' }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: ON_VAR }}>{t.footer.encrypted}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Container>
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
        <MarketingFooter />
      </Box>
    </>
  );
}
