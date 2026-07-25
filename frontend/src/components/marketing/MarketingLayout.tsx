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

/** Inline SVG flags - emoji flags don't render on Windows browsers. */
function Flag({ code, w = 20 }: { code: MLocale; w?: number }) {
  const svgProps = { width: w, height: (w * 2) / 3, viewBox: '0 0 24 16', style: { display: 'block' } };
  let svg: ReactNode;
  if (code === 'uz') {
    svg = (
      <svg {...svgProps}>
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
      <svg {...svgProps}>
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
      <svg {...svgProps}>
        <rect width="24" height="16" fill="#D52B1E" />
        <rect width="24" height="10.66" fill="#0039A6" />
        <rect width="24" height="5.33" fill="#fff" />
      </svg>
    );
  } else {
    svg = (
      <svg {...svgProps}>
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
    <Box component="span" sx={{ borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.12)', lineHeight: 0, flexShrink: 0, display: 'inline-block' }}>
      {svg}
    </Box>
  );
}

/** Flag button + menu that switches the Next.js locale in place. */
function LanguageSwitcher({ color }: { color: string }) {
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
        endIcon={<ExpandMore sx={{ fontSize: 16 }} />}
        sx={{ minWidth: 0, px: 1.25, py: 0.75, borderRadius: 99, fontWeight: 700, fontSize: 13, textTransform: 'none', color, gap: 0.75 }}
        aria-label="Language"
      >
        <Flag code={locale} /> {locale.toUpperCase()}
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {MARKETING_LOCALES.map((l) => (
          <MenuItem key={l.code} selected={l.code === locale} onClick={() => switchTo(l.code)} sx={{ fontSize: 14, fontWeight: 600, gap: 1.25 }}>
            <Flag code={l.code} /> {l.label}
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
    <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 50, bgcolor: c.barBg, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.barBorder}`, transition: 'all .3s', py: scrolled ? 1 : 2, boxShadow: scrolled ? c.shadow : 'none' }}>
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack component={NextLink} href="/" direction="row" alignItems="center" spacing={1} sx={{ textDecoration: 'none', '&:hover .lg': { transform: 'rotate(6deg)' } }}>
            <Box className="lg" sx={{ width: 40, height: 40, borderRadius: 3, background: `linear-gradient(135deg, ${PRIMARY}, ${ORANGE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 8px 18px ${c.glow}`, transition: 'transform .3s' }}>
              <Restaurant />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: c.brand, letterSpacing: '-0.02em' }}>Vivora</Typography>
          </Stack>
          <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((l) => (
              <Typography key={l.href} component={NextLink} href={l.href} sx={{ fontSize: 14, fontWeight: 600, color: c.link, textDecoration: 'none', transition: 'color .2s', '&:hover': { color: c.linkHover } }}>{l.label}</Typography>
            ))}
          </Stack>
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5 }} alignItems="center">
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <LanguageSwitcher color={c.link} />
            </Box>
            <Button component={NextLink} href="/login" sx={pill({ display: { xs: 'none', sm: 'inline-flex' }, color: c.loginColor, bgcolor: c.loginBg, border: c.loginBorder, '&:hover': { borderColor: c.loginHoverBorder, bgcolor: c.loginHoverBg } })}>{t.nav.login}</Button>
            <Button component={NextLink} href="/register" sx={pill({ color: '#fff', background: c.grad, boxShadow: `0 10px 20px ${c.glow}`, '&:hover': { boxShadow: `0 15px 30px ${c.glow}`, transform: 'translateY(-2px)' } })}>{t.nav.start}</Button>
            <IconButton aria-label="Menu" onClick={() => setOpen(true)} sx={{ display: { md: 'none' }, color: dark ? '#fff' : PRIMARY }}>
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
