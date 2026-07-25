import type { NextPage } from 'next';
import { useState } from 'react';
import { Box, Container, Typography, Button, Stack, Grid, TextField, Snackbar, Alert } from '@mui/material';
import { Email, Chat, Phone, Send, HelpOutline } from '@mui/icons-material';
import MarketingLayout, {
  PRIMARY, ON_SURFACE, ON_VAR, SC_LOW, GRAD, pill,
} from '@/components/marketing/MarketingLayout';

const channels = [
  { icon: <Email />, title: 'Email', value: 'vivora.support@gmail.com', href: 'mailto:vivora.support@gmail.com' },
  { icon: <Chat />, title: 'Telegram', value: '@vivora_support', href: 'https://t.me/vivora_support' },
  { icon: <Phone />, title: 'Telefon', value: '+82 10 7361 8117', href: 'tel:+821073618117' },
];

const quickAnswers = [
  { q: 'Demo kerakmi?', a: 'Yozing - sizga jonli demo ko‘rsatamiz yoki sinov hisobini ochib beramiz.' },
  { q: 'Narx haqida savol?', a: 'Bitta reja: Vivora orqali o‘tgan oylik savdodan 0.3%. Boshlash bepul.' },
  { q: 'Printer sozlash?', a: 'SAM4S/Sewoo printerlarni birga sozlab beramiz - o‘rnatish bo‘yicha yordam bepul.' },
];

const Contact: NextPage = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend endpoint yet - acknowledge locally.
    setSent(true);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <MarketingLayout title="Bog'lanish - Vivora">
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 9 } }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>
            Bog&apos;lanish
          </Typography>
          <Typography sx={{ fontSize: 'clamp(2.1rem, 4.4vw, 3.4rem)', fontWeight: 800, letterSpacing: '-0.03em', mb: 2 }}>
            Biz bilan{' '}
            <Box component="span" sx={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              bog&apos;laning
            </Box>
          </Typography>
          <Typography sx={{ fontSize: 'clamp(1rem, 1.35vw, 1.2rem)', color: ON_VAR, maxWidth: 620, mx: 'auto' }}>
            Savolingiz bormi yoki demo ko&apos;rmoqchimisiz? Yozing - tez orada javob beramiz.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Channels + quick answers */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              {channels.map((c) => (
                <Stack
                  key={c.title}
                  direction="row" spacing={2} alignItems="center"
                  {...(c.href ? { component: 'a', href: c.href, ...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } : {})}
                  sx={{ bgcolor: '#fff', borderRadius: '1.25rem', p: 2.5, border: '1px solid rgba(140,113,100,0.14)', textDecoration: 'none', cursor: c.href ? 'pointer' : 'default', transition: 'transform .25s, box-shadow .25s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px rgba(157,67,0,0.1)' } }}
                >
                  <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(157,67,0,0.18)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: ON_VAR }}>{c.title}</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: ON_SURFACE }}>{c.value}</Typography>
                  </Box>
                </Stack>
              ))}

              <Box sx={{ bgcolor: SC_LOW, borderRadius: '1.25rem', p: 2.5, border: '1px solid rgba(140,113,100,0.14)' }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                  <HelpOutline sx={{ fontSize: 18, color: PRIMARY }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tezkor javoblar</Typography>
                </Stack>
                <Stack spacing={1.75}>
                  {quickAnswers.map((qa) => (
                    <Box key={qa.q}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: ON_SURFACE }}>{qa.q}</Typography>
                      <Typography sx={{ fontSize: 13, color: ON_VAR, lineHeight: 1.6 }}>{qa.a}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Grid>

          {/* Form */}
          <Grid item xs={12} md={7}>
            <Box component="form" onSubmit={submit} sx={{ bgcolor: '#fff', borderRadius: '1.75rem', p: { xs: 3, md: 4 }, border: '1px solid rgba(140,113,100,0.14)', boxShadow: '0 20px 50px rgba(157,67,0,0.08)' }}>
              <Stack spacing={2.5}>
                <TextField label="Ismingiz" required {...field('name')} fullWidth />
                <TextField label="Email" type="email" required {...field('email')} fullWidth />
                <TextField label="Xabaringiz" required multiline rows={4} {...field('message')} fullWidth />
                <Button type="submit" endIcon={<Send />} sx={pill({ py: 1.5, fontSize: 15, alignSelf: 'flex-start', background: GRAD, color: '#fff', boxShadow: '0 10px 22px rgba(157,67,0,0.3)', '&:hover': { boxShadow: '0 14px 30px rgba(157,67,0,0.4)', transform: 'translateY(-2px)' } })}>
                  Yuborish
                </Button>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Snackbar open={sent} autoHideDuration={5000} onClose={() => setSent(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSent(false)} sx={{ borderRadius: 3 }}>
          Rahmat! Xabaringiz qabul qilindi - tez orada bog&apos;lanamiz. 🙌
        </Alert>
      </Snackbar>
    </MarketingLayout>
  );
};

export default Contact;
