import type { NextPage } from 'next';
import NextLink from 'next/link';
import { Box, Container, Typography, Button, Stack, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { CheckCircle, ArrowForward, ExpandMore } from '@mui/icons-material';
import MarketingLayout, {
  PRIMARY, ORANGE, ON_SURFACE, ON_VAR, SURFACE, SC_LOW, GRAD, pill,
} from '@/components/marketing/MarketingLayout';

const tiers = [
  {
    name: 'Boshlang‘ich',
    price: 'Bepul',
    per: '',
    desc: 'Kichik kafe va yangi restoranlar uchun.',
    features: ['1 ta restoran', 'Cheksiz QR menyu', 'Jonli oshxona ekrani', 'Asosiy tahlil', 'Mijozlar fikri'],
    cta: 'Bepul boshlash',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '299 000',
    per: "so‘m / oy",
    desc: 'O‘sib borayotgan restoranlar uchun.',
    features: ["Boshlang‘ich'dagi hammasi", 'Avtomatik chek chop etish', 'Ko‘p tilli menyu (4 til)', 'Kengaytirilgan tahlil', 'Telegram xabarlari', 'Prep-miqdor nazorati'],
    cta: 'Pro’ni tanlash',
    highlight: true,
  },
  {
    name: 'Biznes',
    price: '799 000',
    per: "so‘m / oy",
    desc: 'Bir nechta filialli tarmoqlar uchun.',
    features: ["Pro’dagi hammasi", 'Bir nechta filial', 'Ustuvor 24/7 yordam', 'Maxsus brending', 'API kirish', 'Alohida menejer'],
    cta: 'Bog‘lanish',
    highlight: false,
  },
];

const faqs = [
  { q: 'Bepul rejada nima cheklangan?', a: "Boshlang‘ich reja bitta restoran uchun to‘liq QR menyu va oshxona ekranini beradi. Avtomatik chek, ko‘p tillilik va kengaytirilgan tahlil Pro rejada ochiladi." },
  { q: 'Rejani keyin o‘zgartira olamanmi?', a: "Ha. Istalgan vaqtda yuqori yoki past rejaga o‘tishingiz mumkin — o‘zgarish darhol kuchga kiradi." },
  { q: 'Shartnoma yoki majburiyat bormi?', a: "Yo‘q. Oylik to‘lov, istalgan vaqtda bekor qilish mumkin. Bepul rejada bank kartasi ham shart emas." },
  { q: 'Chek printeri narxga kiradimi?', a: "Dastur printerni qo‘llab-quvvatlaydi, lekin printer qurilmasi alohida. Mavjud SAM4S/Sewoo printerlar bilan ishlaydi." },
];

const Pricing: NextPage = () => (
  <MarketingLayout title="Narxlar — Vivora">
    {/* Hero */}
    <Container maxWidth="xl" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 4, md: 6 }, textAlign: 'center' }}>
      <Box sx={{ display: 'inline-flex', px: 2, py: 0.75, bgcolor: 'rgba(241,220,201,0.5)', borderRadius: 99, mb: 3 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6f6051' }}>Oddiy va shaffof narxlar</Typography>
      </Box>
      <Typography sx={{ fontSize: 'clamp(2.1rem, 4.4vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.03em', mb: 2 }}>
        Restoraningizga mos rejani tanlang
      </Typography>
      <Typography sx={{ fontSize: 'clamp(1rem, 1.35vw, 1.2rem)', color: ON_VAR, maxWidth: 640, mx: 'auto' }}>
        Bepul boshlang, keyin kerak bo&apos;lganda kengaytiring. Yashirin to&apos;lovlarsiz.
      </Typography>
    </Container>

    {/* Tiers */}
    <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
      <Grid container spacing={3} alignItems="stretch">
        {tiers.map((t) => (
          <Grid item xs={12} md={4} key={t.name}>
            <Box
              sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                borderRadius: '2rem', p: { xs: 3, md: 4 },
                ...(t.highlight
                  ? { background: `linear-gradient(160deg, #2a1206, ${ON_SURFACE})`, color: '#fff', boxShadow: '0 30px 60px rgba(157,67,0,0.25)', transform: { md: 'scale(1.04)' } }
                  : { bgcolor: '#fff', border: '1px solid rgba(140,113,100,0.1)', boxShadow: '0 10px 30px rgba(157,67,0,0.06)' }),
              }}
            >
              {t.highlight && (
                <Box sx={{ alignSelf: 'flex-start', px: 1.5, py: 0.5, borderRadius: 99, background: GRAD, fontSize: 11, fontWeight: 800, mb: 2 }}>ENG OMMABOP</Box>
              )}
              <Typography sx={{ fontSize: 20, fontWeight: 800, mb: 0.5 }}>{t.name}</Typography>
              <Typography sx={{ fontSize: 13, color: t.highlight ? 'rgba(255,255,255,0.7)' : ON_VAR, mb: 2.5 }}>{t.desc}</Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.75} mb={3}>
                <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{t.price}</Typography>
                {t.per && <Typography sx={{ fontSize: 13, color: t.highlight ? 'rgba(255,255,255,0.7)' : ON_VAR }}>{t.per}</Typography>}
              </Stack>
              <Button
                component={NextLink}
                href={t.name === 'Biznes' ? '/contact' : '/register'}
                fullWidth
                endIcon={<ArrowForward />}
                sx={pill({
                  mb: 3, py: 1.4, fontSize: 15,
                  ...(t.highlight
                    ? { bgcolor: '#fff', color: PRIMARY, '&:hover': { bgcolor: SURFACE } }
                    : { background: GRAD, color: '#fff', boxShadow: '0 10px 22px rgba(157,67,0,0.3)' }),
                })}
              >
                {t.cta}
              </Button>
              <Stack spacing={1.25}>
                {t.features.map((f) => (
                  <Stack key={f} direction="row" alignItems="center" spacing={1}>
                    <CheckCircle sx={{ fontSize: 18, color: t.highlight ? '#4ADE80' : '#16A34A' }} />
                    <Typography sx={{ fontSize: 14, color: t.highlight ? 'rgba(255,255,255,0.9)' : ON_SURFACE }}>{f}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>

    {/* FAQ */}
    <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: SC_LOW }}>
      <Container maxWidth="md">
        <Typography sx={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          Narx bo&apos;yicha savollar
        </Typography>
        <Stack spacing={1.5}>
          {faqs.map((f) => (
            <Accordion key={f.q} disableGutters elevation={0} sx={{ bgcolor: '#fff', borderRadius: '1.25rem !important', border: '1px solid rgba(140,113,100,0.08)', '&:before': { display: 'none' }, overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: PRIMARY }} />} sx={{ px: 3, py: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{f.q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 2.5, pt: 0 }}>
                <Typography sx={{ fontSize: 15, color: ON_VAR, lineHeight: 1.7 }}>{f.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>
    </Box>
  </MarketingLayout>
);

export default Pricing;
