import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Button,
  ThemeProvider, CssBaseline, AppBar, Toolbar, Avatar, Badge, Divider,
} from '@mui/material';
import {
  Kitchen, Notifications, LocalDining, Check, Close, DoneAll, Payments,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { kitchenTheme } from '@/theme';
import {
  ORDERS_QUERY, UPDATE_ORDER_STATUS_MUTATION, MARK_ORDER_PAID_MUTATION,
  ORDER_CREATED_SUBSCRIPTION, ORDER_STATUS_UPDATED_SUBSCRIPTION,
  MY_RESTAURANT_QUERY,
} from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { formatMoney } from '@/lib/money';
import { Order, OrderStatus } from '@/types';

dayjs.extend(relativeTime);

// The board runs left to right: a new order is accepted or rejected, then
// cooked, then handed over and paid for.
const COLUMNS: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'PENDING', label: 'Yangi buyurtmalar', color: '#F59E0B' },
  { status: 'PREPARING', label: 'Tayyorlanmoqda', color: '#3B82F6' },
  { status: 'SERVED', label: 'Berildi - to‘lov kutilmoqda', color: '#22C55E' },
];

type Actions = {
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onDone: (id: string) => void;
  onPaid: (id: string) => void;
};

function OrderCard({ order, actions }: { order: Order; actions: Actions }) {
  const currency = useCurrency();
  const col = COLUMNS.find((c) => c.status === order.status);
  const ageMinutes = dayjs().diff(dayjs(order.createdAt), 'minute');
  const isUrgent = order.status === 'PENDING' && ageMinutes > 5;

  return (
    <Card
      sx={{
        bgcolor: '#1E1E2E',
        border: `1px solid ${isUrgent ? '#EF4444' : col?.color}40`,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)' },
      }}
    >
      <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
        {/* Header: table + age */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: `${col?.color}20`, color: col?.color, fontSize: '0.8rem', fontWeight: 800 }}>
              {order.tableNumber}
            </Avatar>
            <Typography fontWeight={700} color="white">{order.tableNumber}-stol</Typography>
            {order.orderType === 'TAKE_OUT' && (
              <Chip label="Olib ketish" size="small" sx={{ bgcolor: '#7C3AED', color: 'white', fontWeight: 800, height: 22 }} />
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: isUrgent ? '#EF4444' : 'grey.500', fontWeight: isUrgent ? 700 : 400 }}>
            {dayjs(order.createdAt).fromNow()}
          </Typography>
        </Stack>

        {/* Items */}
        <Box sx={{ mb: 1.5 }}>
          {order.items.map((item, i) => (
            <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #2A2A3E' }}>
              <Typography variant="body2" color="grey.300">
                <Typography component="span" fontWeight={700} color="white">×{item.quantity}</Typography>{' '}
                {item.name}
              </Typography>
              {item.notes && (
                <Typography variant="caption" color="warning.main" sx={{ textAlign: 'right', ml: 1 }}>{item.notes}</Typography>
              )}
            </Stack>
          ))}
        </Box>

        {order.customerNote && (
          <Box sx={{ p: 1.5, bgcolor: '#252535', borderRadius: 1.5, mb: 1.5 }}>
            <Typography variant="caption" color="grey.400">Izoh: </Typography>
            <Typography variant="body2" color="warning.light" component="span">{order.customerNote}</Typography>
          </Box>
        )}

        {/* Amount - emphasised once it's time to collect */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="caption" color="grey.500">
            {order.status === 'SERVED' ? 'Mijozdan olinadi' : 'Summa'}
          </Typography>
          <Typography
            fontWeight={800}
            sx={{
              color: order.status === 'SERVED' ? '#22C55E' : 'grey.300',
              fontSize: order.status === 'SERVED' ? '1.35rem' : '1rem',
            }}
          >
            {formatMoney(order.totalAmount, currency)}
          </Typography>
        </Stack>

        {/* Stage actions */}
        {order.status === 'PENDING' && (
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth size="small" variant="contained" startIcon={<Check />}
              onClick={() => actions.onAccept(order._id)}
              sx={{ bgcolor: '#22C55E', color: '#04210F', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#16A34A' } }}
            >
              Qabul qilish
            </Button>
            <Button
              size="small" variant="outlined" startIcon={<Close />}
              onClick={() => actions.onReject(order._id)}
              sx={{ color: '#F87171', borderColor: '#7F1D1D', fontWeight: 700, borderRadius: 2, flexShrink: 0, '&:hover': { borderColor: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' } }}
            >
              Rad etish
            </Button>
          </Stack>
        )}

        {order.status === 'PREPARING' && (
          <Button
            fullWidth size="small" variant="contained" startIcon={<DoneAll />}
            onClick={() => actions.onDone(order._id)}
            sx={{ bgcolor: '#3B82F6', color: '#fff', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#2563EB' } }}
          >
            Tayyor - berildi
          </Button>
        )}

        {order.status === 'SERVED' && (
          <Button
            fullWidth size="small" variant="contained" startIcon={<Payments />}
            onClick={() => actions.onPaid(order._id)}
            sx={{ bgcolor: '#22C55E', color: '#04210F', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#16A34A' } }}
          >
            To‘landi
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

const KitchenPage: NextPage = () => {
  const { user } = useRequireAuth();
  const currency = useCurrency();
  const restaurantId = user?.restaurantId;

  const { data: restData } = useQuery(MY_RESTAURANT_QUERY, { skip: !user });
  const restaurant = restData?.myRestaurant;

  // unpaidOnly: settled orders leave the board entirely.
  const { data, refetch } = useQuery(ORDERS_QUERY, {
    variables: { limit: 100, unpaidOnly: true },
    skip: !user,
  });

  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS_MUTATION, {
    onCompleted() { refetch(); },
    onError(e) { toast.error(e.message); },
  });

  const [markPaid] = useMutation(MARK_ORDER_PAID_MUTATION, {
    onCompleted() { toast.success('To‘lov qayd etildi'); refetch(); },
    onError(e) { toast.error(e.message); },
  });

  // Collected during this shift, tracked locally as staff tap "To'landi" so
  // the header updates instantly.
  const [collected, setCollected] = useState(0);

  useSubscription(ORDER_CREATED_SUBSCRIPTION, {
    variables: { restaurantId },
    skip: !restaurantId,
    onData({ data }) {
      const order = data.data?.orderCreated;
      if (order) {
        toast.success(`Yangi buyurtma! ${order.tableNumber}-stol`, { duration: 5000 });
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
  const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);
  const pendingCount = byStatus('PENDING').length;
  const awaitingTotal = byStatus('SERVED').reduce((sum, o) => sum + o.totalAmount, 0);

  const setStatus = (orderId: string, status: OrderStatus) =>
    updateStatus({ variables: { input: { orderId, status } } });

  const actions: Actions = {
    onAccept: (id) => setStatus(id, 'PREPARING'),
    onReject: (id) => {
      if (confirm('Bu buyurtma rad etilsinmi? Taomlar omborga qaytariladi.')) {
        setStatus(id, 'CANCELLED');
      }
    },
    onDone: (id) => setStatus(id, 'SERVED'),
    onPaid: (id) => {
      const order = orders.find((o) => o._id === id);
      if (order) setCollected((c) => c + order.totalAmount);
      markPaid({ variables: { orderId: id } });
    },
  };

  if (!user) return null;

  return (
    <ThemeProvider theme={kitchenTheme}>
      <CssBaseline />
      <Head><title>Oshxona ekrani - Vivora</title></Head>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

        {/* Header */}
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
              <Typography variant="caption" sx={{ color: 'grey.500' }}>Oshxona ekrani</Typography>
            </Box>

            <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} alignItems="center">
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', lineHeight: 1.2 }}>
                  Yig‘ilgan
                </Typography>
                <Typography fontWeight={800} sx={{ color: '#22C55E', lineHeight: 1.2 }}>
                  {formatMoney(collected, currency)}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: '#1E1E2E', display: { xs: 'none', sm: 'block' } }} />
              <Badge badgeContent={pendingCount} color="warning">
                <Notifications sx={{ color: 'grey.400' }} />
              </Badge>
              <Typography variant="caption" sx={{ color: 'grey.400', display: { xs: 'none', sm: 'block' } }}>
                {dayjs().format('HH:mm')}
              </Typography>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Columns - side-by-side scroll-snap panes on small screens */}
        <Box
          sx={{
            p: 2, display: 'flex', gap: 2, alignItems: 'flex-start',
            overflowX: { xs: 'auto', md: 'visible' },
            scrollSnapType: { xs: 'x mandatory', md: 'none' },
            '& > *': { scrollSnapAlign: 'start' },
          }}
        >
          {COLUMNS.map((col) => {
            const list = byStatus(col.status);
            return (
              <Box key={col.status} sx={{ flex: { xs: '0 0 82%', sm: '0 0 45%', md: 1 }, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: col.color, flexShrink: 0 }} />
                  <Typography fontWeight={700} color="white" noWrap sx={{ minWidth: 0 }}>{col.label}</Typography>
                  <Chip
                    label={list.length}
                    size="small"
                    sx={{ bgcolor: `${col.color}20`, color: col.color, fontWeight: 700, height: 22, flexShrink: 0 }}
                  />
                  {/* Money still to collect, on the payment column */}
                  {col.status === 'SERVED' && awaitingTotal > 0 && (
                    <Typography variant="caption" sx={{ ml: 'auto !important', color: '#22C55E', fontWeight: 700, flexShrink: 0 }}>
                      {formatMoney(awaitingTotal, currency)}
                    </Typography>
                  )}
                </Stack>

                <Stack spacing={2}>
                  {list.map((order) => (
                    <OrderCard key={order._id} order={order} actions={actions} />
                  ))}
                  {list.length === 0 && (
                    <Box sx={{ border: '2px dashed #1E1E2E', borderRadius: 3, py: 6, textAlign: 'center' }}>
                      <LocalDining sx={{ color: '#2A2A3E', fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" color="grey.700">
                        {col.status === 'PENDING' ? 'Yangi buyurtma yo‘q' : 'Bo‘sh'}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default KitchenPage;
