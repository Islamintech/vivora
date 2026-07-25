import type { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Stack, Alert, InputAdornment, IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { REGISTER_MUTATION } from '@/graphql/operations';
import { useAuthStore } from '@/store/auth.store';
import { useRedirectIfAuthed } from '@/hooks/useAuth';

const RegisterPage: NextPage = () => {
  useRedirectIfAuthed();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    name: '', email: '', password: '', restaurantName: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const [register, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted(data) {
      setAuth(data.register.user, data.register.token);
      toast.success('Restoran yaratildi! Xush kelibsiz 🎉');
      router.push('/dashboard');
    },
    onError(err) {
      setError(err.message);
    },
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.restaurantName) {
      setError('Iltimos, barcha maydonlarni to‘ldiring');
      return;
    }
    if (form.password.length < 8) {
      setError('Parol kamida 8 ta belgidan iborat bo‘lishi kerak');
      return;
    }
    register({ variables: { input: form } });
  };

  return (
    <>
      <Head><title>Hisob yaratish - Vivora</title></Head>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #FFF7ED 0%, #F8FAFC 100%)',
          p: 2,
        }}
      >
        <Box width="100%" maxWidth={480}>
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Vivora
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Restoraningizni aqlliroq boshqarishni boshlang
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={700} mb={0.5}>Hisob yaratish</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Restoraningizni bir necha soniyada sozlang
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField label="To‘liq ismingiz" {...field('name')} fullWidth />
                  <TextField label="Email manzil" type="email" {...field('email')} fullWidth />
                  <TextField
                    label="Parol"
                    type={showPw ? 'text' : 'password'}
                    {...field('password')}
                    fullWidth
                    helperText="Kamida 8 ta belgi"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPw((p) => !p)} edge="end">
                            {showPw ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Restoran nomi"
                    {...field('restaurantName')}
                    fullWidth
                    helperText="Bu restoraningizning ommaviy havola manzili (slug) bo‘ladi"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{ py: 1.5, mt: 1 }}
                  >
                    {loading ? 'Yaratilmoqda…' : 'Restoran yaratish'}
                  </Button>
                </Stack>
              </Box>

              <Typography variant="body2" textAlign="center" color="text.secondary" mt={3}>
                Hisobingiz bormi?{' '}
                <Typography
                  component={NextLink}
                  href="/login"
                  variant="body2"
                  color="primary"
                  fontWeight={600}
                  sx={{ textDecoration: 'none' }}
                >
                  Kirish
                </Typography>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  );
};

export default RegisterPage;
