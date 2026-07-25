import type { NextPage } from 'next';
import NextLink from 'next/link';
import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import { Bolt, Favorite, Insights, Public, ArrowForward } from '@mui/icons-material';
import MarketingLayout, {
  PRIMARY, ON_SURFACE, ON_VAR, SURFACE, SC_LOW, GRAD, pill,
} from '@/components/marketing/MarketingLayout';

const values = [
  { icon: <Bolt />, title: 'Soddalik', desc: 'Murakkab tizimlar emas — restoran egasi bir necha daqiqada ishga tushira oladigan vositalar.' },
  { icon: <Favorite />, title: 'Mijoz tajribasi', desc: 'Mehmon kutmasdan, o‘z tilida, qulay tarzda buyurtma beradi. Har bir tafsilot shu maqsadga xizmat qiladi.' },
  { icon: <Insights />, title: 'Ma’lumotga asoslangan', desc: 'Real vaqtdagi tahlil bilan egalar to‘g‘ri qarorlar qabul qiladi va daromadni oshiradi.' },
  { icon: <Public />, title: 'Hamma uchun', desc: '4 tilli menyu bilan har qanday mijozga — mahalliy yoki chet ellik — bir xil qulaylik.' },
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
      <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>
        Biz haqimizda
      </Typography>
      <Typography sx={{ fontSize: 'clamp(2.1rem, 4.6vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.06, mb: 3, maxWidth: 820, mx: 'auto' }}>
        Restoranlarni{' '}
        <Box component="span" sx={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          raqamli asrga
        </Box>
        {' '}olib chiqamiz
      </Typography>
      <Typography sx={{ fontSize: 'clamp(1.05rem, 1.4vw, 1.3rem)', color: ON_VAR, maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}>
        Vivora — restoran egalari uchun yaratilgan zamonaviy boshqaruv tizimi. Biz oshxonadan
        stolgacha bo‘lgan har bir bosqichni soddalashtiramiz, toki siz eng muhim narsaga — mazali
        taom va yaxshi xizmatga — e‘tibor bera olasiz.
      </Typography>
    </Container>

    {/* Metrics band — dark card with gradient numbers, like the pricing card */}
    <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
      <Box sx={{ borderRadius: '2rem', background: `linear-gradient(160deg, #2a1206, ${ON_SURFACE})`, p: { xs: 3, md: 5 }, boxShadow: '0 30px 60px rgba(157,67,0,0.25)' }}>
        <Grid container spacing={2}>
          {metrics.map((m) => (
            <Grid item xs={6} md={3} key={m.l} sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(90deg, #FDBA74, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{m.n}</Typography>
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
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>
            Missiya
          </Typography>
          <Typography sx={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 2 }}>Nima uchun Vivora?</Typography>
          <Typography sx={{ fontSize: 17, color: ON_VAR, lineHeight: 1.75, mb: 2 }}>
            Ko‘pchilik restoranlar 2–3 xodim bilan ishlaydi — buyurtma qabul qilish, oshxona,
            hisob-kitob. Bu vaqtida xato va kutishlarni keltirib chiqaradi.
          </Typography>
          <Typography sx={{ fontSize: 17, color: ON_VAR, lineHeight: 1.75, mb: 3 }}>
            Vivora buyurtmani mijoz telefoniga, oshxona ekraniga va chekka avtomatik ulaydi.
            Xodimlar band bo‘lsa ham, tizim o‘zi harakatlanadi — hech narsa unutilmaydi.
          </Typography>
          <Stack spacing={1.25}>
            {['Mijoz o‘zi buyurtma beradi — xodim kutish shart emas', 'Holatlar avtomatik almashadi, ekran bosish minimal', 'To‘lov faqat savdodan: 0.3%, yashirin to‘lovlarsiz'].map((b) => (
              <Stack key={b} direction="row" spacing={1.25} alignItems="center">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: GRAD, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 14.5, color: ON_SURFACE, fontWeight: 500 }}>{b}</Typography>
              </Stack>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Container>

    {/* Values */}
    <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: SC_LOW }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 9 } }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>
            Qadriyatlar
          </Typography>
          <Typography sx={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.7rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 1.5 }}>Biz nimaga ishonamiz</Typography>
          <Typography sx={{ fontSize: 17, color: ON_VAR }}>Har bir qaror shu qadriyatlardan kelib chiqadi.</Typography>
        </Box>
        <Grid container spacing={3}>
          {values.map((v) => (
            <Grid item xs={12} sm={6} md={3} key={v.title}>
              <Box sx={{ height: '100%', bgcolor: '#fff', borderRadius: '1.5rem', p: 3, border: '1px solid rgba(140,113,100,0.14)', transition: 'transform .25s, box-shadow .25s, border-color .25s', '&:hover': { transform: 'translateY(-5px)', borderColor: 'rgba(157,67,0,0.3)', boxShadow: '0 16px 36px rgba(157,67,0,0.1)' } }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(157,67,0,0.18)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, '& svg': { fontSize: 24 } }}>{v.icon}</Box>
                <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 0.75 }}>{v.title}</Typography>
                <Typography sx={{ fontSize: 14, color: ON_VAR, lineHeight: 1.65 }}>{v.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>

    {/* CTA — same band as the landing page */}
    <Container maxWidth="lg" sx={{ py: { xs: 10, md: 14 } }}>
      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 5, p: { xs: 4, md: 8 }, textAlign: 'center', background: 'linear-gradient(135deg, #B45309, #EA580C 55%, #F97316)' }}>
        <Box sx={{ position: 'absolute', top: '-40%', left: '-10%', width: '55%', height: '160%', border: '50px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <Box sx={{ position: 'absolute', bottom: '-50%', right: '-8%', width: '48%', height: '150%', border: '34px solid rgba(255,255,255,0.07)', borderRadius: '50%' }} />
        <Typography sx={{ position: 'relative', fontSize: 'clamp(1.7rem, 3.6vw, 2.7rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', mb: 2 }}>
          Biz bilan boshlashga tayyormisiz?
        </Typography>
        <Typography sx={{ position: 'relative', fontSize: 16.5, color: 'rgba(255,255,255,0.9)', mb: 4 }}>
          Bir necha daqiqada bepul boshlang. Bank kartasi shart emas.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ position: 'relative' }}>
          <Button component={NextLink} href="/register" endIcon={<ArrowForward />} sx={pill({ bgcolor: '#fff', color: '#B45309', boxShadow: '0 14px 30px rgba(0,0,0,0.25)', '&:hover': { bgcolor: SURFACE } })}>
            Bepul boshlash
          </Button>
          <Button component={NextLink} href="/contact" sx={pill({ color: '#fff', border: '2px solid rgba(255,255,255,0.35)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' } })}>
            Mutaxassis bilan gaplashish
          </Button>
        </Stack>
      </Box>
    </Container>
  </MarketingLayout>
);

export default About;
