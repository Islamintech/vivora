import type { NextPage } from 'next';
import { useState } from 'react';
import { Box, Container, Typography, Button, Stack, Grid, TextField, Snackbar, Alert } from '@mui/material';
import { Email, Chat, Phone, Send } from '@mui/icons-material';
import MarketingLayout, {
  PRIMARY, ON_SURFACE, ON_VAR, SC_LOW, GRAD, pill,
} from '@/components/marketing/MarketingLayout';

const channels = [
  { icon: <Email />, tint: 'rgba(157,67,0,0.1)', c: PRIMARY, title: 'Email', value: 'salom@vivora.kr' },
  { icon: <Chat />, tint: '#DBEAFE', c: '#2563EB', title: 'Telegram', value: '@vivora_support' },
  { icon: <Phone />, tint: '#DCFCE7', c: '#15803D', title: 'Telefon', value: '+998 90 000 00 00' },
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
    // No backend endpoint yet — acknowledge locally.
    setSent(true);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <MarketingLayout title="Bog'lanish — Vivora">
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 9 } }}>
          <Box sx={{ display: 'inline-flex', px: 2, py: 0.75, bgcolor: 'rgba(241,220,201,0.5)', borderRadius: 99, mb: 3 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6f6051' }}>Bog&apos;lanish</Typography>
          </Box>
          <Typography sx={{ fontSize: 'clamp(2.1rem, 4.4vw, 3.4rem)', fontWeight: 800, letterSpacing: '-0.03em', mb: 2 }}>Biz bilan bog&apos;laning</Typography>
          <Typography sx={{ fontSize: 'clamp(1rem, 1.35vw, 1.2rem)', color: ON_VAR, maxWidth: 620, mx: 'auto' }}>
            Savolingiz bormi yoki demo ko&apos;rmoqchimisiz? Yozing — tez orada javob beramiz.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Channels */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              {channels.map((c) => (
                <Stack key={c.title} direction="row" spacing={2} alignItems="center" sx={{ bgcolor: '#fff', borderRadius: '1.25rem', p: 2.5, border: '1px solid rgba(140,113,100,0.08)' }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: c.tint, color: c.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: ON_VAR }}>{c.title}</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: ON_SURFACE }}>{c.value}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Grid>

          {/* Form */}
          <Grid item xs={12} md={7}>
            <Box component="form" onSubmit={submit} sx={{ bgcolor: '#fff', borderRadius: '1.75rem', p: { xs: 3, md: 4 }, border: '1px solid rgba(140,113,100,0.08)', boxShadow: '0 20px 50px rgba(157,67,0,0.06)' }}>
              <Stack spacing={2.5}>
                <TextField label="Ismingiz" required {...field('name')} fullWidth />
                <TextField label="Email" type="email" required {...field('email')} fullWidth />
                <TextField label="Xabaringiz" required multiline rows={4} {...field('message')} fullWidth />
                <Button type="submit" endIcon={<Send />} sx={pill({ py: 1.5, fontSize: 15, alignSelf: 'flex-start', background: GRAD, color: '#fff', boxShadow: '0 10px 22px rgba(157,67,0,0.3)' })}>
                  Yuborish
                </Button>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Snackbar open={sent} autoHideDuration={5000} onClose={() => setSent(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSent(false)} sx={{ borderRadius: 3 }}>
          Rahmat! Xabaringiz qabul qilindi — tez orada bog&apos;lanamiz. 🙌
        </Alert>
      </Snackbar>
    </MarketingLayout>
  );
};

export default Contact;
