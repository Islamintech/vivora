import type { NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Stack, InputAdornment, IconButton, Alert, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { LOGIN_MUTATION } from '@/graphql/operations';
import { useAuthStore } from '@/store/auth.store';
import { useRedirectIfAuthed } from '@/hooks/useAuth';

const LoginPage: NextPage = () => {
  useRedirectIfAuthed();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted(data) {
      setAuth(data.login.user, data.login.token);
      toast.success(`Xush kelibsiz, ${data.login.user.name}!`);
      if (data.login.user.role === 'SUPER_ADMIN') router.push('/admin');
      else router.push('/dashboard');
    },
    onError(err) {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Iltimos, barcha maydonlarni to‘ldiring');
      return;
    }
    login({ variables: { input: form } });
  };

  return (
    <>
      <Head><title>Kirish — Vivora</title></Head>
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
        <Box width="100%" maxWidth={440}>
          {/* Logo */}
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Vivora
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Restoran boshqaruv tizimi
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={700} mb={0.5}>Kirish</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Restoran paneliga kiring
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Email manzil"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    fullWidth
                    autoComplete="email"
                  />
                  <TextField
                    label="Parol"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    fullWidth
                    autoComplete="current-password"
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
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{ py: 1.5, mt: 1 }}
                  >
                    {loading ? 'Kirilmoqda…' : 'Kirish'}
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary">yoki</Typography>
              </Divider>

              <Typography variant="body2" textAlign="center" color="text.secondary">
                Yangi restoranmi?{' '}
                <Typography
                  component={NextLink}
                  href="/register"
                  variant="body2"
                  color="primary"
                  fontWeight={600}
                  sx={{ textDecoration: 'none' }}
                >
                  Hisob yarating
                </Typography>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  );
};

export default LoginPage;
