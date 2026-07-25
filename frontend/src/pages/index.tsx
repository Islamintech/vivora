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
  Restaurant, QrCodeScanner, TouchApp, Whatshot, Bolt, BarChart, QrCode2,
  Terminal, Language, Payments, Inventory2, SupportAgent, PlayCircle,
  CheckCircle, RadioButtonUnchecked, Speed, Public, Chat, Email,
  VerifiedUser, Security, Kitchen, TrendingUp, ExpandMore,
} from '@mui/icons-material';

// ── Material-3 warm palette (from the reference design) ──
const PRIMARY = '#9d4300';
const ORANGE = '#f97316';
const SURFACE = '#fff8f2';
const ON_SURFACE = '#1f1b15';
const ON_VAR = '#584237';
const PEACH = '#ffdad3';
const ON_PEACH = '#30130d';
const SEC_CONT = '#f1dcc9';
const ON_SEC_CONT = '#6f6051';
const PRIMARY_FIXED = '#ffdbca';
const ON_PRIMARY_FIXED = '#341100';
const OUTLINE = '#8c7164';
const SC_LOW = '#fbf2e8';
const SC_HIGH = '#eae1d7';
const GRAD = `linear-gradient(90deg, ${PRIMARY}, ${ORANGE})`;

const floatSlow = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}`;
const pulseDot = keyframes`0%,100%{opacity:1}50%{opacity:.35}`;
const bounce = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

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

const metrics = [
  { n: '40%', l: 'Tezroq xizmat', tint: 'rgba(157,67,0,0.1)', c: '#9d4300' },
  { n: '~0', l: 'Buyurtma xatosi', tint: '#DCFCE7', c: '#15803D' },
  { n: '4', l: 'til: UZ · EN · RU · KO', tint: '#DBEAFE', c: '#2563EB' },
  { n: '24/7', l: 'Jonli kuzatuv', tint: '#F3E8FF', c: '#7C3AED' },
];

const faqs = [
  { q: 'Mijozga alohida ilova kerakmi?', a: "Yo'q. Mijoz telefon kamerasi bilan stoldagi QR kodni skanerlaydi va menyu to'g'ridan-to'g'ri brauzerda ochiladi — hech narsa o'rnatmaydi." },
  { q: 'Chek printeri shartmi?', a: "Ixtiyoriy. Printer bo'lsa, buyurtma tushishi bilan oshxona cheki avtomatik chiqadi. Bo'lmasa, buyurtmalar oshxona ekranida ko'rinadi." },
  { q: 'Qancha turadi?', a: "Bepul boshlashingiz mumkin, bank kartasi shart emas. Narx rejalari tez orada e'lon qilinadi." },
  { q: "Qaysi tillarni qo'llab-quvvatlaydi?", a: "Mijozlar menyusi o'zbek, ingliz, rus va koreys tillarida ko'rsatiladi. Mijoz skanerlaganda o'z tilini tanlaydi." },
  { q: "Ma'lumotlar xavfsizmi?", a: "Ha. Barcha ma'lumotlar shifrlangan ulanish orqali uzatiladi va xavfsiz saqlanadi." },
];

const steps = [
  { icon: <QrCodeScanner />, tint: SEC_CONT, on: ON_SEC_CONT, title: 'Skanerlash', desc: 'Mijoz stoldagi QR-kodni telefon kamerasida skanerlaydi.', r: '6deg' },
  { icon: <TouchApp />, tint: PRIMARY_FIXED, on: ON_PRIMARY_FIXED, title: 'Buyurtma berish', desc: 'Raqamli menyudan taomlarni tanlab, bir tugma orqali buyurtma yuboradi.', r: '-6deg' },
  { icon: <Whatshot />, tint: PEACH, on: ON_PEACH, title: 'Tayyorlanishi', desc: "Buyurtma darhol oshxona monitorida ko'rinadi va tayyorlanishni boshlaydi.", r: '6deg' },
];

const smallFeatures = [
  { icon: <Language />, label: "Ko'p tilli menyu" },
  { icon: <Payments />, label: "Qulay to'lovlar" },
  { icon: <Inventory2 />, label: 'Ombor nazorati' },
  { icon: <SupportAgent />, label: '24/7 Yordam' },
];

const kds = [
  { t: 'Stol 5 — Pizza', s: 'Yangi', bg: 'rgba(157,67,0,0.1)', c: PRIMARY },
  { t: 'Stol 12 — Burger', s: 'Tayyor', bg: '#DCFCE7', c: '#15803D' },
  { t: 'Stol 2 — Pasta', s: 'Jarayonda', bg: '#FEF3C7', c: '#B45309' },
];

const footerCols = [
  { h: 'Mahsulot', links: [['Xizmatlar', '/'], ['Narxlar', '/pricing'], ['Yangiliklar', '#'], ['API Hujjatlari', '#']] },
  { h: 'Kompaniya', links: [['Biz haqimizda', '/about'], ['Karyera', '#'], ['Blog', '#'], ["Bog'lanish", '/contact']] },
  { h: 'Huquqiy', links: [['Maxfiylik siyosati', '#'], ['Foydalanish shartlari', '#'], ['Cookie siyosati', '#']] },
];

const Home: NextPage = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pill = (extra: any = {}) => ({
    borderRadius: 99, fontWeight: 700, textTransform: 'none', px: 3, py: 1.25,
    fontSize: 14, boxShadow: 'none', ...extra,
  });

  return (
    <>
      <Head><title>Vivora | Modern Restoran Boshqaruvi</title></Head>
      <Box sx={{ bgcolor: SURFACE, color: ON_SURFACE, overflowX: 'hidden', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

        {/* ── Navbar ── */}
        <Box
          component="header"
          sx={{
            position: 'sticky', top: 0, zIndex: 50,
            bgcolor: 'rgba(255,248,242,0.7)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(140,113,100,0.1)',
            transition: 'all .3s', py: scrolled ? 1 : 2,
            boxShadow: scrolled ? '0 8px 24px rgba(157,67,0,0.06)' : 'none',
          }}
        >
          <Container maxWidth="xl">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1} sx={{ '&:hover .lg': { transform: 'rotate(6deg)' } }}>
                <Box className="lg" sx={{ width: 40, height: 40, borderRadius: 3, background: `linear-gradient(135deg, ${PRIMARY}, ${ORANGE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 18px rgba(157,67,0,0.3)', transition: 'transform .3s' }}>
                  <Restaurant />
                </Box>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: PRIMARY, letterSpacing: '-0.02em' }}>Vivora</Typography>
              </Stack>
              <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
                {[['Xizmatlar', '/'], ['Narxlar', '/pricing'], ['Biz haqimizda', '/about']].map(([l, href]) => (
                  <Typography key={l} component={NextLink} href={href} sx={{ fontSize: 14, fontWeight: 600, color: ON_VAR, textDecoration: 'none', '&:hover': { color: PRIMARY } }}>{l}</Typography>
                ))}
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button component={NextLink} href="/login" sx={pill({ display: { xs: 'none', sm: 'inline-flex' }, color: PRIMARY, bgcolor: SURFACE, border: '2px solid rgba(157,67,0,0.2)', '&:hover': { borderColor: 'rgba(157,67,0,0.4)', bgcolor: 'rgba(157,67,0,0.05)' } })}>Kirish</Button>
                <Button component={NextLink} href="/register" sx={pill({ color: '#fff', background: GRAD, boxShadow: '0 10px 20px rgba(157,67,0,0.3)', '&:hover': { boxShadow: '0 15px 30px rgba(157,67,0,0.4)', transform: 'translateY(-2px)' } })}>Bepul boshlash</Button>
              </Stack>
            </Stack>
          </Container>
        </Box>

        <Box component="main">
          {/* ── Hero ── */}
          <Container maxWidth="xl" sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 8, md: 10 } }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, bgcolor: 'rgba(241,220,201,0.5)', color: ON_SEC_CONT, borderRadius: 99, border: `1px solid ${SEC_CONT}`, mb: 3 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIMARY, animation: `${pulseDot} 2s infinite` }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Restoranlar uchun #1 tanlov</Typography>
                </Box>
                <Typography sx={{ fontSize: 'clamp(2.3rem, 4.6vw, 4.2rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', mb: 3 }}>
                  Stoldan oshxonagacha —{' '}
                  <Box component="span" sx={{ color: PRIMARY, fontStyle: 'italic', position: 'relative' }}>
                    bir zumda
                    <Box component="svg" viewBox="0 0 100 20" preserveAspectRatio="none" sx={{ position: 'absolute', left: 0, bottom: -8, width: '100%', height: 10, color: 'rgba(157,67,0,0.25)' }}>
                      <path d="M0 10 Q 25 0, 50 10 T 100 10" fill="none" stroke="currentColor" strokeWidth="4" />
                    </Box>
                  </Box>
                </Typography>
                <Typography sx={{ fontSize: "clamp(1rem, 1.35vw, 1.22rem)", fontWeight: 500, color: ON_VAR, lineHeight: 1.65, mb: 4, maxWidth: 520, mx: { xs: 'auto', md: 0 } }}>
                  QR-kod orqali buyurtma berish tizimi bilan mijozlaringizga yuqori darajadagi qulaylik yarating va restoraningiz samaradorligini 2 barobarga oshiring.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                  <Button component={NextLink} href="/register" sx={pill({ py: 1.75, px: 4, fontSize: 15, color: '#fff', background: GRAD, boxShadow: '0 10px 24px rgba(157,67,0,0.3)', '&:hover': { boxShadow: '0 16px 34px rgba(157,67,0,0.4)', transform: 'translateY(-2px)' } })}>Hozir boshlang</Button>
                  <Button component={NextLink} href="/login" startIcon={<PlayCircle />} sx={pill({ py: 1.75, px: 4, fontSize: 15, color: PRIMARY, bgcolor: '#fff', border: '1px solid rgba(140,113,100,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', '&:hover': { bgcolor: SURFACE, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' } })}>Demoni ko&apos;rish</Button>
                </Stack>
              </Grid>

              {/* phone */}
              <Grid item xs={12} md={6}>
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', py: { xs: 3, md: 5 } }}>
                  {/* calm backdrop */}
                  <Box sx={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,214,180,0.45), transparent 66%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                  {/* phone */}
                  <Box sx={{ position: 'relative', width: { xs: 264, sm: 292, xl: 324 }, bgcolor: '#141414', borderRadius: '2.9rem', p: '9px', boxShadow: '0 40px 80px -24px rgba(67,34,27,0.45)', animation: `${floatSlow} 6s ease-in-out infinite` }}>
                    <Box sx={{ borderRadius: '2.4rem', overflow: 'hidden', bgcolor: '#fff', display: 'flex', flexDirection: 'column', height: 556 }}>
                      {/* food photo */}
                      <Box sx={{ height: 218, position: 'relative', flexShrink: 0 }}>
                        <Box
                          component="img"
                          src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=640&q=80&auto=format&fit=crop"
                          alt="Margarita Pizza"
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent 45%, #fff)' }} />
                      </Box>
                      {/* content */}
                      <Box sx={{ p: 2.5, pt: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontSize: 19, fontWeight: 800, color: ON_SURFACE, mb: 0.5 }}>Margarita Pizza</Typography>
                        <Typography sx={{ fontSize: 13, color: ON_VAR, lineHeight: 1.5, mb: 2 }}>Yangitdan tayyorlangan pomidor va mozzarella</Typography>
                        <Stack spacing={1.25}>
                          {[['Qalin xamir', true], ["Qo'shimcha pishloq", false]].map(([label, on]) => (
                            <Stack key={label as string} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.75, py: 1.25, bgcolor: '#fff', borderRadius: 3, border: `1.5px solid ${on ? 'rgba(157,67,0,0.25)' : 'rgba(140,113,100,0.14)'}` }}>
                              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: ON_SURFACE }}>{label as string}</Typography>
                              {on ? <CheckCircle sx={{ fontSize: 19, color: PRIMARY }} /> : <RadioButtonUnchecked sx={{ fontSize: 19, color: 'rgba(140,113,100,0.35)' }} />}
                            </Stack>
                          ))}
                        </Stack>
                        <Box sx={{ mt: 'auto', background: GRAD, color: '#fff', borderRadius: 4, py: 1.6, textAlign: 'center', boxShadow: '0 10px 22px rgba(157,67,0,0.32)' }}>
                          <Typography sx={{ fontSize: 14.5, fontWeight: 800 }}>Savatga qo&apos;shish — 45 000</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>

          {/* ── Value metrics ── */}
          <Container maxWidth="xl" sx={{ pb: { xs: 4, md: 6 } }}>
            <Reveal>
              <Grid container spacing={2}>
                {metrics.map((m) => (
                  <Grid item xs={6} md={3} key={m.l}>
                    <Box sx={{ bgcolor: '#fff', borderRadius: 4, p: { xs: 2.5, md: 3 }, textAlign: 'center', border: '1px solid rgba(140,113,100,0.06)', boxShadow: '0 4px 14px rgba(157,67,0,0.05)' }}>
                      <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: 99, bgcolor: m.tint, mb: 1 }}>
                        <Typography sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 800, color: m.c, lineHeight: 1 }}>{m.n}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: ON_VAR }}>{m.l}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Reveal>
          </Container>

          {/* ── How it works ── */}
          <Box sx={{ py: { xs: 12, md: 16 } }}>
            <Container maxWidth="xl">
              <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
                <Typography sx={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 2 }}>Uch qadamda oson buyurtma</Typography>
                <Typography sx={{ fontSize: 16, color: ON_VAR, maxWidth: 620, mx: 'auto' }}>Mijozlaringiz uchun ortiqcha kutishlarsiz, qulay va tezkor xizmat ko&apos;rsatish tizimi.</Typography>
              </Box>
              <Grid container spacing={4}>
                {steps.map((s, i) => (
                  <Grid item xs={12} md={4} key={s.title}>
                    <Box sx={{ textAlign: 'center', '&:hover .st': { transform: `scale(1.1) rotate(${s.r})` } }}>
                      <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                        <Box className="st" sx={{ width: 80, height: 80, borderRadius: '2rem', bgcolor: s.tint, color: s.on, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .5s', '& svg': { fontSize: 36 } }}>{s.icon}</Box>
                        <Box sx={{ position: 'absolute', top: -8, right: -8, width: 32, height: 32, borderRadius: '50%', bgcolor: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>{i + 1}</Box>
                      </Box>
                      <Typography sx={{ fontSize: 20, fontWeight: 700, color: PRIMARY, mb: 1 }}>{s.title}</Typography>
                      <Typography sx={{ fontSize: 16, color: ON_VAR }}>{s.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          {/* ── Bento features ── */}
          <Box sx={{ py: { xs: 12, md: 16 }, bgcolor: SC_LOW }}>
            <Container maxWidth="xl">
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-end' }} spacing={2} mb={8}>
                <Box sx={{ maxWidth: 560 }}>
                  <Typography sx={{ fontSize: 'clamp(1.9rem, 3.6vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>Barcha imkoniyatlar bir joyda</Typography>
                  <Typography sx={{ fontSize: 18, color: ON_VAR }}>Vivora tizimi restoraningizni to&apos;liq raqamlashtirish uchun barcha zamonaviy asboblarga ega.</Typography>
                </Box>
                <Button sx={pill({ flexShrink: 0, color: PRIMARY, bgcolor: '#fff', border: '1px solid rgba(140,113,100,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' } })}>Barcha xizmatlarni ko&apos;rish</Button>
              </Stack>

              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' } }}>
                {/* Big card */}
                <Box sx={{ gridColumn: { md: 'span 8' }, position: 'relative', overflow: 'hidden', bgcolor: '#fff', p: 4, borderRadius: '2rem', border: '1px solid rgba(140,113,100,0.05)', transition: `all .4s ${bounce}`, '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(157,67,0,0.08)' }, '&:hover .big-ic': { bgcolor: PRIMARY, color: '#fff' } }}>
                  <Box className="big-ic" sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'rgba(157,67,0,0.1)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, transition: 'all .3s', '& svg': { fontSize: 30 } }}><Bolt /></Box>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, mb: 1 }}>Tezkor buyurtma tizimi</Typography>
                  <Typography sx={{ fontSize: 18, color: ON_VAR, maxWidth: 440 }}>Mijozlar ofitsiantni kutmasdan buyurtma berishadi. Bu xizmat tezligini 40% ga oshiradi va xatolarni butunlay yo&apos;qotadi.</Typography>
                  <Speed sx={{ position: 'absolute', right: 24, bottom: 16, fontSize: 150, color: PRIMARY, opacity: 0.12 }} />
                </Box>

                {/* Stats card */}
                <Box sx={{ gridColumn: { md: 'span 4' }, background: `linear-gradient(135deg, ${PRIMARY}, ${ORANGE})`, color: '#fff', p: 4, borderRadius: '2rem', boxShadow: '0 12px 28px rgba(157,67,0,0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: `all .4s ${bounce}`, '&:hover': { transform: 'translateY(-8px)' } }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}><BarChart /></Box>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 0.5 }}>Real-vaqt Statistikasi</Typography>
                    <Typography sx={{ fontSize: 14, color: 'rgba(255,219,202,0.85)', lineHeight: 1.6 }}>Savdolar, eng mashhur taomlar va kassa holatini dunyoning istalgan nuqtasidan kuzatib boring.</Typography>
                  </Box>
                </Box>

                {/* QR card */}
                <Box sx={{ gridColumn: { md: 'span 4' }, bgcolor: '#fff', p: 4, borderRadius: '2rem', border: '1px solid rgba(140,113,100,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: `all .4s ${bounce}`, '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(157,67,0,0.08)' }, '&:hover .qr-ic': { bgcolor: PRIMARY, color: '#fff' } }}>
                  <Box className="qr-ic" sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: 'rgba(241,220,201,0.5)', color: ON_SEC_CONT, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, transition: 'all .3s' }}><QrCode2 /></Box>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 0.5 }}>Smart QR-kodlar</Typography>
                    <Typography sx={{ fontSize: 14, color: ON_VAR }}>Har bir stol uchun noyob va chiroyli dizayndagi, brendingizga mos QR-kodlar.</Typography>
                  </Box>
                </Box>

                {/* KDS card */}
                <Box sx={{ gridColumn: { md: 'span 8' }, bgcolor: SEC_CONT, p: 4, borderRadius: '2rem', border: '1px solid rgba(140,113,100,0.05)', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 3, transition: `all .4s ${bounce}`, '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(157,67,0,0.08)' } }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.5)', color: ON_SEC_CONT, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}><Terminal /></Box>
                    <Typography sx={{ fontSize: 24, fontWeight: 800, mb: 1 }}>Kitchen Display System (KDS)</Typography>
                    <Typography sx={{ fontSize: 15, color: 'rgba(111,96,81,0.9)', lineHeight: 1.6 }}>Oshpazlar uchun qulay raqamli monitor. Qog&apos;oz cheklardan voz keching, xatolarni 0 ga tushiring.</Typography>
                  </Box>
                  <Box sx={{ flex: 1, width: '100%', bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', p: 2.5, borderRadius: 4, border: '1px solid #fff', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)' }}>
                    <Stack spacing={1.5}>
                      {kds.map((k) => (
                        <Stack key={k.t} direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: `1px solid ${SURFACE}`, pb: 1 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{k.t}</Typography>
                          <Box sx={{ px: 1.5, py: 0.5, borderRadius: 99, bgcolor: k.bg, color: k.c, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.s}</Box>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Box>

              {/* small feature row */}
              <Grid container spacing={2} mt={2}>
                {smallFeatures.map((f) => (
                  <Grid item xs={6} md={3} key={f.label}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2.5, bgcolor: '#fff', borderRadius: 4, border: '1px solid rgba(140,113,100,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'all .2s', '&:hover': { borderColor: 'rgba(157,67,0,0.2)' } }}>
                      <Box sx={{ color: PRIMARY, display: 'flex' }}>{f.icon}</Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{f.label}</Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          {/* ── Product showcase ── */}
          <Box sx={{ py: { xs: 12, md: 16 } }}>
            <Container maxWidth="xl">
              <Reveal>
                <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
                  <Typography sx={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.9rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 2 }}>Butun tizimni bir joydan boshqaring</Typography>
                  <Typography sx={{ fontSize: 18, color: ON_VAR, maxWidth: 620, mx: 'auto' }}>Mijoz telefonidan oshxonagacha, oshxonadan hisobotgacha — hammasi bog&apos;langan.</Typography>
                </Box>
              </Reveal>

              {/* Kitchen */}
              <Reveal>
                <Grid container spacing={6} alignItems="center" sx={{ mb: { xs: 10, md: 16 } }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'rgba(157,67,0,0.1)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, '& svg': { fontSize: 28 } }}><Kitchen /></Box>
                    <Typography sx={{ fontSize: 24, fontWeight: 800, mb: 1.5 }}>Jonli oshxona ekrani</Typography>
                    <Typography sx={{ fontSize: 17, color: ON_VAR, lineHeight: 1.7, mb: 2.5 }}>Buyurtmalar ekranga darhol tushadi. Xodimlar band bo&apos;lsa ham, holat o&apos;zi harakatlanadi — chek chiqishi bilan «tayyorlanmoqda», 20 daqiqada avtomatik «berildi».</Typography>
                    <Stack spacing={1}>
                      {['Take-out buyurtmalar alohida belgilanadi', 'Bir tugma bilan «Berildi»', 'Take-out uchun avtomatik chek'].map((b) => (
                        <Stack key={b} direction="row" alignItems="center" spacing={1}>
                          <CheckCircle sx={{ fontSize: 18, color: '#16A34A' }} />
                          <Typography sx={{ fontSize: 15, color: ON_VAR }}>{b}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ bgcolor: '#0F1117', borderRadius: '2rem', p: 3, boxShadow: '0 30px 60px rgba(0,0,0,0.22)' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Kitchen sx={{ color: ORANGE, fontSize: 20 }} />
                          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Oshxona ekrani</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ bgcolor: 'rgba(34,197,94,0.15)', px: 1, py: 0.25, borderRadius: 99 }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22C55E', animation: `${pulseDot} 1.6s infinite` }} />
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#22C55E' }}>JONLI</Typography>
                        </Stack>
                      </Stack>
                      <Stack spacing={1.5}>
                        {[['5-stol', '2 ta taom', '#F59E0B', 'Yangi'], ['12-stol', '1 ta taom', '#3B82F6', 'Tayyorlanmoqda']].map(([stol, items, col, st]) => (
                          <Box key={stol} sx={{ bgcolor: '#1E1E2E', borderRadius: 3, p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{stol}</Typography>
                              <Box sx={{ px: 1, py: 0.25, borderRadius: 99, bgcolor: `${col}22`, color: col, fontSize: 10, fontWeight: 700 }}>{st}</Box>
                            </Stack>
                            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, mb: 1.5 }}>{items}</Typography>
                            <Box sx={{ bgcolor: '#22C55E', color: '#052e16', borderRadius: 2, py: 0.75, textAlign: 'center', fontSize: 12, fontWeight: 800 }}>Berildi</Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>
              </Reveal>

              {/* Dashboard */}
              <Reveal>
                <Grid container spacing={6} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ bgcolor: '#fff', borderRadius: '2rem', p: 3, border: '1px solid rgba(140,113,100,0.08)', boxShadow: '0 20px 50px rgba(157,67,0,0.08)' }}>
                      <Grid container spacing={1.5} mb={2}>
                        {[['Daromad', '₩1.2M'], ['Buyurtma', '48'], ["O'rtacha", '₩25k']].map(([l, v]) => (
                          <Grid item xs={4} key={l}>
                            <Box sx={{ bgcolor: SC_LOW, borderRadius: 3, p: 1.5, textAlign: 'center' }}>
                              <Typography sx={{ fontSize: { xs: 15, md: 18 }, fontWeight: 800, color: ON_SURFACE }}>{v}</Typography>
                              <Typography sx={{ fontSize: 11, color: ON_VAR }}>{l}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      <Box sx={{ bgcolor: SC_LOW, borderRadius: 3, p: 2 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: ON_VAR, mb: 1.5 }}>Haftalik daromad</Typography>
                        <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ height: 90 }}>
                          {[45, 68, 52, 84, 63, 100, 78].map((h, i) => (
                            <Box key={i} sx={{ flex: 1, height: `${h}%`, borderRadius: 1.5, background: i === 5 ? `linear-gradient(180deg, ${ORANGE}, ${PRIMARY})` : '#FCD9B6' }} />
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, '& svg': { fontSize: 28 } }}><TrendingUp /></Box>
                    <Typography sx={{ fontSize: 24, fontWeight: 800, mb: 1.5 }}>Kuchli tahlil paneli</Typography>
                    <Typography sx={{ fontSize: 17, color: ON_VAR, lineHeight: 1.7, mb: 2.5 }}>Daromad, eng mashhur taomlar va stollar bandligini real vaqtda kuzating — istalgan qurilmadan.</Typography>
                    <Stack spacing={1}>
                      {['Real vaqtdagi daromad va buyurtmalar', 'Mashhur taomlar reytingi', 'Stollar aylanmasi va mijoz fikrlari'].map((b) => (
                        <Stack key={b} direction="row" alignItems="center" spacing={1}>
                          <CheckCircle sx={{ fontSize: 18, color: '#16A34A' }} />
                          <Typography sx={{ fontSize: 15, color: ON_VAR }}>{b}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </Reveal>
            </Container>
          </Box>

          {/* ── FAQ ── */}
          <Box sx={{ py: { xs: 12, md: 16 }, bgcolor: SC_LOW }}>
            <Container maxWidth="md">
              <Reveal>
                <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
                  <Typography sx={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.9rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>Ko&apos;p so&apos;raladigan savollar</Typography>
                </Box>
                <Stack spacing={1.5}>
                  {faqs.map((f) => (
                    <Accordion key={f.q} disableGutters elevation={0} sx={{ bgcolor: '#fff', borderRadius: '1.25rem !important', border: '1px solid rgba(140,113,100,0.08)', '&:before': { display: 'none' }, overflow: 'hidden' }}>
                      <AccordionSummary expandIcon={<ExpandMore sx={{ color: PRIMARY }} />} sx={{ px: 3, py: 1 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, color: ON_SURFACE }}>{f.q}</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 3, pb: 2.5, pt: 0 }}>
                        <Typography sx={{ fontSize: 15, color: ON_VAR, lineHeight: 1.7 }}>{f.a}</Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </Reveal>
            </Container>
          </Box>

          {/* ── Final CTA ── */}
          <Container maxWidth="lg" sx={{ py: { xs: 12, md: 16 } }}>
            <Box sx={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${ORANGE}, ${PRIMARY})`, borderRadius: '3rem', px: { xs: 4, md: 12 }, py: { xs: 8, md: 12 }, textAlign: 'center', color: '#fff', boxShadow: '0 40px 80px rgba(157,67,0,0.3)' }}>
              <Box sx={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '120%', border: '60px solid rgba(255,255,255,0.15)', borderRadius: '50%' }} />
              <Box sx={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '70%', height: '130%', border: '30px solid rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Typography sx={{ position: 'relative', fontSize: 'clamp(1.9rem, 3.6vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 3 }}>Restoraningizni keyingi bosqichga olib chiqing</Typography>
              <Typography sx={{ position: 'relative', fontSize: 18, opacity: 0.9, mb: 4, maxWidth: 620, mx: 'auto', lineHeight: 1.6 }}>Hozir ro&apos;yxatdan o&apos;ting va 14 kunlik bepul sinov muddatiga ega bo&apos;ling. Hech qanday kredit karta talab qilinmaydi.</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ position: 'relative' }}>
                <Button component={NextLink} href="/register" sx={pill({ py: 1.75, px: 4, fontSize: 15, bgcolor: '#fff', color: PRIMARY, boxShadow: '0 14px 30px rgba(0,0,0,0.2)', '&:hover': { bgcolor: SURFACE } })}>Bepul boshlash</Button>
                <Button sx={pill({ py: 1.75, px: 4, fontSize: 15, color: '#fff', border: '2px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' } })}>Mutaxassis bilan gaplashish</Button>
              </Stack>
            </Box>
          </Container>
        </Box>

        {/* ── Footer ── */}
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
};

export default Home;
