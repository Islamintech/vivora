import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Button,
  ThemeProvider, CssBaseline, AppBar, Toolbar, Avatar, Badge,
} from '@mui/material';
import {
  Kitchen, Notifications, CheckCircle, LocalDining, DoneAll,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { kitchenTheme } from '@/theme';
import {
  ORDERS_QUERY, UPDATE_ORDER_STATUS_MUTATION,
  ORDER_CREATED_SUBSCRIPTION, ORDER_STATUS_UPDATED_SUBSCRIPTION,
  MY_RESTAURANT_QUERY,
} from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { formatMoney } from '@/lib/money';
import { Order, OrderStatus } from '@/types';

dayjs.extend(relativeTime);

const STATUS_COLUMNS: { status: OrderStatus; label: string; color: string; next?: OrderStatus; nextLabel?: string }[] = [
  { status: 'PENDING', label: '🟡 Yangi buyurtmalar', color: '#F59E0B', next: 'PREPARING', nextLabel: 'Boshlash' },
  { status: 'PREPARING', label: '🔵 Tayyorlanmoqda', color: '#3B82F6', next: 'READY', nextLabel: 'Tayyor' },
  { status: 'READY', label: '🟢 Berishga tayyor', color: '#22C55E', next: 'SERVED', nextLabel: 'Berildi' },
];

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: (id: string, status: OrderStatus) => void }) {
  const currency = useCurrency();
  const col = STATUS_COLUMNS.find((c) => c.status === order.status);
  const ageMinutes = dayjs().diff(dayjs(order.createdAt), 'minute');
  const isUrgent = order.status === 'PENDING' && ageMinutes > 10;

  return (
    <Card
      sx={{
        bgcolor: '#1E1E2E',
        border: `1px solid ${isUrgent ? '#EF4444' : col?.color}40`,
        position: 'relative',
        overflow: 'visible',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)' },
      }}
    >
      {isUrgent && (
        <Box
          sx={{
            position: 'absolute', top: -8, right: -8,
            bgcolor: '#EF4444', borderRadius: '50%', width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Typography fontSize={10} fontWeight={800} color="white">!</Typography>
        </Box>
      )}
      <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: `${col?.color}20`, fontSize: '0.8rem', fontWeight: 800 }}>
              {order.tableNumber}
            </Avatar>
            <Typography fontWeight={700} color="white">{order.tableNumber}-stol</Typography>
            {order.orderType === 'TAKE_OUT' && (
              <Chip
                label="🥡 TAKE-OUT"
                size="small"
                sx={{ bgcolor: '#7C3AED', color: 'white', fontWeight: 800, height: 22 }}
              />
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: isUrgent ? '#EF4444' : 'grey.500' }}>
            {dayjs(order.createdAt).fromNow()}
          </Typography>
        </Stack>

        {/* Items */}
        <Box sx={{ mb: 2 }}>
          {order.items.map((item, i) => (
            <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #2A2A3E' }}>
              <Typography variant="body2" color="grey.300">
                <Typography component="span" fontWeight={700} color="white">×{item.quantity}</Typography>{' '}
                {item.name}
              </Typography>
              {item.notes && (
                <Typography variant="caption" color="warning.main">📝 {item.notes}</Typography>
              )}
            </Stack>
          ))}
        </Box>

        {order.customerNote && (
          <Box sx={{ p: 1.5, bgcolor: '#252535', borderRadius: 1.5, mb: 2 }}>
            <Typography variant="caption" color="grey.400">Izoh: </Typography>
            <Typography variant="body2" color="warning.light">{order.customerNote}</Typography>
          </Box>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700} color={col?.color}>{formatMoney(order.totalAmount, currency)}</Typography>
          {/* Status moves on its own (print → preparing, auto-serve at 20 min).
              The only tap staff need is "Done" when they've served it early. */}
          {order.status !== 'SERVED' ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<DoneAll sx={{ fontSize: 18 }} />}
              sx={{
                bgcolor: '#22C55E', color: '#000',
                '&:hover': { bgcolor: '#22C55E', filter: 'brightness(0.92)' },
                fontWeight: 800, borderRadius: 2,
              }}
              onClick={() => onUpdate(order._id, 'SERVED')}
            >
              Berildi
            </Button>
          ) : (
            <DoneAll sx={{ color: '#22C55E' }} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

const KitchenPage: NextPage = () => {
  const { user } = useRequireAuth();
  const restaurantId = user?.restaurantId;

  const { data: restData } = useQuery(MY_RESTAURANT_QUERY, { skip: !user });
  const restaurant = restData?.myRestaurant;

  const { data, refetch } = useQuery(ORDERS_QUERY, {
    variables: { limit: 80 },
    skip: !user,
  });

  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS_MUTATION, {
    onCompleted() { refetch(); },
    onError(e) { toast.error(e.message); },
  });

  // Real-time subscriptions
  useSubscription(ORDER_CREATED_SUBSCRIPTION, {
    variables: { restaurantId },
    skip: !restaurantId,
    onData({ data }) {
      const order = data.data?.orderCreated;
      if (order) {
        toast.success(`🍽 Yangi buyurtma! ${order.tableNumber}-stol`, { duration: 5000 });
        refetch();
      }
    },
  });

  useSubscription(ORDER_STATUS_UPDATED_SUBSCRIPTION, {
    variables: { restaurantId },
    skip: !restaurantId,
    onData() { refetch(); },
  });

  const orders: Order[] = data?.orders ?? [];

  const byStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status);

  const pendingCount = byStatus('PENDING').length;

  if (!user) return null;

  return (
    <ThemeProvider theme={kitchenTheme}>
      <CssBaseline />
      <Head><title>Oshxona ekrani — Vivora</title></Head>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

        {/* Kitchen Header */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#0D0D18', borderBottom: '1px solid #1E1E2E' }}>
          <Toolbar>
            {restaurant?.logo ? (
              <Avatar src={restaurant.logo} sx={{ width: 34, height: 34, mr: 1.5 }} />
            ) : (
              <Kitchen sx={{ mr: 1.5, color: 'primary.main' }} />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} noWrap sx={{ color: 'white', lineHeight: 1.2 }}>
                {restaurant?.name || 'Oshxona ekrani'}
              </Typography>
              {restaurant?.name && (
                <Typography variant="caption" sx={{ color: 'grey.500' }}>Oshxona ekrani</Typography>
              )}
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Badge badgeContent={pendingCount} color="warning">
                <Notifications sx={{ color: 'grey.400' }} />
              </Badge>
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                {dayjs().format('HH:mm')}
              </Typography>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Columns — three equal columns on desktop; on phones/tablets they
            stay side-by-side as horizontal scroll-snap panes so kitchen staff
            can glance across statuses instead of scrolling past a whole list. */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            overflowX: { xs: 'auto', md: 'visible' },
            scrollSnapType: { xs: 'x mandatory', md: 'none' },
            '& > *': { scrollSnapAlign: 'start' },
          }}
        >
          {STATUS_COLUMNS.map((col) => (
            <Box
              key={col.status}
              sx={{
                flex: { xs: '0 0 82%', sm: '0 0 45%', md: 1 },
                minWidth: 0,
              }}
            >
              {/* Column header */}
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Typography fontWeight={700} color="white">{col.label}</Typography>
                <Chip
                  label={byStatus(col.status).length}
                  size="small"
                  sx={{ bgcolor: `${col.color}20`, color: col.color, fontWeight: 700, height: 22 }}
                />
              </Stack>

              {/* Cards */}
              <Stack spacing={2}>
                {byStatus(col.status).map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onUpdate={(id, status) => updateStatus({ variables: { input: { orderId: id, status } } })}
                  />
                ))}
                {byStatus(col.status).length === 0 && (
                  <Box
                    sx={{
                      border: '2px dashed #1E1E2E', borderRadius: 3,
                      py: 6, textAlign: 'center',
                    }}
                  >
                    <LocalDining sx={{ color: '#2A2A3E', fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" color="grey.700">
                      {col.status === 'PENDING' ? 'Yangi buyurtma yo‘q' : 'Hammasi toza'}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default KitchenPage;
