import type { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { keyframes } from '@mui/system';
import {
  Box, Container, Typography, Button, Grid, Card,
  CardContent, Stack, Chip, Avatar,
} from '@mui/material';
import {
  QrCode2, Kitchen, Analytics, TableRestaurant,
  Translate, RocketLaunch, CheckCircle, Print, ReceiptLong,
  Add, ArrowForward, Bolt,
} from '@mui/icons-material';

// --- animations ---
const floatY = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
`;
const floatYSlow = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
  70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
`;

const features = [
  { icon: <QrCode2 />, color: '#F97316', title: 'QR orqali buyurtma', desc: 'Har bir stol uchun alohida QR kod. Mijozlar skanerlab, menyuni ko‘radi, buyurtma beradi — ilova kerak emas.' },
  { icon: <Kitchen />, color: '#3B82F6', title: 'Jonli oshxona ekrani', desc: 'Buyurtmalar oshxona ekranida bir zumda paydo bo‘ladi. Xodimlar holatni real vaqtda yangilaydi.' },
  { icon: <Print />, color: '#8B5CF6', title: 'Avtomatik chek chop etish', desc: 'Buyurtma tushishi bilan oshxona printeridan chek chiqadi — dine-in yoki olib ketish belgisi bilan.' },
  { icon: <Analytics />, color: '#22C55E', title: 'Real vaqtdagi tahlil', desc: 'Daromad, stollar bandligi, mashhur taomlar va buyurtmalar tarixini jonli kuzating.' },
  { icon: <Translate />, color: '#EC4899', title: 'Ko‘p tilli menyu', desc: 'Mijozlar menyusi o‘zbek, ingliz, rus va koreys tillarida ko‘rsatiladi.' },
  { icon: <RocketLaunch />, color: '#0EA5E9', title: 'Super-admin paneli', desc: 'Platforma bo‘ylab nazorat — barcha restoranlar, buyurtmalar, xatolar va hisoblar.' },
];

const steps = [
  { icon: <QrCode2 />, title: 'Skanerlang', desc: 'Mijoz stoldagi QR kodni telefonida skanerlaydi — ilova o‘rnatmaydi.' },
  { icon: <ReceiptLong />, title: 'Buyurtma bering', desc: 'O‘z tilida menyuni ko‘radi, savatga qo‘shadi va bir tugma bilan buyurtma beradi.' },
  { icon: <Kitchen />, title: 'Oshxona tayyorlaydi', desc: 'Buyurtma darhol oshxona ekranida va chekda paydo bo‘ladi.' },
];

// A small menu item row inside the phone mockup.
const PhoneItem = ({ emoji, name, price, popular }: { emoji: string; name: string; price: string; popular?: boolean }) => (
  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ bgcolor: 'white', borderRadius: 2.5, p: 1, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
    <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{emoji}</Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }} noWrap>{name}</Typography>
        {popular && <Box sx={{ fontSize: 10 }}>⭐</Box>}
      </Stack>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#F97316' }}>{price}</Typography>
    </Box>
    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#F97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Add sx={{ fontSize: 15 }} />
    </Box>
  </Stack>
);

// Small floating "notification" card around the phone.
const FloatCard = ({ sx, icon, title, sub, delay = 0 }: any) => (
  <Box
    sx={{
      position: 'absolute', bgcolor: 'white', borderRadius: 3, px: 1.5, py: 1,
      boxShadow: '0 12px 30px rgba(15,23,42,0.16)', display: 'flex', alignItems: 'center', gap: 1,
      animation: `${floatYSlow} 5s ease-in-out ${delay}s infinite`,
      ...sx,
    }}
  >
    {icon}
    <Box>
      <Typography sx={{ fontSize: 11.5, fontWeight: 800, lineHeight: 1.2 }}>{title}</Typography>
      <Typography sx={{ fontSize: 10.5, color: 'text.secondary', lineHeight: 1.2 }}>{sub}</Typography>
    </Box>
  </Box>
);

