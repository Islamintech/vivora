import type { NextPage } from 'next';
import NextLink from 'next/link';
import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import { Bolt, Favorite, Insights, Public, ArrowForward } from '@mui/icons-material';
import MarketingLayout, {
  PRIMARY, ORANGE, ON_SURFACE, ON_VAR, SURFACE, SC_LOW, PEACH, pill,
} from '@/components/marketing/MarketingLayout';

const values = [
  { icon: <Bolt />, tint: 'rgba(157,67,0,0.1)', c: PRIMARY, title: 'Soddalik', desc: 'Murakkab tizimlar emas — restoran egasi bir necha daqiqada ishga tushira oladigan vositalar.' },
  { icon: <Favorite />, tint: PEACH, c: '#B91C1C', title: 'Mijoz tajribasi', desc: 'Mehmon kutmasdan, o‘z tilida, qulay tarzda buyurtma beradi. Har bir tafsilot shu maqsadga xizmat qiladi.' },
  { icon: <Insights />, tint: '#DCFCE7', c: '#15803D', title: 'Ma’lumotga asoslangan', desc: 'Real vaqtdagi tahlil bilan egalar to‘g‘ri qarorlar qabul qiladi va daromadni oshiradi.' },
  { icon: <Public />, tint: '#DBEAFE', c: '#2563EB', title: 'Hamma uchun', desc: '4 tilli menyu bilan har qanday mijozga — mahalliy yoki chet ellik — bir xil qulaylik.' },
];

const metrics = [
  { n: '40%', l: 'Tezroq xizmat' },
  { n: '4', l: 'til qo‘llab-quvvatlanadi' },
  { n: '~0', l: 'Buyurtma xatosi' },
  { n: '24/7', l: 'Jonli tizim' },
];

const About: NextPage = () => (
  <MarketingLayout title="Biz haqimizda — Vivora">
    {/* Hero */}
    <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 8 }, textAlign: 'center' }}>
      <Box sx={{ display: 'inline-flex', px: 2, py: 0.75, bgcolor: 'rgba(241,220,201,0.5)', borderRadius: 99, mb: 3 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6f6051' }}>Biz haqimizda</Typography>
      </Box>
      <Typography sx={{ fontSize: 'clamp(2.1rem, 4.6vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.06, mb: 3, maxWidth: 820, mx: 'auto' }}>
        Restoranlarni <Box component="span" sx={{ color: PRIMARY }}>raqamli asrga</Box> olib chiqamiz
      </Typography>
      <Typography sx={{ fontSize: 'clamp(1.05rem, 1.4vw, 1.3rem)', color: ON_VAR, maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}>
        Vivora — restoran egalari uchun yaratilgan zamonaviy boshqaruv tizimi. Biz oshxonadan
        stolgacha bo‘lgan har bir bosqichni soddalashtiramiz, toki siz eng muhim narsaga — mazali
        taom va yaxshi xizmatga — e‘tibor bera olasiz.
      </Typography>
    </Container>

    {/* Metrics band */}
    <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
      <Box sx={{ borderRadius: '2rem', background: `linear-gradient(160deg, #2a1206, ${ON_SURFACE})`, p: { xs: 3, md: 5 } }}>
        <Grid container spacing={2}>
          {metrics.map((m) => (
            <Grid item xs={6} md={3} key={m.l} sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{m.n}</Typography>
              <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', mt: 0.5 }}>{m.l}</Typography>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>

    {/* Mission split */}
    <Container maxWidth="lg" sx={{ pb: { xs: 10, md: 14 } }}>
      <Grid container spacing={6} alignItems="center">
        <Grid item xs={12} md={6}>
          <Box sx={{ borderRadius: '2rem', overflow: 'hidden', boxShadow: '0 30px 60px rgba(157,67,0,0.15)' }}>
            <Box component="img" src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80&auto=format&fit=crop" alt="Restaurant" sx={{ width: '100%', height: { xs: 260, md: 380 }, objectFit: 'cover', display: 'block' }} />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography sx={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 2 }}>Nima uchun Vivora?</Typography>
          <Typography sx={{ fontSize: 17, color: ON_VAR, lineHeight: 1.75, mb: 2 }}>
            Ko‘pchilik restoranlar 2–3 xodim bilan ishlaydi — buyurtma qabul qilish, oshxona,
            hisob-kitob. Bu vaqtida xato va kutishlarni keltirib chiqaradi.
          </Typography>
          <Typography sx={{ fontSize: 17, color: ON_VAR, lineHeight: 1.75 }}>
            Vivora buyurtmani mijoz telefoniga, oshxona ekraniga va chekka avtomatik ulaydi.
            Xodimlar band bo‘lsa ham, tizim o‘zi harakatlanadi — hech narsa unutilmaydi.
          </Typography>
        </Grid>
      </Grid>
    </Container>

    {/* Values */}
    <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: SC_LOW }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 9 } }}>
          <Typography sx={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.7rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 1.5 }}>Biz nimaga ishonamiz</Typography>
          <Typography sx={{ fontSize: 17, color: ON_VAR }}>Har bir qaror shu qadriyatlardan kelib chiqadi.</Typography>
        </Box>
        <Grid container spacing={3}>
          {values.map((v) => (
            <Grid item xs={12} sm={6} md={3} key={v.title}>
              <Box sx={{ height: '100%', bgcolor: '#fff', borderRadius: '1.5rem', p: 3, border: '1px solid rgba(140,113,100,0.06)', transition: 'transform .25s', '&:hover': { transform: 'translateY(-6px)' } }}>
                <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: v.tint, color: v.c, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, '& svg': { fontSize: 26 } }}>{v.icon}</Box>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 0.75 }}>{v.title}</Typography>
                <Typography sx={{ fontSize: 14, color: ON_VAR, lineHeight: 1.65 }}>{v.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>

    {/* CTA */}
    <Container maxWidth="lg" sx={{ py: { xs: 10, md: 14 } }}>
      <Box sx={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${ORANGE}, ${PRIMARY})`, borderRadius: '3rem', px: { xs: 4, md: 10 }, py: { xs: 7, md: 10 }, textAlign: 'center', color: '#fff', boxShadow: '0 40px 80px rgba(157,67,0,0.3)' }}>
        <Box sx={{ position: 'absolute', top: '-30%', right: '-8%', width: '50%', height: '160%', border: '50px solid rgba(255,255,255,0.12)', borderRadius: '50%' }} />
        <Typography sx={{ position: 'relative', fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 2 }}>Biz bilan boshlashga tayyormisiz?</Typography>
        <Typography sx={{ position: 'relative', fontSize: 18, opacity: 0.9, mb: 4 }}>Bir necha daqiqada bepul boshlang.</Typography>
        <Button component={NextLink} href="/register" endIcon={<ArrowForward />} sx={pill({ position: 'relative', py: 1.75, px: 4, fontSize: 15, bgcolor: '#fff', color: PRIMARY, boxShadow: '0 14px 30px rgba(0,0,0,0.2)', '&:hover': { bgcolor: SURFACE } })}>Bepul boshlash</Button>
      </Box>
    </Container>
  </MarketingLayout>
);

export default About;
