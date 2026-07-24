import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Stack, Divider, Grid, Avatar, Alert, FormControlLabel, Switch,
  CircularProgress,
} from '@mui/material';
import { Save, Store, Print, PhotoCamera, Delete } from '@mui/icons-material';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { MY_RESTAURANT_QUERY, UPDATE_RESTAURANT_MUTATION } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { uploadImage, cloudinaryConfigured } from '@/lib/cloudinary';

const SettingsPage: NextPage = () => {
  const { user } = useRequireAuth();
  const { data } = useQuery(MY_RESTAURANT_QUERY, { skip: !user });
  const restaurant = data?.myRestaurant;

  const [form, setForm] = useState({
    name: '', description: '', address: '', phone: '', logo: '', currency: 'KRW', telegramChatId: '',
    printerEnabled: false, printerIp: '', printerPort: '9100',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        logo: restaurant.logo || '',
        currency: restaurant.currency || 'KRW',
        telegramChatId: restaurant.telegramChatId || '',
        printerEnabled: restaurant.printerEnabled || false,
        printerIp: restaurant.printerIp || '',
        printerPort: String(restaurant.printerPort || 9100),
      });
    }
  }, [restaurant]);

  const [update, { loading }] = useMutation(UPDATE_RESTAURANT_MUTATION, {
    onCompleted() { toast.success('Settings saved!'); },
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

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!cloudinaryConfigured) {
      toast.error('Image upload is not configured yet.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5 MB.');
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file);
      setForm((p) => ({ ...p, logo: url }));
      toast.success('Logo uploaded — remember to save.');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <>
      <Head><title>Settings — Vivora</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 700 }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800}>Restaurant Settings</Typography>
            <Typography color="text.secondary">Manage your restaurant profile and preferences</Typography>
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
                  <TextField label="Restaurant Name" {...field('name')} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Description" {...field('description')} fullWidth multiline rows={2} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Address" {...field('address')} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Phone" {...field('phone')} fullWidth />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body2" fontWeight={600} mb={1}>Logo</Typography>
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
                        {form.logo ? 'Replace' : 'Upload logo'}
                        <input hidden type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" onChange={handleLogoFile} />
                      </Button>
                      {form.logo && (
                        <Button color="error" startIcon={<Delete />} onClick={() => setForm((p) => ({ ...p, logo: '' }))}>
                          Remove
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    PNG or SVG recommended, up to 5 MB.
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Currency" {...field('currency')} fullWidth placeholder="KRW" helperText="ISO code: KRW (₩), USD, EUR…" />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Telegram staff chat ID"
                    {...field('telegramChatId')}
                    fullWidth
                    placeholder="e.g. -1001234567890"
                    helperText="Add the platform bot to your staff Telegram group, then paste the group's chat ID here to receive new-order alerts."
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
                {loading ? 'Saving…' : 'Save Settings'}
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
                  <Typography variant="h6" fontWeight={700}>Kitchen ticket printing</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Auto-print a ticket to your kitchen printer when a customer places an order
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
                label="Enable auto-printing"
              />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Printer IP address"
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
                This only tells the print agent where your printer is — you still need to install the
                small print-agent program on a computer at the restaurant, on the same network as the
                printer. See <strong>print-agent/README.md</strong> for setup steps.
              </Alert>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Your restaurant's public menu URL is:{' '}
            <strong>{process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/{restaurant?.slug}/[table-number]</strong>
          </Alert>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default SettingsPage;
