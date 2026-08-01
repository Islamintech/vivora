import type { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { keyframes } from '@mui/system';
import {
  Box, Container, Typography, Button, Stack, Grid,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  QrCodeScanner, TouchApp, Whatshot, BarChart, QrCode2,
  Print, Language, Notifications, ExpandMore, Kitchen, Bolt,
  Add, ShoppingCart,
} from '@mui/icons-material';
import { MarketingNav, MarketingFooter } from '../libs/components/marketing/MarketingLayout';
import Flag from '../libs/components/Flag';
import { useMarketingT } from '../libs/marketing-i18n';

// ── Warm Material-3 palette ──
const BG = '#fff8f2';
const BG2 = '#fbf2e8';
const CARD = '#ffffff';
const CARD2 = '#fbf4ec';
const BORDER = 'rgba(140,113,100,0.14)';
const TEXT = '#1f1b15';
const MUTED = '#584237';
const PRIMARY = '#FD6511';
const ORANGE = '#FF8A3D';
// Darker shade for the small uppercase eyebrows - see PRIMARY_DEEP in MarketingLayout.
const PRIMARY_DEEP = '#B03D02';
const ORANGE_L = '#FF8A3D';
const GRAD = `linear-gradient(90deg, ${PRIMARY}, ${ORANGE})`;
const GLOW = 'rgba(253,101,17,0.25)';

const fadeUp = keyframes`from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}`;
const growBar = keyframes`from{transform:scaleY(0)}to{transform:scaleY(1)}`;
const pulse = keyframes`0%,100%{opacity:.55}50%{opacity:1}`;
const bounce = 'cubic-bezier(0.34, 1.4, 0.64, 1)';

const pill = (extra: any = {}) => ({
  borderRadius: 99, fontWeight: 700, textTransform: 'none', px: 3.5, py: 1.5,
  fontSize: 15, boxShadow: 'none', ...extra,
});

// Fade-and-rise a section into view on scroll.
function Reveal({ children, delay = 0, sx }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); o.disconnect(); } },
      { threshold: 0.12 },
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    <Box ref={ref} sx={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(28px)', transition: `opacity .7s ease ${delay}s, transform .7s ${bounce} ${delay}s`, ...sx }}>
      {children}
    </Box>
  );
}

const STEP_ICONS = [<QrCodeScanner key="0" />, <TouchApp key="1" />, <Whatshot key="2" />];
const FEATURE_ICONS = [
  <QrCode2 key="0" />, <Kitchen key="1" />, <Print key="2" />,
  <BarChart key="3" />, <Language key="4" />, <Notifications key="5" />,
];

// Mini status chip used inside the dashboard mockup.
const MockChip = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <Box sx={{ px: 1, py: 0.25, borderRadius: 99, fontSize: 9.5, fontWeight: 700, color, bgcolor: bg, whiteSpace: 'nowrap' }}>{label}</Box>
);

/** CSS-built dashboard preview inside a browser frame, with a soft warm glow.
    Depicts the real product UI, so its labels stay as the product ships (Uzbek). */
