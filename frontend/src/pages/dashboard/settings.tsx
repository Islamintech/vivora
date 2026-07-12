import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Stack, Divider, Grid, Avatar, Alert,
} from '@mui/material';
import { Save, Store } from '@mui/icons-material';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { MY_RESTAURANT_QUERY, UPDATE_RESTAURANT_MUTATION } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';

const SettingsPage: NextPage = () => {
  const { user } = useRequireAuth();
  const { data } = useQuery(MY_RESTAURANT_QUERY, { skip: !user });
  const restaurant = data?.myRestaurant;

  const [form, setForm] = useState({
    name: '', description: '', address: '', phone: '', logo: '', currency: 'USD', telegramChatId: '',
  });

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        logo: restaurant.logo || '',
        currency: restaurant.currency || 'USD',
        telegramChatId: restaurant.telegramChatId || '',
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

  return (
    <>
      <Head><title>Settings — RestoPlatform</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 700 }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800}>Restaurant Settings</Typography>
            <Typography color="text.secondary">Manage your restaurant profile and preferences</Typography>
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                  <Store />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{restaurant?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Public URL: /menu/{restaurant?.slug}/[table]
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
                  <TextField label="Logo URL" {...field('logo')} fullWidth placeholder="https://..." />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Currency" {...field('currency')} fullWidth placeholder="USD" />
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
                onClick={() => update({ variables: { input: form } })}
              >
                {loading ? 'Saving…' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Your restaurant's public menu URL is:{' '}
            <strong>{process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/menu/{restaurant?.slug}/[table-number]</strong>
          </Alert>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default SettingsPage;
