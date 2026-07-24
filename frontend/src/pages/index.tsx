import type { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import {
  Box, Container, Typography, Button, Grid, Card,
  CardContent, Stack, Chip, Avatar,
} from '@mui/material';
import {
  QrCode2, Kitchen, Analytics, TableRestaurant,
  Translate, RocketLaunch, CheckCircle,
} from '@mui/icons-material';

const features = [
  { icon: <QrCode2 sx={{ fontSize: 36 }} />, title: 'QR orqali buyurtma', desc: 'Har bir stol uchun alohida QR kod. Mijozlar skanerlab, menyuni ko‘radi, buyurtma beradi — ilova kerak emas.' },
  { icon: <Kitchen sx={{ fontSize: 36 }} />, title: 'Jonli oshxona ekrani', desc: 'Buyurtmalar oshxona ekranida bir zumda paydo bo‘ladi. Xodimlar holatni real vaqtda yangilaydi.' },
  { icon: <Analytics sx={{ fontSize: 36 }} />, title: 'Real vaqtdagi tahlil', desc: 'Daromad, stollar bandligi, mashhur taomlar va buyurtmalar tarixini jonli kuzating.' },
  { icon: <TableRestaurant sx={{ fontSize: 36 }} />, title: 'Stollarni boshqarish', desc: 'Stollarni boshqaring, QR kodlar yarating va faoliyatni yagona panel orqali nazorat qiling.' },
  { icon: <Translate sx={{ fontSize: 36 }} />, title: 'Ko‘p tilli menyu', desc: 'Mijozlar menyusi o‘zbek, ingliz, rus va koreys tillarida avtomatik ko‘rsatiladi.' },
  { icon: <RocketLaunch sx={{ fontSize: 36 }} />, title: 'Super-admin paneli', desc: 'Platforma bo‘ylab nazorat — barcha restoranlar, buyurtmalar, xatolar va hisoblar.' },
];

const Home: NextPage = () => {
  return (
    <>
      <Head><title>Vivora — Aqlli restoran boshqaruvi</title></Head>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

        {/* Navbar */}
        <Box
          component="nav"
          sx={{
            position: 'sticky', top: 0, zIndex: 100,
            bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid', borderColor: 'divider',
            py: 1.5,
          }}
        >
          <Container maxWidth="lg">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                Vivora
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <Button component={NextLink} href="/login" variant="outlined" color="secondary" size="small">
                  Kirish
                </Button>
                <Button component={NextLink} href="/register" variant="contained" size="small">
                  Bepul boshlash
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* Hero */}
        <Box
          sx={{
            pt: { xs: 10, md: 16 }, pb: { xs: 8, md: 12 },
            background: 'linear-gradient(160deg, #FFF7ED 0%, #F8FAFC 60%, #EFF6FF 100%)',
          }}
        >
          <Container maxWidth="lg">
            <Box textAlign="center" maxWidth={780} mx="auto">
              <Chip
                label="🍽️ Zamonaviy restoranlar uchun"
                color="primary"
                variant="outlined"
                sx={{ mb: 3, fontWeight: 600 }}
              />
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: '2.5rem', md: '4rem' }, mb: 3, lineHeight: 1.1 }}
              >
                Restoran ishini boshqarishning{' '}
                <Box
                  component="span"
                  sx={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  yagona platformasi
                </Box>
              </Typography>
              <Typography variant="h6" color="text.secondary" fontWeight={400} mb={5} lineHeight={1.7}>
                QR menyular, jonli oshxona buyurtmalari, real vaqtdagi tahlil — restoraningizga
                kerak bo‘lgan hamma narsa bir joyda. Stoldan oshxonagacha, oshxonadan hisobotgacha bir necha soniyada.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  component={NextLink}
                  href="/register"
                  variant="contained"
                  size="large"
                  sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                >
                  Bepul boshlash
                </Button>
                <Button
                  component={NextLink}
                  href="/login"
                  variant="outlined"
                  color="secondary"
                  size="large"
                  sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                >
                  Kirish
                </Button>
              </Stack>
            </Box>

            {/* Stats bar */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={4}
              justifyContent="center"
              mt={10}
            >
              {[['QR buyurtma', 'Ilova kerak emas'], ['Real vaqt', 'Oshxona ekrani'], ['4 til', 'UZ · EN · RU · KO']].map(([label, sub]) => (
                <Box key={label} textAlign="center">
                  <Typography variant="h5" fontWeight={800} color="primary">{label}</Typography>
                  <Typography variant="body2" color="text.secondary">{sub}</Typography>
                </Box>
              ))}
            </Stack>
          </Container>
        </Box>

        {/* Features */}
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Box textAlign="center" mb={8}>
            <Typography variant="h3" fontWeight={800} mb={2}>
              Hammasi bitta panelda
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={400}>
              Dasturchilar uchun emas, restoran egalari uchun yaratilgan qulay vositalar.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <Card sx={{ height: '100%', p: 1, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <CardContent>
                    <Avatar
                      sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 60, height: 60, mb: 2 }}
                    >
                      {f.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} mb={1}>{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{f.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* CTA */}
        <Box sx={{ bgcolor: 'secondary.main', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
          <Container maxWidth="sm">
            <Typography variant="h3" fontWeight={800} color="white" mb={2}>
              Restoraningizni zamonaviylashtirishga tayyormisiz?
            </Typography>
            <Typography variant="h6" color="grey.400" fontWeight={400} mb={4}>
              Bir necha daqiqada boshlang. Bank kartasi shart emas.
            </Typography>
            {['Har bir stol uchun QR kod', 'Real vaqtdagi oshxona paneli', '4 tilli mijoz menyusi'].map((item) => (
              <Stack key={item} direction="row" spacing={1} justifyContent="center" mb={1}>
                <CheckCircle sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography color="grey.200" variant="body1">{item}</Typography>
              </Stack>
            ))}
            <Button
              component={NextLink}
              href="/register"
              variant="contained"
              size="large"
              sx={{ mt: 4, px: 5, py: 1.5, fontSize: '1rem' }}
            >
              Restoraningizni yarating
            </Button>
          </Container>
        </Box>

        {/* Footer */}
        <Box sx={{ py: 4, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Vivora. Built with NestJS · GraphQL · Next.js · MongoDB
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default Home;
