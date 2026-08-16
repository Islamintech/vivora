import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Button,
  ThemeProvider, CssBaseline, AppBar, Toolbar, Avatar, Badge, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete,
  TextField, IconButton, Tooltip,
} from '@mui/material';
import {
  Kitchen, Notifications, LocalDining, Check, Close, DoneAll, Payments,
  PlaylistAdd, Add, Remove, Restaurant, ShoppingBag, ArrowBack, Phone,
  VolumeUp, VolumeOff,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { kitchenTheme } from '../libs/theme';
import { UPDATE_ORDER_STATUS_MUTATION, MARK_ORDER_PAID_MUTATION, ADD_ITEMS_TO_ORDER_MUTATION, PLACE_ORDER_MUTATION } from '../apollo/user/mutation';
import { ORDERS_QUERY, MENU_ITEMS_QUERY, MY_RESTAURANT_QUERY, TABLES_QUERY, OPEN_TABLE_SESSIONS_QUERY, PUBLIC_MENU_QUERY } from '../apollo/user/query';
import { ORDER_CREATED_SUBSCRIPTION, ORDER_STATUS_UPDATED_SUBSCRIPTION } from '../apollo/user/subscription';
import { useRequireAuth } from '../libs/hooks/useAuth';
import { useKitchenAlarm } from '../libs/hooks/useKitchenAlarm';
import { useCurrency } from '../libs/hooks/useCurrency';
import { formatMoney } from '../libs/money';
import { MenuItem, Order, OrderStatus, Table } from '../libs/types';
import PhoneOrderDialog from '../libs/components/kitchen/PhoneOrderDialog';
import { sized } from '../libs/cloudinary';

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
  onAddItems: (order: Order) => void;
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
              {order.tableNumber ?? <Phone sx={{ fontSize: 16 }} />}
            </Avatar>
            <Typography fontWeight={700} color="white">
              {order.tableNumber ? `${order.tableNumber}-stol` : 'Telefon'}
            </Typography>
            {/* Packing a dine-in order, or plating a takeaway, is a mistake the
                kitchen only catches at the pass - so say which every time,
                with an icon rather than the absence of a chip. */}
            {order.orderType === 'TAKE_OUT' ? (
              <Chip
                icon={<ShoppingBag sx={{ fontSize: 15, color: 'inherit !important' }} />}
                label="Olib ketish"
                size="small"
                sx={{ bgcolor: '#7C3AED', color: 'white', fontWeight: 800, height: 24 }}
              />
            ) : (
              <Chip
                icon={<Restaurant sx={{ fontSize: 15, color: 'inherit !important' }} />}
                label="Shu yerda"
                size="small"
                sx={{ bgcolor: '#1E3A8A', color: '#BFDBFE', fontWeight: 800, height: 24 }}
              />
            )}
          </Stack>
          {/* Clock time as well as "how long ago": when a caller rings back
              about their order, the time it was taken is what identifies it. */}
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography variant="body2" sx={{ color: isUrgent ? '#EF4444' : 'grey.300', fontWeight: 700, lineHeight: 1.2 }}>
              {dayjs(order.createdAt).format('HH:mm')}
            </Typography>
            <Typography variant="caption" sx={{ color: isUrgent ? '#EF4444' : 'grey.500', lineHeight: 1.2 }}>
              {dayjs(order.createdAt).fromNow()}
            </Typography>
          </Box>
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
          <Stack spacing={1}>
            {/* Guest changed their mind mid-prep - add to the same bill. */}
            <Button
              fullWidth size="small" variant="outlined" startIcon={<PlaylistAdd />}
              onClick={() => actions.onAddItems(order)}
              sx={{ color: '#93C5FD', borderColor: '#1E3A8A', fontWeight: 700, borderRadius: 2, '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59,130,246,0.08)' } }}
            >
              Ovqat qo‘shish
            </Button>
            <Button
              fullWidth size="small" variant="contained" startIcon={<DoneAll />}
              onClick={() => actions.onDone(order._id)}
              sx={{ bgcolor: '#3B82F6', color: '#fff', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#2563EB' } }}
            >
              Tayyor - berildi
            </Button>
          </Stack>
        )}

        {order.status === 'SERVED' && (
          <Stack spacing={1}>
            {/* Guest asked for something extra after ordering - it joins this
                same bill rather than becoming a second one to collect. */}
            <Button
              fullWidth size="small" variant="outlined" startIcon={<PlaylistAdd />}
              onClick={() => actions.onAddItems(order)}
              sx={{ color: '#93C5FD', borderColor: '#1E3A8A', fontWeight: 700, borderRadius: 2, '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59,130,246,0.08)' } }}
            >
              Ovqat qo‘shish
            </Button>
            <Button
              fullWidth size="small" variant="contained" startIcon={<Payments />}
              onClick={() => actions.onPaid(order._id)}
              sx={{ bgcolor: '#22C55E', color: '#04210F', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#16A34A' } }}
            >
              To‘landi
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

const KitchenPage: NextPage = () => {
  const { user } = useRequireAuth();
  const router = useRouter();
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

  // Taking an order over the phone: needs the table list (to show what is
  // free), the open tabs (to know what is busy) and the menu as a guest sees
  // it. All three are staff-readable already.
  const [phoneOrderOpen, setPhoneOrderOpen] = useState(false);
  const { data: tablesData } = useQuery(TABLES_QUERY, { skip: !user });
  const { data: sessionsData } = useQuery(OPEN_TABLE_SESSIONS_QUERY, {
    skip: !user,
    pollInterval: 30000,
  });
  const { data: publicMenuData } = useQuery(PUBLIC_MENU_QUERY, {
    variables: { restaurantId },
    skip: !restaurantId,
  });

  const [placeOrder, { loading: placingPhoneOrder }] = useMutation(PLACE_ORDER_MUTATION, {
    onCompleted(res) {
      const o = res?.placeOrder;
      toast.success(o?.tableNumber ? `${o.tableNumber}-stol buyurtmasi qabul qilindi` : 'Telefon buyurtma qabul qilindi');
      setPhoneOrderOpen(false);
      refetch();
    },
    onError(e) { toast.error(e.message); },
  });

  // Rejecting asks first, through a real dialog rather than window.confirm:
  // kiosk browsers and Android WebViews routinely suppress native dialogs, and
  // a suppressed confirm() returns false, so the button would appear dead.
  const [rejectTarget, setRejectTarget] = useState<Order | null>(null);

  // "Ovqat qo'shish": append verbally-requested items to an existing bill.
  const [addTarget, setAddTarget] = useState<Order | null>(null);
  const [pick, setPick] = useState<{ menuItemId: string; name: string; price: number; quantity: number }[]>([]);

  const { data: menuData } = useQuery(MENU_ITEMS_QUERY, { skip: !user });
  const menuItems: MenuItem[] = (menuData?.menuItems ?? []).filter((m: MenuItem) => m.isAvailable);

  const [addItems, { loading: addingItems }] = useMutation(ADD_ITEMS_TO_ORDER_MUTATION, {
    onCompleted() {
      toast.success('Hisobga qo‘shildi');
      setAddTarget(null);
      setPick([]);
      refetch();
    },
    onError(e) { toast.error(e.message); },
  });

  const pickTotal = pick.reduce((s, c) => s + c.price * c.quantity, 0);

  const addPick = (item: MenuItem | null) => {
    if (!item) return;
    setPick((prev) => {
      const found = prev.find((c) => c.menuItemId === item._id);
      if (found) return prev.map((c) => (c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const bumpPick = (menuItemId: string, delta: number) =>
    setPick((prev) =>
      prev.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );

  const orders: Order[] = data?.orders ?? [];
  const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);
  const pendingCount = byStatus('PENDING').length;
  const awaitingTotal = byStatus('SERVED').reduce((sum, o) => sum + o.totalAmount, 0);

  // Nobody is watching this screen. The alarm keeps ringing until every new
  // order has been accepted.
  const alarm = useKitchenAlarm(pendingCount);

  useSubscription(ORDER_CREATED_SUBSCRIPTION, {
    variables: { restaurantId },
    skip: !restaurantId,
    onData({ data }) {
      const order = data.data?.orderCreated;
      if (order) {
        alarm.play();
        toast.success(
          order.tableNumber ? `Yangi buyurtma! ${order.tableNumber}-stol` : 'Yangi telefon buyurtma!',
          { duration: 5000, icon: '🔔' },
        );
        refetch();
      }
    },
  });

  useSubscription(ORDER_STATUS_UPDATED_SUBSCRIPTION, {
    variables: { restaurantId },
    skip: !restaurantId,
    onData() { refetch(); },
  });

  // Staff need to see that a tap landed. Without this the card just vanishes
  // and there is no telling a successful reject from a dead button.
  const setStatus = (orderId: string, status: OrderStatus, done?: string) =>
    updateStatus({ variables: { input: { orderId, status } } })
      .then(() => { if (done) toast.success(done); })
      .catch(() => { /* onError already reports it */ });

  const actions: Actions = {
    onAccept: (id) => setStatus(id, 'PREPARING', 'Buyurtma qabul qilindi'),
    onReject: (id) => setRejectTarget(orders.find((o) => o._id === id) ?? null),
    onDone: (id) => setStatus(id, 'SERVED', 'Berildi deb belgilandi'),
    onPaid: (id) => {
      const order = orders.find((o) => o._id === id);
      if (order) setCollected((c) => c + order.totalAmount);
      markPaid({ variables: { orderId: id } });
    },
    onAddItems: (order) => { setPick([]); setAddTarget(order); },
  };

  if (!user) return null;

  return (
    <ThemeProvider theme={kitchenTheme}>
      <CssBaseline />
      {/* The count in the tab title is the only alert visible when the board
          is not the tablet's active tab. */}
      <Head>
        <title>
          {pendingCount > 0 ? `(${pendingCount}) Yangi buyurtma! - Vivora` : 'Oshxona ekrani - Vivora'}
        </title>
      </Head>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

        {/* Header */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#0D0D18', borderBottom: '1px solid #1E1E2E' }}>
          <Toolbar>
            {/* The way back. A kitchen screen is usually a wall-mounted tablet
                with no browser chrome, so without this there is no way out
                short of knowing the URL. The arrow is always visible rather
                than on hover, because these screens are touch-only. */}
            <Tooltip title="Boshqaruv paneliga qaytish">
              <IconButton
                onClick={() => router.push('/dashboard')}
                aria-label="Boshqaruv paneliga qaytish"
                sx={{
                  mr: 1.5, p: 0.75, borderRadius: 2, gap: 0.75,
                  color: 'grey.400',
                  '&:hover': { bgcolor: '#1E1E2E', color: 'white' },
                }}
              >
                <ArrowBack sx={{ fontSize: 20 }} />
                {restaurant?.logo ? (
                  <Avatar src={sized(restaurant.logo, 100)} sx={{ width: 34, height: 34 }} />
                ) : (
                  <Kitchen sx={{ color: 'primary.main' }} />
                )}
              </IconButton>
            </Tooltip>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} noWrap sx={{ color: 'white', lineHeight: 1.2 }}>
                {restaurant?.name || 'Oshxona ekrani'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.500' }}>Oshxona ekrani</Typography>
            </Box>

            <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} alignItems="center">
              {/* Taking an order over the phone, without leaving the board */}
              <Button
                variant="contained"
                startIcon={<Phone />}
                onClick={() => setPhoneOrderOpen(true)}
                sx={{ fontWeight: 800, borderRadius: 2, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Telefon buyurtma</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Buyurtma</Box>
              </Button>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', lineHeight: 1.2 }}>
                  Yig‘ilgan
                </Typography>
                <Typography fontWeight={800} sx={{ color: '#22C55E', lineHeight: 1.2 }}>
                  {formatMoney(collected, currency)}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: '#1E1E2E', display: { xs: 'none', sm: 'block' } }} />
              {/* The bell is also the mute switch. Staff reach for it the
                  moment the sound annoys them, so that is where the control
                  belongs - and while it is off the icon says so, because a
                  silently muted board loses orders. */}
              <Tooltip title={alarm.enabled ? 'Ovozni o‘chirish' : 'Ovozni yoqish'}>
                <IconButton onClick={alarm.toggle} sx={{ color: alarm.enabled ? 'grey.400' : '#F87171' }}>
                  <Badge badgeContent={pendingCount} color="warning">
                    {alarm.enabled ? <VolumeUp /> : <VolumeOff />}
                  </Badge>
                </IconButton>
              </Tooltip>
              {/* Nothing has been tapped yet, so the browser is still blocking
                  audio. Say it plainly - the alarm is silent until then. */}
              {alarm.enabled && !alarm.audioReady && (
                <Chip
                  icon={<Notifications sx={{ fontSize: 16, color: 'inherit !important' }} />}
                  label="Ovoz uchun bosing"
                  size="small"
                  onClick={() => { /* the click itself unlocks audio */ }}
                  sx={{ bgcolor: '#7F1D1D', color: '#FECACA', fontWeight: 700 }}
                />
              )}
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

        {/* Add items to an existing bill */}
        <PhoneOrderDialog
          open={phoneOrderOpen}
          tables={(tablesData?.tables ?? []).filter((t: Table) => t.isActive)}
          openSessions={sessionsData?.openTableSessions ?? []}
          sections={publicMenuData?.publicMenu ?? []}
          currency={currency}
          submitting={placingPhoneOrder}
          onClose={() => setPhoneOrderOpen(false)}
          onSubmit={(r) =>
            placeOrder({
              variables: {
                input: {
                  restaurantId,
                  tableNumber: r.tableNumber ?? undefined,
                  items: r.items,
                  orderType: r.orderType,
                  customerNote: r.customerNote || undefined,
                  language: 'uz',
                },
              },
            })
          }
        />

        {/* Reject confirmation */}
        <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle fontWeight={800}>
            {rejectTarget?.tableNumber}-stol buyurtmasi rad etilsinmi?
          </DialogTitle>
          <DialogContent>
            <Stack spacing={0.5} mb={2}>
              {rejectTarget?.items.map((it, i) => (
                <Typography key={i} variant="body2" color="grey.300">
                  <Typography component="span" fontWeight={700} color="white">×{it.quantity}</Typography>{' '}
                  {it.name}
                </Typography>
              ))}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Taomlar omborga qaytariladi va mijoz hisobidan chiqariladi.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setRejectTarget(null)}>Bekor qilish</Button>
            {/* color="error", not an sx background-color: the theme paints
                containedPrimary with a `background` shorthand, which would win
                and leave a destructive action looking like the primary one. */}
            <Button
              variant="contained"
              color="error"
              startIcon={<Close />}
              onClick={() => {
                if (rejectTarget) setStatus(rejectTarget._id, 'CANCELLED', 'Buyurtma rad etildi');
                setRejectTarget(null);
              }}
              sx={{ fontWeight: 800 }}
            >
              Ha, rad etish
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!addTarget} onClose={() => setAddTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle fontWeight={800}>
            {addTarget?.tableNumber}-stol - ovqat qo‘shish
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Mijoz og‘zaki so‘ragan taomni shu hisobga qo‘shing - u bitta to‘lovda hisoblanadi.
            </Typography>
            <Autocomplete
              options={menuItems}
              getOptionLabel={(o) => `${o.name} - ${formatMoney(o.price, currency)}`}
              value={null}
              blurOnSelect
              onChange={(_, item) => addPick(item)}
              renderInput={(params) => <TextField {...params} label="Taom tanlang" autoFocus />}
              sx={{ mb: 2 }}
            />
            <Stack spacing={1}>
              {pick.map((item) => (
                <Stack key={item.menuItemId} direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1, minWidth: 0 }} noWrap>{item.name}</Typography>
                  <IconButton size="small" onClick={() => bumpPick(item.menuItemId, -1)}><Remove fontSize="small" /></IconButton>
                  <Typography fontWeight={700} sx={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</Typography>
                  <IconButton size="small" onClick={() => bumpPick(item.menuItemId, 1)}><Add fontSize="small" /></IconButton>
                  <Typography variant="body2" fontWeight={700} sx={{ minWidth: 68, textAlign: 'right' }}>
                    {formatMoney(item.price * item.quantity, currency)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            {pick.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={700}>Qo‘shiladi</Typography>
                  <Typography fontWeight={800} color="primary">{formatMoney(pickTotal, currency)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" mt={0.5}>
                  <Typography variant="body2" color="text.secondary">Yangi jami</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatMoney((addTarget?.totalAmount ?? 0) + pickTotal, currency)}
                  </Typography>
                </Stack>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setAddTarget(null)}>Bekor qilish</Button>
            <Button
              variant="contained"
              disabled={addingItems || !pick.length}
              onClick={() =>
                addTarget && addItems({
                  variables: {
                    input: {
                      orderId: addTarget._id,
                      items: pick.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
                    },
                  },
                })
              }
            >
              Qo‘shish
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default KitchenPage;
