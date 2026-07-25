import type { NextPage } from 'next';
import NextLink from 'next/link';
import { Box, Container, Typography, Button, Stack, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { CheckCircle, ArrowForward, ExpandMore, ReceiptLong, AccountBalance, TaskAlt } from '@mui/icons-material';
import MarketingLayout, {
  PRIMARY, ON_VAR, SURFACE, SC_LOW, GRAD, pill,
} from '@/components/marketing/MarketingLayout';

// Everything is included - the platform simply takes 0.3% of the order
// revenue that goes through Vivora, billed monthly by bank transfer.
const included = [
  'Cheksiz QR menyu va stollar',
  'Jonli oshxona ekrani',
  'Avtomatik chek chop etish (SAM4S, Sewoo…)',
  'Ko‘p tilli menyu (UZ · EN · RU · KO)',
  'Kunlik / haftalik / oylik daromad tahlili',
  'Telegram xabarlari',
  'Taom miqdori nazorati («tugadi» avtomatik)',
  'Mijozlar fikri',
];

const billingSteps = [
  { icon: <ReceiptLong />, title: 'Oy yakunlanadi', desc: 'Har oy boshida o‘tgan oydagi Vivora orqali o‘tgan savdoingizdan 0.3% hisoblanib, hisob-faktura shakllanadi.' },
  { icon: <AccountBalance />, title: 'Bank o‘tkazmasi', desc: 'Boshqaruv panelidagi «To‘lov» sahifasida summa va bank rekvizitlari ko‘rinadi - oddiy o‘tkazma qilasiz.' },
  { icon: <TaskAlt />, title: 'Tasdiqlanadi', desc: '«To‘ladim» tugmasini bosasiz, biz to‘lovni tekshirib tasdiqlaymiz. Bo‘ldi - keyingi oygacha hech narsa kerak emas.' },
];

const faqs = [
  { q: 'Nega foiz? Oylik fiksirlangan narx emasmi?', a: "Bu adolatliroq: savdo bo‘lmagan oyda hech narsa to‘lamaysiz. Tizim sizga qancha foyda keltirsa, to‘lov ham shunga mutanosib bo‘ladi - atigi 0.3%." },
  { q: '0.3% nimadan hisoblanadi?', a: "Faqat Vivora orqali qabul qilingan buyurtmalar summasidan. Masalan, oylik savdo ₩10 000 000 bo‘lsa, to‘lov ₩30 000 bo‘ladi. Bekor qilingan buyurtmalar hisobga kirmaydi." },
  { q: 'Qanday to‘layman?', a: "Har oy boshida boshqaruv panelidagi «To‘lov» sahifasida hisob-faktura paydo bo‘ladi: summa, davr va bizning bank kartamiz. Oddiy bank o‘tkazmasi qilasiz va «To‘ladim» tugmasini bosasiz." },
  { q: 'Shartnoma yoki majburiyat bormi?', a: "Yo‘q. Ro‘yxatdan o‘tish bepul, bank kartasi shart emas, istalgan vaqtda to‘xtatishingiz mumkin." },
  { q: 'Chek printeri narxga kiradimi?', a: "Dastur printerni qo‘llab-quvvatlaydi, lekin printer qurilmasi alohida. Mavjud SAM4S/Sewoo printerlar bilan ishlaydi." },
];

const Pricing: NextPage = () => (
  <MarketingLayout title="Narxlar - Vivora">
    {/* Hero */}
    <Container maxWidth="xl" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 4, md: 6 }, textAlign: 'center' }}>
      <Box sx={{ display: 'inline-flex', px: 2, py: 0.75, bgcolor: 'rgba(241,220,201,0.5)', borderRadius: 99, mb: 3 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6f6051' }}>Oddiy va shaffof narxlar</Typography>
      </Box>
      <Typography sx={{ fontSize: 'clamp(2.1rem, 4.4vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.03em', mb: 2 }}>
        Bitta narx. Hammasi ichida.
      </Typography>
      <Typography sx={{ fontSize: 'clamp(1rem, 1.35vw, 1.2rem)', color: ON_VAR, maxWidth: 640, mx: 'auto' }}>
        Reja tanlash shart emas - barcha imkoniyatlar har bir restoranga ochiq.
        Faqat Vivora orqali o&apos;tgan savdodan kichik foiz to&apos;laysiz.
      </Typography>
    </Container>

    {/* The one real plan: 0.3% of monthly Vivora sales */}
    <Container maxWidth="md" sx={{ pb: { xs: 6, md: 8 } }}>
      <Box
        sx={{
          position: 'relative', overflow: 'hidden',
          borderRadius: '2rem', p: { xs: 3, md: 5 },
          background: 'linear-gradient(135deg, #B45309, #EA580C 55%, #F97316)', color: '#fff',
          boxShadow: '0 30px 60px rgba(157,67,0,0.25)',
        }}
      >
        {/* Ring decorations, same as the CTA band */}
        <Box sx={{ position: 'absolute', top: '-40%', left: '-10%', width: '55%', height: '160%', border: '50px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <Box sx={{ position: 'absolute', bottom: '-50%', right: '-8%', width: '48%', height: '150%', border: '34px solid rgba(255,255,255,0.07)', borderRadius: '50%' }} />
        <Grid container spacing={{ xs: 3, md: 5 }} alignItems="center" sx={{ position: 'relative' }}>
          <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: 99, bgcolor: '#fff', color: '#B45309', fontSize: 11, fontWeight: 800, mb: 2 }}>YAGONA REJA</Box>
            <Stack direction="row" alignItems="baseline" spacing={1} justifyContent={{ xs: 'center', md: 'flex-start' }}>
              <Typography sx={{ fontSize: 'clamp(3.4rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1, color: '#fff', textShadow: '0 6px 24px rgba(0,0,0,0.18)' }}>0.3%</Typography>
            </Stack>
            <Typography sx={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', mt: 1, mb: 0.5 }}>oylik savdodan</Typography>
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', mb: 3 }}>
              Boshlash bepul · Bank kartasi shart emas
            </Typography>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', mb: 3 }}>
              <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', mb: 0.25 }}>Masalan</Typography>
              <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>
                Oylik savdo ₩10 000 000 → to&apos;lov <Box component="span" sx={{ fontWeight: 900 }}>₩30 000</Box>
              </Typography>
            </Box>
            <Button
              component={NextLink}
              href="/register"
              fullWidth
              endIcon={<ArrowForward />}
              sx={pill({ py: 1.4, fontSize: 15, bgcolor: '#fff', color: '#B45309', boxShadow: '0 14px 30px rgba(0,0,0,0.2)', '&:hover': { bgcolor: SURFACE } })}
            >
              Bepul boshlash
            </Button>
          </Grid>
          <Grid item xs={12} md={7}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.75 }}>
              Hammasi ichida
            </Typography>
            <Stack spacing={1.25}>
              {included.map((f) => (
                <Stack key={f} direction="row" alignItems="center" spacing={1}>
                  <CheckCircle sx={{ fontSize: 18, color: '#fff' }} />
                  <Typography sx={{ fontSize: 14.5, color: 'rgba(255,255,255,0.95)' }}>{f}</Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Container>

    {/* How billing works */}
    <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
      <Typography sx={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center', mb: { xs: 4, md: 5 } }}>
        To&apos;lov qanday ishlaydi?
      </Typography>
      <Grid container spacing={3}>
        {billingSteps.map((s, i) => (
          <Grid item xs={12} md={4} key={s.title}>
            <Box sx={{ position: 'relative', height: '100%', p: 3.5, borderRadius: '1.5rem', bgcolor: '#fff', border: '1px solid rgba(140,113,100,0.1)', boxShadow: '0 10px 30px rgba(157,67,0,0.06)' }}>
              <Typography sx={{ position: 'absolute', top: 14, right: 20, fontSize: 46, fontWeight: 800, color: 'rgba(157,67,0,0.07)', lineHeight: 1 }}>{i + 1}</Typography>
              <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(157,67,0,0.2)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                {s.icon}
              </Box>
              <Typography sx={{ fontSize: 17, fontWeight: 800, mb: 1 }}>{s.title}</Typography>
              <Typography sx={{ fontSize: 14, color: ON_VAR, lineHeight: 1.65 }}>{s.desc}</Typography>
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
