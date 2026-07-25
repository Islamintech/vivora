import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Switch, FormControlLabel,
  TextField, Button, Chip, Divider, Avatar, LinearProgress,
} from '@mui/material';
import { Restaurant as RestaurantIcon, CheckCircle } from '@mui/icons-material';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  CATEGORIES_QUERY, MENU_ITEMS_QUERY, UPDATE_ITEM_AVAILABILITY_MUTATION,
} from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { MenuItem, MenuCategory } from '@/types';

const ItemRow = ({ item, onSave }: {
  item: MenuItem;
  onSave: (input: { itemId: string; isAvailable?: boolean; trackQuantity?: boolean; quantity?: number }) => void;
}) => {
  const [qty, setQty] = useState(String(item.quantity ?? 0));
  const soldOut = !item.isAvailable;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ sm: 'center' }}
      sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Box flex={1} minWidth={0}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight={600} noWrap>{item.name}</Typography>
          {soldOut
            ? <Chip label="Tugagan" size="small" color="error" />
            : <Chip label="Mavjud" size="small" color="success" variant="outlined" />}
        </Stack>
      </Box>

      {/* Available toggle */}
      <FormControlLabel
        sx={{ m: 0 }}
        control={
          <Switch
            checked={item.isAvailable}
            color="success"
            onChange={(e) => onSave({ itemId: item._id, isAvailable: e.target.checked })}
          />
        }
        label={<Typography variant="caption">Omborda</Typography>}
      />

      {/* Quantity tracking */}
      <FormControlLabel
        sx={{ m: 0 }}
        control={
          <Switch
            checked={item.trackQuantity}
            onChange={(e) => onSave({ itemId: item._id, trackQuantity: e.target.checked })}
          />
        }
        label={<Typography variant="caption">Miqdorni kuzatish</Typography>}
      />

      {item.trackQuantity && (
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            sx={{ width: 100 }}
            inputProps={{ min: 0 }}
            label="Qolgan"
          />
          <Button
            size="small"
            variant="contained"
            onClick={() => onSave({ itemId: item._id, quantity: parseInt(qty, 10) || 0 })}
          >
            O‘rnatish
          </Button>
        </Stack>
      )}
    </Stack>
  );
};

const AvailabilityPage: NextPage = () => {
  const { user } = useRequireAuth();

  const { data: catData } = useQuery(CATEGORIES_QUERY, { skip: !user });
  const { data: itemData, loading, refetch } = useQuery(MENU_ITEMS_QUERY, { skip: !user });

  const categories: MenuCategory[] = catData?.categories ?? [];
  const items: MenuItem[] = itemData?.menuItems ?? [];

  const [update] = useMutation(UPDATE_ITEM_AVAILABILITY_MUTATION, {
    onCompleted() { refetch(); },
    onError(e) { toast.error(e.message); },
  });

  const onSave = (input: any) => update({ variables: { input } });

  const soldOutCount = items.filter((i) => !i.isAvailable).length;

  if (!user) return null;

  return (
    <>
      <Head><title>Mavjudlik - Vivora</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Taomlar mavjudligi</Typography>
              <Typography color="text.secondary">
                Kunlik tekshiruv - mavjud taomlarni belgilang va tayyorlangan miqdorni kiriting
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip icon={<CheckCircle />} label={`${items.length - soldOutCount} ta mavjud`} color="success" variant="outlined" />
              <Chip label={`${soldOutCount} ta tugagan`} color={soldOutCount ? 'error' : 'default'} variant="outlined" />
            </Stack>
          </Stack>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {items.length === 0 && !loading && (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">Hali taomlar yo‘q</Typography>
              <Typography variant="body2" color="text.secondary">Avval Menyu bo‘limida taom qo‘shing.</Typography>
            </Card>
          )}

          {categories.map((cat) => {
            const catItems = items.filter((i) => i.categoryId === cat._id);
            if (!catItems.length) return null;
            return (
              <Card key={cat._id} sx={{ mb: 3 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark' }}>
                      <RestaurantIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>{cat.name}</Typography>
                  </Stack>
                  <Divider />
                  {catItems.map((item) => (
                    <ItemRow key={item._id} item={item} onSave={onSave} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </DashboardLayout>
    </>
  );
};

export default AvailabilityPage;