const Home: NextPage = () => {
  return (
    <>
      <Head><title>Vivora — Aqlli restoran boshqaruvi</title></Head>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflowX: 'hidden' }}>

        {/* Navbar */}
        <Box
          component="nav"
          sx={{
            position: 'sticky', top: 0, zIndex: 100,
            bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(14px)',
            borderBottom: '1px solid', borderColor: 'divider', py: 1.25,
          }}
        >
          <Container maxWidth="lg">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 32, height: 32, borderRadius: 2, background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.4)' }}>
                  <QrCode2 sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">Vivora</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button component={NextLink} href="/login" variant="text" color="secondary" size="small">
                  Kirish
                </Button>
                <Button component={NextLink} href="/register" variant="contained" size="small" sx={{ boxShadow: '0 4px 12px rgba(249,115,22,0.35)' }}>
                  Bepul boshlash
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* Hero */}
        <Box sx={{ position: 'relative', pt: { xs: 6, md: 12 }, pb: { xs: 10, md: 16 }, overflow: 'hidden', background: 'linear-gradient(165deg, #FFF7ED 0%, #FFFFFF 45%, #EFF6FF 100%)' }}>
          {/* decorative blurred orbs */}
          <Box sx={{ position: 'absolute', top: -80, right: -60, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.28), transparent 70%)', filter: 'blur(20px)' }} />
          <Box sx={{ position: 'absolute', bottom: -100, left: -80, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.22), transparent 70%)', filter: 'blur(20px)' }} />

          <Container maxWidth="lg" sx={{ position: 'relative' }}>
            <Grid container spacing={{ xs: 6, md: 4 }} alignItems="center">
              {/* Copy */}
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Chip
                    icon={<Bolt sx={{ fontSize: 16 }} />}
                    label="Ilovasiz — faqat skanerlang"
                    color="primary"
                    sx={{ mb: 3, fontWeight: 700, bgcolor: 'rgba(249,115,22,0.1)', color: '#EA580C', border: 'none', animation: `${fadeUp} .5s ease both` }}
                  />
                  <Typography variant="h1" sx={{ fontSize: { xs: '2.4rem', sm: '3rem', md: '3.6rem' }, mb: 2.5, lineHeight: 1.08, letterSpacing: '-0.03em', animation: `${fadeUp} .5s ease .05s both` }}>
                    Stoldan oshxonagacha —{' '}
                    <Box component="span" sx={{ background: 'linear-gradient(120deg, #F97316, #EA580C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      bir necha soniyada
                    </Box>
                  </Typography>
                  <Typography variant="h6" color="text.secondary" fontWeight={400} mb={4} lineHeight={1.7} sx={{ maxWidth: 520, mx: { xs: 'auto', md: 0 }, animation: `${fadeUp} .5s ease .1s both` }}>
                    QR menyular, jonli oshxona buyurtmalari, avtomatik chek va real vaqtdagi tahlil.
                    Restoraningizga kerak bo‘lgan hamma narsa bitta panelda.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ animation: `${fadeUp} .5s ease .15s both` }}>
                    <Button component={NextLink} href="/register" variant="contained" size="large" endIcon={<ArrowForward />} sx={{ px: 4, py: 1.5, fontSize: '1rem', boxShadow: '0 10px 26px rgba(249,115,22,0.4)' }}>
                      Bepul boshlash
                    </Button>
                    <Button component={NextLink} href="/login" variant="outlined" color="secondary" size="large" sx={{ px: 4, py: 1.5, fontSize: '1rem' }}>
                      Kirish
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={3} justifyContent={{ xs: 'center', md: 'flex-start' }} mt={3} sx={{ animation: `${fadeUp} .5s ease .2s both` }}>
                    {[['4', 'til'], ['₩', 'won / ko‘p valyuta'], ['24/7', 'jonli']].map(([n, l]) => (
                      <Stack key={l} direction="row" spacing={0.75} alignItems="center">
                        <CheckCircle sx={{ fontSize: 16, color: '#22C55E' }} />
                        <Typography variant="caption" color="text.secondary"><b>{n}</b> {l}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Grid>

              {/* Phone mockup */}
              <Grid item xs={12} md={6}>
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', animation: `${fadeUp} .6s ease .1s both` }}>
                  <Box sx={{ position: 'relative', animation: `${floatY} 6s ease-in-out infinite` }}>
                    {/* Phone frame */}
                    <Box sx={{ width: 280, borderRadius: 6, bgcolor: '#0F172A', p: 1, boxShadow: '0 40px 80px -20px rgba(15,23,42,0.45)' }}>
                      <Box sx={{ borderRadius: 5, overflow: 'hidden', bgcolor: '#FAFAFA', position: 'relative' }}>
                        {/* notch */}
                        <Box sx={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 90, height: 20, bgcolor: '#0F172A', borderRadius: 999, zIndex: 2 }} />
                        {/* menu header */}
                        <Box sx={{ background: 'linear-gradient(160deg, #0F172A, #1E293B)', pt: 4, pb: 2, px: 2, textAlign: 'center' }}>
                          <Avatar sx={{ width: 40, height: 40, mx: 'auto', mb: 0.5, bgcolor: '#F97316', fontSize: 18, fontWeight: 800 }}>V</Avatar>
                          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 14 }}>Vivora Cafe</Typography>
                          <Typography sx={{ color: 'grey.500', fontSize: 11 }}>Table 4 · Dine in</Typography>
                        </Box>
                        {/* pills */}
                        <Stack direction="row" spacing={0.75} sx={{ px: 1.5, py: 1, bgcolor: 'white', overflow: 'hidden' }}>
                          {['Popular', 'Mains', 'Drinks'].map((c, i) => (
                            <Box key={c} sx={{ fontSize: 10.5, fontWeight: 700, px: 1.25, py: 0.5, borderRadius: 999, whiteSpace: 'nowrap', bgcolor: i === 0 ? '#F97316' : '#F1F5F9', color: i === 0 ? 'white' : 'text.secondary' }}>{c}</Box>
                          ))}
                        </Stack>
                        {/* items */}
                        <Stack spacing={1} sx={{ p: 1.5, pt: 1, pb: 7 }}>
                          <PhoneItem emoji="🍚" name="Bibimbap" price="₩9,500" popular />
                          <PhoneItem emoji="🍜" name="Kalguksu" price="₩8,000" />
                          <PhoneItem emoji="🥟" name="Mandu (6)" price="₩6,500" />
                        </Stack>
                        {/* bottom cart bar */}
                        <Box sx={{ position: 'absolute', bottom: 10, left: 12, right: 12, bgcolor: '#F97316', color: 'white', borderRadius: 3, py: 1, textAlign: 'center', boxShadow: '0 8px 20px rgba(249,115,22,0.5)' }}>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>Your Order (2) — ₩16,000</Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* floating cards */}
                    <FloatCard
                      sx={{ top: 40, left: -46, display: { xs: 'none', sm: 'flex' } }}
                      delay={0}
                      icon={<Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#22C55E', animation: `${pulse} 2s infinite` }} />}
                      title="New order!"
                      sub="Table 4 · 2 items"
                    />
                    <FloatCard
                      sx={{ bottom: 70, right: -40, display: { xs: 'none', sm: 'flex' } }}
                      delay={1.2}
                      icon={<Print sx={{ fontSize: 20, color: '#8B5CF6' }} />}
                      title="Ticket printed"
                      sub="Kitchen · SAM4S"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* How it works */}
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Box textAlign="center" mb={{ xs: 6, md: 8 }}>
            <Typography variant="overline" color="primary" fontWeight={800} letterSpacing="0.1em">Qanday ishlaydi</Typography>
            <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: '-0.02em' }}>Uch qadamda</Typography>
          </Box>
          <Grid container spacing={4}>
            {steps.map((s, i) => (
              <Grid item xs={12} md={4} key={s.title}>
                <Box sx={{ textAlign: 'center', position: 'relative' }}>
                  <Box sx={{ position: 'relative', width: 76, height: 76, mx: 'auto', mb: 2.5 }}>
                    <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', bgcolor: '#FFF7ED', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { fontSize: 32 } }}>
                      {s.icon}
                    </Box>
                    <Box sx={{ position: 'absolute', top: -6, right: 6, width: 26, height: 26, borderRadius: '50%', bgcolor: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{i + 1}</Box>
                  </Box>
                  <Typography variant="h6" fontWeight={800} mb={1}>{s.title}</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7} sx={{ maxWidth: 300, mx: 'auto' }}>{s.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Features */}
        <Box sx={{ bgcolor: '#F8FAFC', py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Box textAlign="center" mb={{ xs: 6, md: 8 }}>
              <Typography variant="h3" fontWeight={800} mb={2} sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: '-0.02em' }}>
                Hammasi bitta panelda
              </Typography>
              <Typography variant="h6" color="text.secondary" fontWeight={400}>
                Dasturchilar uchun emas, restoran egalari uchun yaratilgan.
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {features.map((f) => (
                <Grid item xs={12} sm={6} md={4} key={f.title}>
                  <Card sx={{ height: '100%', borderRadius: 4, border: '1px solid', borderColor: 'divider', transition: 'transform .25s ease, box-shadow .25s ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 40px -12px rgba(15,23,42,0.15)' } }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ width: 54, height: 54, borderRadius: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: `linear-gradient(135deg, ${f.color}, ${f.color}cc)`, boxShadow: `0 8px 20px ${f.color}55`, '& svg': { fontSize: 28 } }}>
                        {f.icon}
                      </Box>
                      <Typography variant="h6" fontWeight={800} mb={1}>{f.title}</Typography>
                      <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{f.desc}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* CTA */}
        <Box sx={{ position: 'relative', overflow: 'hidden', py: { xs: 9, md: 14 }, textAlign: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #7C2D12 130%)' }}>
          <Box sx={{ position: 'absolute', top: -60, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.35), transparent 70%)', filter: 'blur(30px)' }} />
          <Container maxWidth="sm" sx={{ position: 'relative' }}>
            <Typography variant="h3" fontWeight={800} color="white" mb={2} sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}>
              Restoraningizni zamonaviylashtiring
            </Typography>
            <Typography variant="h6" color="grey.400" fontWeight={400} mb={4}>
              Bir necha daqiqada boshlang. Bank kartasi shart emas.
            </Typography>
            <Stack spacing={1} alignItems="center" mb={4}>
              {['Har bir stol uchun QR kod', 'Real vaqtdagi oshxona paneli va chek', '4 tilli mijoz menyusi'].map((item) => (
                <Stack key={item} direction="row" spacing={1} alignItems="center">
                  <CheckCircle sx={{ color: '#F97316', fontSize: 20 }} />
                  <Typography color="grey.200" variant="body1">{item}</Typography>
                </Stack>
              ))}
            </Stack>
            <Button component={NextLink} href="/register" variant="contained" size="large" endIcon={<ArrowForward />} sx={{ px: 5, py: 1.6, fontSize: '1.05rem', boxShadow: '0 14px 34px rgba(249,115,22,0.5)' }}>
              Restoraningizni yarating
            </Button>
          </Container>
        </Box>

        {/* Footer */}
        <Box sx={{ py: 4, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mb={1}>
            <Box sx={{ width: 24, height: 24, borderRadius: 1.5, background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode2 sx={{ color: 'white', fontSize: 15 }} />
            </Box>
            <Typography fontWeight={800}>Vivora</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Vivora. Aqlli restoran boshqaruvi.
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default Home;
