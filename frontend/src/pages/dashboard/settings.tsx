import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Stack, Divider, Grid, Avatar, Alert, FormControlLabel, Switch,
  CircularProgress,
} from '@mui/material';
import { Save, Store, Print, PhotoCamera, Delete, Schedule } from '@mui/icons-material';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { MY_RESTAURANT_QUERY, UPDATE_RESTAURANT_MUTATION } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { uploadImage, cloudinaryConfigured } from '@/lib/cloudinary';
import CoverHeader from '@/components/customer/CoverHeader';

const SettingsPage: NextPage = () => {
  const { user } = useRequireAuth();
  const { data } = useQuery(MY_RESTAURANT_QUERY, { skip: !user });
  const restaurant = data?.myRestaurant;

  const [form, setForm] = useState({
    name: '', description: '', address: '', phone: '', logo: '', coverImage: '', currency: 'KRW', telegramChatId: '',
    printerEnabled: false, printerIp: '', printerPort: '9100',
    openingTime: '09:00', closingTime: '22:00', alwaysOpen: false,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        logo: restaurant.logo || '',
        coverImage: restaurant.coverImage || '',
        currency: restaurant.currency || 'KRW',
        telegramChatId: restaurant.telegramChatId || '',
        printerEnabled: restaurant.printerEnabled || false,
        printerIp: restaurant.printerIp || '',
        printerPort: String(restaurant.printerPort || 9100),
        openingTime: restaurant.openingTime || '09:00',
        closingTime: restaurant.closingTime || '22:00',
        alwaysOpen: restaurant.alwaysOpen || false,
      });
    }
  }, [restaurant]);

  const [update, { loading }] = useMutation(UPDATE_RESTAURANT_MUTATION, {
    onCompleted() { toast.success('Sozlamalar saqlandi!'); },
    onError(e) { toast.error(e.message); },
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const handleSave = () => {
    update({
      variables: {
        input: {
          ...form,
          printerPort: parseInt(form.printerPort, 10) || 9100,
        },
      },
    });
  };

  // Shared by the logo and the cover photo - same upload, same limits, only
  // the field it lands in differs.
  const handleImageFile = (
    key: 'logo' | 'coverImage',
    label: string,
    setBusy: (v: boolean) => void,
  ) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!cloudinaryConfigured) {
      toast.error('Rasm yuklash hali sozlanmagan.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} 5 MB dan kichik bo‘lishi kerak.`);
      return;
    }
    setBusy(true);
    try {
      const url = await uploadImage(file);
      setForm((p) => ({ ...p, [key]: url }));
      toast.success(`${label} yuklandi - saqlashni unutmang.`);
    } catch (err: any) {
      toast.error(err.message || 'Yuklab bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  const handleLogoFile = handleImageFile('logo', 'Logotip', setUploadingLogo);
  const handleCoverFile = handleImageFile('coverImage', 'Muqova rasmi', setUploadingCover);

  return (
    <>
      <Head><title>Sozlamalar - Vivora</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 700 }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800}>Restoran sozlamalari</Typography>
            <Typography color="text.secondary">Restoran profilingiz va sozlamalarni boshqaring</Typography>
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar src={form.logo || undefined} sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                  <Store />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{restaurant?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Public URL: /{restaurant?.slug}/[table]
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField label="Restoran nomi" {...field('name')} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Tavsif" {...field('description')} fullWidth multiline rows={2} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Manzil" {...field('address')} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Telefon" {...field('phone')} fullWidth />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body2" fontWeight={600} mb={1}>Logotip</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={form.logo || undefined}
                      variant="rounded"
                      sx={{ width: 64, height: 64, bgcolor: 'grey.100', color: 'grey.500' }}
                    >
                      <Store />
                    </Avatar>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={uploadingLogo ? <CircularProgress size={16} /> : <PhotoCamera />}
                        disabled={uploadingLogo}
                      >
                        {form.logo ? 'Almashtirish' : 'Logotip yuklash'}
                        <input hidden type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" onChange={handleLogoFile} />
                      </Button>
                      {form.logo && (
                        <Button color="error" startIcon={<Delete />} onClick={() => setForm((p) => ({ ...p, logo: '' }))}>
                          O‘chirish
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    PNG yoki SVG tavsiya etiladi, 5 MB gacha.
                  </Typography>
                </Grid>

                {/* Cover photo, previewed exactly as the guest will see it -
                    name and all - so the owner can tell straight away whether
                    their photo works behind the text. */}
                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight={600} mb={1}>Muqova rasmi</Typography>
                  <CoverHeader
                    image={form.coverImage || undefined}
                    sx={{ borderRadius: 3, py: 4, px: 2, textAlign: 'center', mb: 1.5 }}
                  >
                    <Typography variant="h6" fontWeight={800} color="white">
                      {form.name || 'Restoran nomi'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)', mt: 0.5 }}>
                      Stol 1 · Shu yerda
                    </Typography>
                  </CoverHeader>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={uploadingCover ? <CircularProgress size={16} /> : <PhotoCamera />}
                      disabled={uploadingCover}
                    >
                      {form.coverImage ? 'Almashtirish' : 'Muqova yuklash'}
                      <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverFile} />
                    </Button>
                    {form.coverImage && (
                      <Button color="error" startIcon={<Delete />} onClick={() => setForm((p) => ({ ...p, coverImage: '' }))}>
                        O‘chirish
                      </Button>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Menyu tepasida ko‘rinadi. Keng (gorizontal) rasm tanlang, 5 MB gacha.
                    Nomi o‘qilishi uchun rasm ustiga to‘q qatlam qo‘yiladi.
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField label="Valyuta" {...field('currency')} fullWidth placeholder="KRW" helperText="ISO kod: KRW (₩), USD, EUR…" />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Telegram xodimlar chat ID"
                    {...field('telegramChatId')}
                    fullWidth
                    placeholder="e.g. -1001234567890"
                    helperText="Platforma botini xodimlar Telegram guruhiga qo‘shing, so‘ng guruh chat ID sini shu yerga joylashtiring."
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                startIcon={<Save />}
                sx={{ mt: 3 }}
                disabled={loading}
                onClick={handleSave}
              >
                {loading ? 'Saqlanmoqda…' : 'Saqlash'}
              </Button>
            </CardContent>
          </Card>

          {/* Opening hours - customers can only order while open */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.light', color: 'primary.dark' }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Ish vaqti</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Yopiq vaqtda mijozlar QR orqali buyurtma bera olmaydi
                  </Typography>
                </Box>
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={form.alwaysOpen}
                    onChange={(e) => setForm((p) => ({ ...p, alwaysOpen: e.target.checked }))}
                  />
                }
                label="Kunu tun ochiq (24/7)"
              />

              {!form.alwaysOpen && (
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Ochilish vaqti"
                      type="time"
                      {...field('openingTime')}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Yopilish vaqti"
                      type="time"
                      {...field('closingTime')}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      helperText={
                        form.closingTime <= form.openingTime
                          ? 'Yarim tundan oshadi (masalan 18:00 - 02:00)'
                          : ' '
                      }
                    />
                  </Grid>
                </Grid>
              )}

              <Button
                variant="contained"
                startIcon={<Save />}
                sx={{ mt: 2 }}
                disabled={loading}
                onClick={handleSave}
              >
                {loading ? 'Saqlanmoqda…' : 'Saqlash'}
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'grey.800' }}>
                  <Print />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Oshxona cheki chop etish</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Mijoz buyurtma berganda oshxona printeridan chek chiqadi
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <FormControlLabel
                sx={{ mb: 2 }}
                control={
                  <Switch
                    checked={form.printerEnabled}
                    onChange={(e) => setForm((p) => ({ ...p, printerEnabled: e.target.checked }))}
                  />
                }
                label="Avtomatik chop etishni yoqish"
              />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Printer IP manzili"
                    {...field('printerIp')}
                    fullWidth
                    placeholder="e.g. 192.168.1.50"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Port"
                    {...field('printerPort')}
                    fullWidth
                    placeholder="9100"
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2 }}>
                Bu faqat print-agentga printeringiz qayerdaligini bildiradi - restoran kompyuteriga,
                printer bilan bir tarmoqda, kichik print-agent dasturini o‘rnatishingiz kerak.
                Sozlash bo‘yicha <strong>print-agent/README.md</strong> ga qarang.
              </Alert>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Restoraningizning ommaviy menyu havolasi:{' '}
            <strong>{process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/{restaurant?.slug}/[table-number]</strong>
          </Alert>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default SettingsPage;