function DashboardMock() {
  const bars = [42, 58, 38, 72, 64, 96, 80];
  const orders = [
    { t: '5-stol', i: '2× Osh, 1× Lag‘mon', s: 'Yangi', c: '#B45309', bg: 'rgba(245,158,11,0.16)' },
    { t: '12-stol', i: '1× Shashlik, 2× Choy', s: 'Tayyorlanmoqda', c: '#1D4ED8', bg: 'rgba(96,165,250,0.16)' },
    { t: '3-stol', i: '3× Somsa', s: 'Berildi', c: '#15803D', bg: 'rgba(74,222,128,0.2)' },
  ];
  return (
    <Box sx={{ position: 'relative' }}>
      {/* Glow */}
      <Box sx={{ position: 'absolute', inset: '-8% -6%', background: `radial-gradient(ellipse at 50% 40%, ${GLOW}, transparent 65%)`, filter: 'blur(30px)', zIndex: 0 }} />
      <Box sx={{ position: 'relative', zIndex: 1, borderRadius: '18px', overflow: 'hidden', border: `1px solid ${BORDER}`, bgcolor: '#fff', boxShadow: '0 40px 90px rgba(253,101,17,0.16)' }}>
        {/* Browser chrome */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, bgcolor: '#f6ede4', borderBottom: `1px solid ${BORDER}` }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
          ))}
          <Box sx={{ flex: 1, maxWidth: 260, mx: 'auto', bgcolor: 'rgba(140,113,100,0.09)', borderRadius: 99, px: 2, py: 0.4, fontSize: 11, color: MUTED, textAlign: 'center' }}>
            vivora.kr/dashboard
          </Box>
        </Stack>

        <Stack direction="row">
          {/* Sidebar */}
          <Box sx={{ width: 52, borderRight: `1px solid ${BORDER}`, py: 2, display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'center', gap: 1.75 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: 2, background: GRAD }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ width: 18, height: 4, borderRadius: 2, bgcolor: i === 1 ? ORANGE : 'rgba(140,113,100,0.22)' }} />
            ))}
          </Box>

          {/* Main */}
          <Box sx={{ flex: 1, p: { xs: 1.75, sm: 2.5 }, minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.75}>
              <Box sx={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Bugungi ko‘rsatkichlar</Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22C55E', animation: `${pulse} 2s infinite` }} />
                <Box sx={{ fontSize: 10.5, color: MUTED }}>Jonli</Box>
              </Box>
            </Stack>

            {/* Stat cards */}
            <Grid container spacing={1.25} mb={1.75}>
              {[
                { l: 'Daromad', v: '₩1 240 000', d: '+12%' },
                { l: 'Buyurtmalar', v: '214', d: '+8%' },
                { l: 'O‘rtacha chek', v: '₩45 300', d: '+3%' },
              ].map((s) => (
                <Grid item xs={4} key={s.l}>
                  <Box sx={{ p: { xs: 1, sm: 1.5 }, borderRadius: 2.5, bgcolor: CARD2, border: `1px solid ${BORDER}` }}>
                    <Box sx={{ fontSize: 9.5, color: MUTED, mb: 0.25 }}>{s.l}</Box>
                    <Box sx={{ fontSize: { xs: 11, sm: 14 }, fontWeight: 800, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.v}</Box>
                    <Box sx={{ fontSize: 9, fontWeight: 700, color: '#15803D' }}>{s.d}</Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Chart + orders */}
            <Grid container spacing={1.25}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: CARD2, border: `1px solid ${BORDER}`, height: '100%' }}>
                  <Box sx={{ fontSize: 10, color: MUTED, mb: 1 }}>Haftalik daromad</Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 74 }}>
                    {bars.map((h, i) => (
                      <Box key={i} sx={{
                        flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0', transformOrigin: 'bottom',
                        background: i === 5 ? 'linear-gradient(180deg,#FBBF24,#F59E0B)' : `linear-gradient(180deg, ${ORANGE_L}, ${ORANGE})`,
                        animation: `${growBar} .8s ${bounce} both`, animationDelay: `${0.5 + i * 0.08}s`,
                      }} />
                    ))}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: CARD2, border: `1px solid ${BORDER}`, height: '100%' }}>
                  <Box sx={{ fontSize: 10, color: MUTED, mb: 1 }}>So‘nggi buyurtmalar</Box>
                  <Stack spacing={0.9}>
                    {orders.map((o) => (
                      <Stack key={o.t} direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ p: 0.9, borderRadius: 2, bgcolor: '#fff', border: `1px solid ${BORDER}` }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ fontSize: 10.5, fontWeight: 800, color: TEXT }}>{o.t}</Box>
                          <Box sx={{ fontSize: 9, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.i}</Box>
                        </Box>
                        <MockChip label={o.s} color={o.c} bg={o.bg} />
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

/** Customer menu inside a realistic phone device frame (product UI as shipped). */
function PhoneMock() {
  const items = [
    { n: 'Palov', d: 'Qo‘y go‘shti, sabzi, guruch', p: '₩12 000', best: true, img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&q=70&auto=format&fit=crop' },
    { n: 'Lag‘mon', d: 'Qo‘lda tortilgan, sabzavotli', p: '₩10 500', best: false, img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=70&auto=format&fit=crop' },
    { n: 'Shashlik', d: 'Ko‘mirda pishirilgan', p: '₩8 000', best: false, img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&q=70&auto=format&fit=crop' },
  ];
  const W = 260;                 // device width
  const BEZEL = 11;              // uniform bezel, like a real phone
  return (
    <Box sx={{ position: 'relative', width: W, mx: 'auto' }}>
      <Box sx={{ position: 'absolute', inset: '-12%', background: `radial-gradient(ellipse, ${GLOW}, transparent 68%)`, filter: 'blur(30px)' }} />

      {/* Device body - true phone proportions (9:19.5) */}
      <Box sx={{
        position: 'relative', width: W, aspectRatio: '9 / 19.5',
        borderRadius: `${W * 0.155}px`, p: `${BEZEL}px`,
        background: 'linear-gradient(150deg, #6f7076 0%, #2a2b30 18%, #17181c 50%, #34353b 82%, #6f7076 100%)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.25)',
      }}>
        {/* Side buttons */}
        <Box sx={{ position: 'absolute', left: -2.5, top: '17%', width: 2.5, height: 26, borderRadius: 99, background: 'linear-gradient(90deg,#4a4b52,#2a2b30)' }} />
        <Box sx={{ position: 'absolute', left: -2.5, top: '24%', width: 2.5, height: 40, borderRadius: 99, background: 'linear-gradient(90deg,#4a4b52,#2a2b30)' }} />
        <Box sx={{ position: 'absolute', left: -2.5, top: '32.5%', width: 2.5, height: 40, borderRadius: 99, background: 'linear-gradient(90deg,#4a4b52,#2a2b30)' }} />
        <Box sx={{ position: 'absolute', right: -2.5, top: '26%', width: 2.5, height: 58, borderRadius: 99, background: 'linear-gradient(270deg,#4a4b52,#2a2b30)' }} />

        {/* Screen */}
        <Box sx={{
          position: 'relative', height: '100%', borderRadius: `${W * 0.155 - BEZEL}px`,
          overflow: 'hidden', bgcolor: '#fffdf9', display: 'flex', flexDirection: 'column',
        }}>
          {/* Dynamic island */}
          <Box sx={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 68, height: 19, borderRadius: 99, bgcolor: '#08080a', zIndex: 3 }} />

          {/* Status bar */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: 1.15, pb: 0.5, fontSize: 9.5, fontWeight: 700, color: TEXT, flexShrink: 0 }}>
            <Box sx={{ pl: 0.25 }}>9:41</Box>
            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ pr: 0.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: 7 }}>
                {[3, 4.5, 6, 7].map((hh, i) => <Box key={i} sx={{ width: 2, height: hh, borderRadius: '1px', bgcolor: TEXT }} />)}
              </Box>
              <Box sx={{ width: 14, height: 7.5, borderRadius: '2px', border: `1px solid ${TEXT}`, p: '1px', display: 'flex' }}>
                <Box sx={{ flex: 1, borderRadius: '1px', bgcolor: TEXT }} />
              </Box>
            </Stack>
          </Stack>

          {/* App header - the dark banner the real menu opens with */}
          <Box sx={{
            position: 'relative', px: 1.75, pt: 1.5, pb: 2, flexShrink: 0, textAlign: 'center',
            background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
          }}>
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}><Flag code="uz" w={19} /></Box>
            <Box sx={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Zaytoon</Box>
            <Box sx={{ fontSize: 9, color: 'rgba(255,255,255,0.88)', mt: 0.25 }}>Stol 7 · Shu yerda</Box>
          </Box>

          {/* Category pills */}
          <Stack direction="row" spacing={0.6} sx={{ px: 1.25, py: 1, flexShrink: 0, borderBottom: '1px solid #F1F5F9' }}>
            {['Taomlar', 'Ichimliklar', 'Shirinlik'].map((cat, i) => (
              <Box key={cat} sx={{
                px: 1.1, py: 0.5, borderRadius: 99, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
                ...(i === 0
                  ? { bgcolor: ORANGE, color: '#fff' }
                  : { bgcolor: '#F1F5F9', color: '#475569' }),
              }}>{cat}</Box>
            ))}
          </Stack>

          {/* Item cards - same anatomy as the shipped menu: photo, name with a
              best-seller chip, description, price, round add button */}
          <Stack spacing={0.9} sx={{ px: 1.25, pt: 1, flex: 1, overflow: 'hidden', bgcolor: '#FAFAFA' }}>
            {items.map((it) => (
              <Stack key={it.n} direction="row" alignItems="flex-start" spacing={1.15} sx={{ p: 0.9, borderRadius: 2.5, bgcolor: '#fff', border: '1px solid #F1F5F9', flexShrink: 0 }}>
                <Box component="img" src={it.img} alt="" sx={{ width: 44, height: 44, borderRadius: 1.75, objectFit: 'cover', flexShrink: 0, bgcolor: CARD2 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ fontSize: 11, fontWeight: 700, color: '#0F172A', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.n}</Box>
                    {it.best && <Box sx={{ fontSize: 7.5, fontWeight: 800, color: '#B03D02', bgcolor: '#FFF1E4', px: 0.6, py: 0.15, borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0 }}>🔥 Mashhur</Box>}
                  </Stack>
                  <Box sx={{ fontSize: 8, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.d}</Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.5}>
                    <Box sx={{ fontSize: 10.5, fontWeight: 800, color: ORANGE }}>{it.p}</Box>
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: ORANGE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Add sx={{ fontSize: 13 }} />
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            ))}
          </Stack>

          {/* Floating cart bar, as the menu shows it once something is added */}
          <Box sx={{ px: 1.25, pt: 1, pb: 0.25, flexShrink: 0, bgcolor: '#FAFAFA' }}>
            <Stack
              direction="row" alignItems="center" justifyContent="center" spacing={0.75}
              sx={{ py: 1, borderRadius: 99, bgcolor: ORANGE, color: '#fff', boxShadow: `0 8px 18px ${GLOW}` }}
            >
              <ShoppingCart sx={{ fontSize: 13 }} />
              <Box sx={{ fontSize: 11, fontWeight: 700 }}>Savat (3)</Box>
              <Box sx={{ fontSize: 11, fontWeight: 800 }}>₩30 500</Box>
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1, flexShrink: 0, bgcolor: '#FAFAFA' }}>
            <Box sx={{ width: 88, height: 4, borderRadius: 99, bgcolor: 'rgba(0,0,0,0.25)' }} />
          </Box>
          {/* The device is deliberately cropped by the stage below it, so this
              spacer lifts the cart bar back above the cut. */}
          <Box sx={{ height: 74, flexShrink: 0, bgcolor: '#FAFAFA' }} />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * The kitchen display as it actually ships - dark board, the same three
 * columns and colours as pages/kitchen.tsx, with orders on it.
 */
function KitchenMock() {
  const cols = [
    {
      h: 'Yangi buyurtmalar', c: '#F59E0B',
      cards: [
        { t: 5, ago: '2 daqiqa', items: [['2', 'Palov'], ['1', 'Lag‘mon']], sum: '₩34 500', note: 'piyozsiz' },
        { t: 9, ago: '5 daqiqa', items: [['1', 'Shashlik']], sum: '₩8 000' },
      ],
    },
    {
      h: 'Tayyorlanmoqda', c: '#3B82F6',
      cards: [
        { t: 12, ago: '9 daqiqa', items: [['3', 'Somsa'], ['2', 'Choy']], sum: '₩27 000' },
      ],
    },
    {
      h: 'Berildi - to‘lov kutilmoqda', c: '#22C55E',
      cards: [
        { t: 3, ago: '21 daqiqa', items: [['2', 'Manti']], sum: '₩19 000', due: true },
      ],
    },
  ];
  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ position: 'absolute', inset: '-8%', background: `radial-gradient(ellipse, ${GLOW}, transparent 68%)`, filter: 'blur(28px)' }} />
      <Box sx={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', bgcolor: '#12121C', boxShadow: '0 30px 70px rgba(253,101,17,0.16)' }}>
        {/* Board top bar */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.35, bgcolor: '#0D0D18', borderBottom: '1px solid #1E1E2E' }}>
          <Kitchen sx={{ fontSize: 15, color: ORANGE_L }} />
          <Box sx={{ fontSize: 11.5, fontWeight: 800, color: '#fff' }}>Oshxona ekrani</Box>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22C55E', animation: `${pulse} 2s infinite` }} />
            <Box sx={{ fontSize: 9, fontWeight: 700, color: '#22C55E' }}>Jonli</Box>
          </Box>
        </Stack>

        <Grid container spacing={1} sx={{ p: { xs: 1.25, sm: 1.75 } }}>
          {cols.map((col) => (
            <Grid item xs={4} key={col.h}>
              <Stack direction="row" alignItems="center" spacing={0.6} mb={1}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: col.c, flexShrink: 0 }} />
                <Box sx={{ fontSize: 8.5, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{col.h}</Box>
                <Box sx={{ fontSize: 8, fontWeight: 800, color: col.c, bgcolor: `${col.c}22`, px: 0.55, borderRadius: 99, flexShrink: 0 }}>{col.cards.length}</Box>
              </Stack>
              <Stack spacing={0.85}>
                {col.cards.map((card) => (
                  <Box key={card.t} sx={{ p: 1, borderRadius: 2, bgcolor: '#1E1E2E', border: '1px solid #2A2A3E' }}>
                    <Stack direction="row" alignItems="center" spacing={0.6} mb={0.6}>
                      <Box sx={{
                        width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                        bgcolor: `${col.c}22`, color: col.c, fontSize: 7.5, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{card.t}</Box>
                      <Box sx={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{card.t}-stol</Box>
                      <Box sx={{ ml: 'auto', fontSize: 7.5, color: '#64748B', whiteSpace: 'nowrap' }}>{card.ago}</Box>
                    </Stack>
                    {card.items.map(([q, n]) => (
                      <Stack key={n} direction="row" spacing={0.5} sx={{ py: 0.15 }}>
                        <Box sx={{ fontSize: 8.5, fontWeight: 800, color: '#fff', flexShrink: 0 }}>×{q}</Box>
                        <Box sx={{ fontSize: 8.5, color: '#CBD5E1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</Box>
                      </Stack>
                    ))}
                    {card.note && (
                      <Box sx={{ mt: 0.5, fontSize: 7.5, color: '#FBBF24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Izoh: {card.note}
                      </Box>
                    )}
                    <Box sx={{ mt: 0.6, pt: 0.5, borderTop: '1px solid #2A2A3E', fontSize: 9, fontWeight: 800, color: card.due ? '#22C55E' : '#94A3B8', textAlign: 'right' }}>
                      {card.sum}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

const Home: NextPage = () => {
  const { t } = useMarketingT();
  const h = t.home;

  return (
    <>
      <Head><title>Vivora | QR Menu</title></Head>
      <Box sx={{ bgcolor: BG, color: TEXT, overflowX: 'hidden', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

        <MarketingNav />

        <Box component="main">
          {/* ── Hero ── */}
          <Box sx={{ position: 'relative' }}>
            {/* Ambient glow */}
            <Box sx={{ position: 'absolute', top: -180, left: '50%', transform: 'translateX(-50%)', width: 900, height: 500, background: `radial-gradient(ellipse, rgba(253,101,17,0.13), transparent 65%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
            <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 8, md: 12 }, pb: { xs: 7, md: 10 }, textAlign: 'center' }}>
              <Box sx={{ animation: `${fadeUp} .7s ${bounce} both` }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 3 }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: 99, border: '1px solid rgba(253,101,17,0.25)', bgcolor: 'rgba(253,101,17,0.07)' }}>
                    <Bolt sx={{ fontSize: 15, color: PRIMARY }} />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: PRIMARY }}>{h.badge}</Typography>
                  </Box>
                </Stack>
              </Box>

              <Typography component="h1" sx={{ animation: `${fadeUp} .7s ${bounce} .08s both`, fontSize: 'clamp(2.3rem, 6vw, 4.4rem)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.06, mb: 3 }}>
                {h.h1pre}
                <Box component="span" sx={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {h.h1grad}
                </Box>
                {h.h1post1}<br />{h.h1post2}
              </Typography>

              <Typography sx={{ animation: `${fadeUp} .7s ${bounce} .16s both`, fontSize: 'clamp(1rem, 1.4vw, 1.2rem)', color: MUTED, maxWidth: 640, mx: 'auto', lineHeight: 1.7, mb: 4.5 }}>
                {h.sub}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ animation: `${fadeUp} .7s ${bounce} .24s both`, mb: { xs: 6, md: 8 } }}>
                <Button component={NextLink} href="/register" sx={pill({ color: '#fff', background: GRAD, boxShadow: `0 14px 34px ${GLOW}`, '&:hover': { boxShadow: `0 18px 44px ${GLOW}`, transform: 'translateY(-2px)' } })}>
                  {h.start}
                </Button>
                <Button component={NextLink} href="/login" sx={pill({ color: PRIMARY, bgcolor: '#fff', border: '1px solid rgba(140,113,100,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', '&:hover': { bgcolor: '#fff', borderColor: 'rgba(253,101,17,0.4)', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' } })}>
                  {h.demo}
                </Button>
              </Stack>

              {/* Dashboard preview */}
              <Box sx={{ animation: `${fadeUp} .9s ${bounce} .34s both`, maxWidth: 860, mx: 'auto' }}>
                <DashboardMock />
              </Box>

              {/* Stat row */}
              <Grid container spacing={2} sx={{ mt: { xs: 3, md: 5 }, maxWidth: 860, mx: 'auto' }}>
                {h.metrics.map((m, i) => (
                  <Grid item xs={6} md={3} key={m.l}>
                    <Box sx={{ animation: `${fadeUp} .7s ${bounce} ${0.45 + i * 0.08}s both`, p: 2.25, borderRadius: 3, bgcolor: CARD, border: `1px solid ${BORDER}`, textAlign: 'center', boxShadow: '0 6px 18px rgba(253,101,17,0.06)', height: '100%' }}>
                      <Typography sx={{ fontSize: 26, fontWeight: 800, background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{m.n}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: MUTED, fontWeight: 600 }}>{m.l}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          {/* ── How it works ── */}
          <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: BG2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <Container maxWidth="lg">
              <Reveal sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY_DEEP, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>{h.howEyebrow}</Typography>
                <Typography sx={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {h.howTitle}
                </Typography>
              </Reveal>
              <Grid container spacing={3}>
                {h.steps.map((s, i) => (
                  <Grid item xs={12} md={4} key={s.title}>
                    <Reveal delay={i * 0.12} sx={{ height: '100%' }}>
                      <Box sx={{ position: 'relative', height: '100%', p: 3.5, borderRadius: 4, bgcolor: CARD, border: `1px solid ${BORDER}`, transition: 'transform .25s, box-shadow .25s', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 44px rgba(253,101,17,0.12)' } }}>
                        <Typography sx={{ position: 'absolute', top: 14, right: 20, fontSize: 52, fontWeight: 800, color: 'rgba(253,101,17,0.07)', lineHeight: 1 }}>{i + 1}</Typography>
                        <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: 'rgba(253,101,17,0.1)', border: '1px solid rgba(253,101,17,0.2)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                          {STEP_ICONS[i]}
                        </Box>
                        <Typography sx={{ fontSize: 19, fontWeight: 800, mb: 1 }}>{s.title}</Typography>
                        <Typography sx={{ fontSize: 14.5, color: MUTED, lineHeight: 1.65 }}>{s.desc}</Typography>
                      </Box>
                    </Reveal>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          {/* ── Product split: customer phone ── */}
          <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
            <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
              <Grid item xs={12} md={6}>
                <Reveal>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY_DEEP, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>{h.custEyebrow}</Typography>
                  <Typography sx={{ fontSize: 'clamp(1.6rem, 3vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, mb: 2, whiteSpace: 'pre-line' }}>
                    {h.custTitle}
                  </Typography>
                  <Typography sx={{ fontSize: 16, color: MUTED, lineHeight: 1.7, mb: 3, maxWidth: 460 }}>
                    {h.custDesc}
                  </Typography>
                  <Stack spacing={1.25}>
                    {h.custBullets.map((b) => (
                      <Stack key={b} direction="row" spacing={1.25} alignItems="center">
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: GRAD, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 14.5, color: TEXT, fontWeight: 500 }}>{b}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Reveal>
              </Grid>
              <Grid item xs={12} md={6}>
                <Reveal delay={0.15}>
                  {/* Phone centred on a warm stage panel */}
                  <Box sx={{
                    position: 'relative', overflow: 'hidden', borderRadius: '2.5rem',
                    background: 'linear-gradient(150deg, #fff3e8, #ffe6d3 55%, #ffdcc4)',
                    px: 2, pt: { xs: 5, md: 6 }, pb: { xs: 0, md: 0 },
                    display: 'flex', justifyContent: 'center',
                  }}>
                    {/* Decorative rings */}
                    <Box sx={{ position: 'absolute', top: '-22%', left: '-14%', width: '62%', height: '85%', border: '28px solid rgba(255,255,255,0.5)', borderRadius: '50%' }} />
                    <Box sx={{ position: 'absolute', bottom: '-30%', right: '-16%', width: '58%', height: '80%', border: '20px solid rgba(253,101,17,0.1)', borderRadius: '50%' }} />
                    {/* Phone, cropped at the stage edge so it sits in the panel */}
                    <Box sx={{ position: 'relative', mb: { xs: -6, md: -8 } }}>
                      <PhoneMock />
                    </Box>
                  </Box>
                </Reveal>
              </Grid>
            </Grid>
          </Container>

          {/* ── Product split: kitchen ── */}
          <Box sx={{ bgcolor: BG2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
              <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
                <Grid item xs={12} md={6} sx={{ width: '100%' }}>
                  <Reveal delay={0.15}>
                    {/* The kitchen board itself - a stock photo of someone
                        else's kitchen says nothing about the product */}
                    <KitchenMock />
                  </Reveal>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Reveal>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY_DEEP, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>{h.kitEyebrow}</Typography>
                    <Typography sx={{ fontSize: 'clamp(1.6rem, 3vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, mb: 2, whiteSpace: 'pre-line' }}>
                      {h.kitTitle}
                    </Typography>
                    <Typography sx={{ fontSize: 16, color: MUTED, lineHeight: 1.7, mb: 3, maxWidth: 460 }}>
                      {h.kitDesc}
                    </Typography>
                    <Stack spacing={1.25}>
                      {h.kitBullets.map((b) => (
                        <Stack key={b} direction="row" spacing={1.25} alignItems="center">
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: GRAD, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 14.5, color: TEXT, fontWeight: 500 }}>{b}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Reveal>
                </Grid>
              </Grid>
            </Container>
          </Box>

          {/* ── Features grid ── */}
          <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
            <Reveal sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY_DEEP, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>{h.featEyebrow}</Typography>
              <Typography sx={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 1.5 }}>
                {h.featTitle}
              </Typography>
              <Typography sx={{ fontSize: 16, color: MUTED, maxWidth: 560, mx: 'auto' }}>
                {h.featSub}
              </Typography>
            </Reveal>
            <Grid container spacing={2.5}>
              {h.features.map((f, i) => (
                <Grid item xs={12} sm={6} md={4} key={f.title}>
                  <Reveal delay={(i % 3) * 0.1} sx={{ height: '100%' }}>
                    <Box sx={{ height: '100%', p: 3, borderRadius: 4, bgcolor: CARD, border: `1px solid ${BORDER}`, transition: 'transform .25s, box-shadow .25s, border-color .25s', '&:hover': { transform: 'translateY(-5px)', borderColor: 'rgba(253,101,17,0.3)', boxShadow: '0 16px 36px rgba(253,101,17,0.1)' } }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: 'rgba(253,101,17,0.1)', border: '1px solid rgba(253,101,17,0.18)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, '& svg': { fontSize: 22 } }}>
                        {FEATURE_ICONS[i]}
                      </Box>
                      <Typography sx={{ fontSize: 16.5, fontWeight: 800, mb: 0.75 }}>{f.title}</Typography>
                      <Typography sx={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>{f.desc}</Typography>
                    </Box>
                  </Reveal>
                </Grid>
              ))}
            </Grid>
          </Container>

          {/* ── FAQ ── */}
          <Box sx={{ bgcolor: BG2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
              <Reveal sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY_DEEP, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>{h.faqEyebrow}</Typography>
                <Typography sx={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {h.faqTitle}
                </Typography>
              </Reveal>
              <Reveal>
                {h.faqs.map((f) => (
                  <Accordion key={f.q} disableGutters elevation={0} sx={{
                    bgcolor: CARD, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: '14px !important',
                    mb: 1.5, '&:before': { display: 'none' },
                    '&.Mui-expanded': { borderColor: 'rgba(253,101,17,0.35)', boxShadow: '0 10px 26px rgba(253,101,17,0.08)' },
                  }}>
                    <AccordionSummary expandIcon={<ExpandMore sx={{ color: MUTED }} />} sx={{ px: 3, py: 0.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 15.5 }}>{f.q}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                      <Typography sx={{ color: MUTED, fontSize: 14.5, lineHeight: 1.7 }}>{f.a}</Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Reveal>
            </Container>
          </Box>

          {/* ── CTA ── */}
          <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
            <Reveal>
              <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 5, p: { xs: 4, md: 8 }, textAlign: 'center', background: 'linear-gradient(135deg, #B45309, #D94E05 55%, #FD6511)' }}>
                <Box sx={{ position: 'absolute', top: '-40%', left: '-10%', width: '55%', height: '160%', border: '50px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} />
                <Box sx={{ position: 'absolute', bottom: '-50%', right: '-8%', width: '48%', height: '150%', border: '34px solid rgba(255,255,255,0.07)', borderRadius: '50%' }} />
                <Typography sx={{ position: 'relative', fontSize: 'clamp(1.7rem, 3.6vw, 2.7rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', mb: 2 }}>
                  {h.ctaTitle}
                </Typography>
                <Typography sx={{ position: 'relative', fontSize: 16.5, color: 'rgba(255,255,255,0.9)', mb: 4, maxWidth: 560, mx: 'auto', lineHeight: 1.6 }}>
                  {h.ctaSub}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ position: 'relative' }}>
                  <Button component={NextLink} href="/register" sx={pill({ bgcolor: '#fff', color: '#B45309', boxShadow: '0 14px 30px rgba(0,0,0,0.25)', '&:hover': { bgcolor: '#FFF7ED' } })}>
                    {h.start}
                  </Button>
                  <Button component={NextLink} href="/contact" sx={pill({ color: '#fff', border: '2px solid rgba(255,255,255,0.35)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' } })}>
                    {h.ctaTalk}
                  </Button>
                </Stack>
              </Box>
            </Reveal>
          </Container>
        </Box>

        <MarketingFooter />
      </Box>
    </>
  );
};

export default Home;
