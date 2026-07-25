import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Avatar, Table, TableHead, TableRow, TableCell, TableBody,
  Tab, Tabs, LinearProgress, AppBar, Toolbar, Alert, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, MenuItem, Divider, Tooltip,
} from '@mui/material';
import {
  Store, People, ShoppingBag, TrendingUp, AdminPanelSettings,
  Warning, Error as ErrorIcon, Info, Logout, CheckCircle, Cancel,
  HourglassTop, DeleteSweep, Key, Visibility, Block, CheckCircleOutline,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import {
  PLATFORM_STATS_QUERY, ADMIN_RESTAURANTS_QUERY, ERROR_LOGS_QUERY,
  ALL_ORDERS_QUERY, ADMIN_TOGGLE_RESTAURANT_MUTATION,
  PENDING_RESTAURANTS_QUERY, APPROVE_RESTAURANT_MUTATION, REJECT_RESTAURANT_MUTATION,
  PURGE_ERROR_LOGS_MUTATION, ADMIN_USERS_QUERY, ADMIN_TOGGLE_USER_MUTATION,
  ADMIN_RESET_USER_PASSWORD_MUTATION, ADMIN_RESTAURANT_DETAIL_QUERY,
  PLATFORM_TIMESERIES_QUERY, ALL_INVOICES_QUERY, GENERATE_INVOICES_MUTATION,
  CONFIRM_INVOICE_PAID_MUTATION,
} from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { statusColor, OrderStatus, RestaurantStatus } from '@/types';
import { formatMoney } from '@/lib/money';
import PlatformTrends from '@/components/admin/PlatformTrends';

// Approval-status chip styling/labels for the super-admin tables.
const APPROVAL_META: Record<RestaurantStatus, { label: string; color: 'success' | 'warning' | 'error' }> = {
  APPROVED: { label: 'Tasdiqlangan', color: 'success' },
  PENDING_REVIEW: { label: 'Ko‘rib chiqilmoqda', color: 'warning' },
  REJECTED: { label: 'Rad etilgan', color: 'error' },
};

// Super-admin panel stays in English — keep its own English status labels
// (the shared statusLabel map is localized to Uzbek for the owner/customer UI).
const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Kutilmoqda',
  PREPARING: 'Tayyorlanmoqda',
  READY: 'Tayyor',
  SERVED: 'Berildi',
  CANCELLED: 'Bekor qilingan',
};

const LOG_ICONS: Record<string, any> = {
  ERROR: <ErrorIcon fontSize="small" color="error" />,
  WARN: <Warning fontSize="small" color="warning" />,
  INFO: <Info fontSize="small" color="info" />,
};

const AdminPage: NextPage = () => {
  const { user } = useRequireAuth(['SUPER_ADMIN']);
  const { logout } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState(0);

  const { data: statsData, loading: statsLoading } = useQuery(PLATFORM_STATS_QUERY, { skip: !user });
  const { data: restData, loading: restLoading, refetch: refetchRests } = useQuery(ADMIN_RESTAURANTS_QUERY, { skip: !user });
  const { data: pendingData, loading: pendingLoading, refetch: refetchPending } = useQuery(PENDING_RESTAURANTS_QUERY, { skip: !user });
  const [logLevel, setLogLevel] = useState<'' | 'ERROR' | 'WARN' | 'INFO'>('');
  const { data: logsData, loading: logsLoading, refetch: refetchLogs } = useQuery(ERROR_LOGS_QUERY, {
    variables: { level: logLevel || undefined },
    skip: !user || tab !== 2,
  });
  const { data: ordersData, loading: ordersLoading } = useQuery(ALL_ORDERS_QUERY, { variables: { limit: 100 }, skip: !user || tab !== 1 });
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(ADMIN_USERS_QUERY, { skip: !user || tab !== 4 });
  const { data: trendsData, loading: trendsLoading } = useQuery(PLATFORM_TIMESERIES_QUERY, { variables: { days: 30 }, skip: !user || tab !== 5 });
  const { data: invoicesData, loading: invoicesLoading, refetch: refetchInvoices } = useQuery(ALL_INVOICES_QUERY, { skip: !user || tab !== 6 });

  const [generateInvoices, { loading: generating }] = useMutation(GENERATE_INVOICES_MUTATION, {
    onCompleted(d) { toast.success(`${d.generateInvoices} ta hisob-faktura yaratildi`); refetchInvoices(); },
    onError(e) { toast.error(e.message); },
  });
  const [confirmInvoice] = useMutation(CONFIRM_INVOICE_PAID_MUTATION, {
    onCompleted() { toast.success('To‘lov tasdiqlandi'); refetchInvoices(); },
    onError(e) { toast.error(e.message); },
  });

  // Reject flow needs a reason, so it's captured via a small dialog.
  const [rejectTarget, setRejectTarget] = useState<{ _id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Reset-password dialog (super admin sets a new password for a staff login).
  const [pwTarget, setPwTarget] = useState<{ _id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Restaurant drill-down, loaded on demand.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [loadDetail, { data: detailData, loading: detailLoading }] = useLazyQuery(ADMIN_RESTAURANT_DETAIL_QUERY);

  const refetchAll = () => { refetchRests(); refetchPending(); };

  const openDetail = (id: string) => {
    setDetailId(id);
    loadDetail({ variables: { restaurantId: id }, fetchPolicy: 'network-only' });
  };

  const [purgeErrorLogs, { loading: purging }] = useMutation(PURGE_ERROR_LOGS_MUTATION, {
    onCompleted(d) { toast.success(`${d.purgeErrorLogs} ta yozuv tozalandi`); refetchLogs(); },
    onError(e) { toast.error(e.message); },
  });

  const [toggleUser] = useMutation(ADMIN_TOGGLE_USER_MUTATION, {
    onCompleted(d) { toast.success(`Hisob ${d.adminToggleUser.isActive ? 'faollashtirildi' : 'o‘chirildi'}`); refetchUsers(); },
    onError(e) { toast.error(e.message); },
  });

  const [resetUserPassword, { loading: resetting }] = useMutation(ADMIN_RESET_USER_PASSWORD_MUTATION, {
    onCompleted() { toast.success('Parol yangilandi'); setPwTarget(null); setNewPassword(''); },
    onError(e) { toast.error(e.message); },
  });

  const [toggleRestaurant] = useMutation(ADMIN_TOGGLE_RESTAURANT_MUTATION, {
    onCompleted(d) {
      toast.success(`Restoran ${d.adminToggleRestaurant.isActive ? 'faollashtirildi' : 'o‘chirildi'}`);
      refetchRests();
    },
    onError(e) { toast.error(e.message); },
  });

  const [approveRestaurant] = useMutation(APPROVE_RESTAURANT_MUTATION, {
    onCompleted() { toast.success('Restoran tasdiqlandi'); refetchAll(); },
    onError(e) { toast.error(e.message); },
  });

  const [rejectRestaurant] = useMutation(REJECT_RESTAURANT_MUTATION, {
    onCompleted() {
      toast.success('Restoran rad etildi');
      setRejectTarget(null);
      setRejectReason('');
      refetchAll();
    },
    onError(e) { toast.error(e.message); },
  });

  const stats = statsData?.platformStats;
  const restaurants = restData?.adminRestaurants ?? [];
  const pending = pendingData?.pendingRestaurants ?? [];
  const logs = logsData?.errorLogs ?? [];
  const orders = ordersData?.allOrders ?? [];
  const users = usersData?.adminUsers ?? [];
  const trends = trendsData?.platformTimeseries ?? [];
  const invoices = invoicesData?.allInvoices ?? [];
  const detail = detailData?.adminRestaurantDetail;

  const lastMonthPeriod = (() => {
    const d = new Date(); d.setDate(0); // last day of previous month
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const handleLogout = () => { logout(); router.push('/login'); };

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <>
      <Head><title>Super admin — Vivora</title></Head>
      <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>

        {/* Admin AppBar */}
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <AdminPanelSettings sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
              Platforma admini
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                {user.name?.charAt(0)}
              </Avatar>
              <Button startIcon={<Logout />} size="small" color="inherit" onClick={handleLogout}>
                Chiqish
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800}>Platforma ko‘rinishi</Typography>
            <Typography color="text.secondary">Barcha restoranlar va platforma faoliyatini kuzating</Typography>
          </Box>

          {/* KPI cards */}
          {statsLoading && <LinearProgress sx={{ mb: 3 }} />}
          <Grid container spacing={3} mb={4}>
            {[
              { label: 'Jami restoranlar', value: stats?.totalRestaurants ?? 0, sub: `${stats?.activeRestaurants ?? 0} faol`, icon: <Store />, color: 'primary' },
              { label: 'Jami foydalanuvchilar', value: stats?.totalUsers ?? 0, icon: <People />, color: 'info' },
              { label: 'Jami buyurtmalar', value: stats?.totalOrders ?? 0, icon: <ShoppingBag />, color: 'warning' },
              { label: 'Umumiy daromad', value: formatMoney(stats?.totalRevenue ?? 0), icon: <TrendingUp />, color: 'success' },
            ].map((kpi) => (
              <Grid item xs={12} sm={6} md={3} key={kpi.label}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" color="text.secondary" mb={0.5}>{kpi.label}</Typography>
                        <Typography variant="h4" fontWeight={800}>{kpi.value}</Typography>
                        {kpi.sub && <Typography variant="caption" color="text.secondary">{kpi.sub}</Typography>}
                      </Box>
                      <Avatar sx={{ bgcolor: `${kpi.color}.light`, color: `${kpi.color}.dark` }}>
                        {kpi.icon}
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {pending.length > 0 && (
            <Alert
              severity="info"
              icon={<HourglassTop />}
              sx={{ mb: 3, borderRadius: 2 }}
              action={<Button color="inherit" size="small" onClick={() => setTab(3)}>Ko‘rib chiqish</Button>}
            >
              <strong>{pending.length}</strong> ta restoran tasdiqlashni kutmoqda.
            </Alert>
          )}

          {stats?.totalErrorLogs > 0 && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              <strong>{stats.totalErrorLogs}</strong> ta xato yozuvi bor. Xatolar jurnali bo‘limini tekshiring.
            </Alert>
          )}

          {/* Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                <Tab label="Restoranlar" />
                <Tab label="So‘nggi buyurtmalar" />
                <Tab label="Xatolar jurnali" />
                <Tab label={<Badge color="warning" badgeContent={pending.length} sx={{ '& .MuiBadge-badge': { right: -14, top: 2 } }}>Tasdiqlash</Badge>} />
                <Tab label="Foydalanuvchilar" />
                <Tab label="Tahlil" />
                <Tab label="To‘lovlar" />
              </Tabs>
            </Box>

            {/* Restaurants Tab */}
            {tab === 0 && (
              <Box sx={{ overflowX: 'auto' }}>
                {restLoading && <LinearProgress />}
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Restoran</TableCell>
                      <TableCell>Slug</TableCell>
                      <TableCell>Tasdiq</TableCell>
                      <TableCell>Faol</TableCell>
                      <TableCell>Buyurtmalar</TableCell>
                      <TableCell>Daromad</TableCell>
                      <TableCell>Yaratilgan</TableCell>
                      <TableCell>Amal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {restaurants.map((r: any) => (
                      <TableRow key={r._id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark', fontSize: '0.875rem' }}>
                              {r.name.charAt(0)}
                            </Avatar>
                            <Button
                              variant="text"
                              onClick={() => openDetail(r._id)}
                              sx={{ p: 0, minWidth: 0, fontWeight: 600, color: 'text.primary', textAlign: 'left', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                            >
                              {r.name}
                            </Button>
                          </Stack>
                        </TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{r.slug}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={(APPROVAL_META[r.status as RestaurantStatus] ?? APPROVAL_META.PENDING_REVIEW).label}
                            color={(APPROVAL_META[r.status as RestaurantStatus] ?? APPROVAL_META.PENDING_REVIEW).color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={r.isActive ? 'Faol' : 'Nofaol'} color={r.isActive ? 'success' : 'default'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{r.orderCount}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatMoney(r.revenue)}</TableCell>
                        <TableCell>{dayjs(r.createdAt).format('MMM D, YYYY')}</TableCell>
                        <TableCell>
                          {r.status === 'APPROVED' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color={r.isActive ? 'error' : 'success'}
                              onClick={() => toggleRestaurant({ variables: { restaurantId: r._id } })}
                            >
                              {r.isActive ? 'O‘chirish' : 'Faollashtirish'}
                            </Button>
                          ) : (
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => approveRestaurant({ variables: { restaurantId: r._id } })}
                              >
                                Tasdiqlash
                              </Button>
                              {r.status !== 'REJECTED' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => setRejectTarget({ _id: r._id, name: r.name })}
                                >
                                  Rad etish
                                </Button>
                              )}
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {restaurants.length === 0 && !restLoading && (
                      <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>Hali restoran yo‘q</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* Orders Tab */}
            {tab === 1 && (
              <Box sx={{ overflowX: 'auto' }}>
                {ordersLoading && <LinearProgress />}
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Buyurtma ID</TableCell>
                      <TableCell>Restoran</TableCell>
                      <TableCell>Stol</TableCell>
                      <TableCell>Taomlar</TableCell>
                      <TableCell>Holati</TableCell>
                      <TableCell>Jami</TableCell>
                      <TableCell>Vaqt</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((o: any) => (
                      <TableRow key={o._id} hover>
                        <TableCell><Typography variant="caption" fontFamily="monospace">{o._id.slice(-8)}</Typography></TableCell>
                        <TableCell>{o.restaurantId?.slice(-6)}</TableCell>
                        <TableCell>{o.tableNumber}-stol</TableCell>
                        <TableCell>{o.items.length} items</TableCell>
                        <TableCell>
                          <Chip label={statusLabel[o.status as OrderStatus]} color={statusColor[o.status as OrderStatus]} size="small" />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatMoney(o.totalAmount)}</TableCell>
                        <TableCell>{dayjs(o.createdAt).format('MMM D, HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && !ordersLoading && (
                      <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>Hali buyurtma yo‘q</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* Error Logs Tab */}
            {tab === 2 && (
              <Box>
                <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ p: 2 }}>
                  <TextField
                    select
                    size="small"
                    label="Daraja"
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value as any)}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="">Barcha darajalar</MenuItem>
                    <MenuItem value="ERROR">Xato</MenuItem>
                    <MenuItem value="WARN">Ogohlantirish</MenuItem>
                    <MenuItem value="INFO">Ma’lumot</MenuItem>
                  </TextField>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteSweep />}
                    disabled={purging || logs.length === 0}
                    onClick={() => {
                      if (window.confirm('7 kundan eski xato yozuvlarini o‘chirasizmi?')) {
                        purgeErrorLogs({ variables: { olderThanDays: 7 } });
                      }
                    }}
                  >
                    7 kundan eski
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    startIcon={<DeleteSweep />}
                    disabled={purging || logs.length === 0}
                    onClick={() => {
                      if (window.confirm('BARCHA xato yozuvlarini o‘chirasizmi? Buni qaytarib bo‘lmaydi.')) {
                        purgeErrorLogs({ variables: { olderThanDays: 0 } });
                      }
                    }}
                  >
                    Hammasini tozalash
                  </Button>
                </Stack>
                <Box sx={{ overflowX: 'auto' }}>
                {logsLoading && <LinearProgress />}
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Daraja</TableCell>
                      <TableCell>Xabar</TableCell>
                      <TableCell>Kontekst</TableCell>
                      <TableCell>Vaqt</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log._id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {LOG_ICONS[log.level]}
                            <Typography variant="caption" fontWeight={700}>{log.level}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.message}
                          </Typography>
                        </TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{log.context}</Typography></TableCell>
                        <TableCell><Typography variant="caption" color="text.secondary">{dayjs(log.createdAt).format('MMM D HH:mm')}</Typography></TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && !logsLoading && (
                      <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 6 }}>
                        <Typography color="text.secondary">Xatolar yo‘q 🎉</Typography>
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                </Box>
              </Box>
            )}

            {/* Approvals Tab — pending restaurants with full profile to review */}
            {tab === 3 && (
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {pendingLoading && <LinearProgress sx={{ mb: 2 }} />}
                <Stack spacing={2}>
                  {pending.map((r: any) => (
                    <Card key={r._id} variant="outlined">
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                              <Avatar src={r.logo || undefined} sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
                                {r.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography fontWeight={700}>{r.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  /{r.slug} · ariza: {dayjs(r.createdAt).format('MMM D, YYYY')}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack spacing={0.5} sx={{ pl: 0.5 }}>
                              <Typography variant="body2"><strong>Tavsif:</strong> {r.description || <em>— ko‘rsatilmagan —</em>}</Typography>
                              <Typography variant="body2"><strong>Manzil:</strong> {r.address || <em>— ko‘rsatilmagan —</em>}</Typography>
                              <Typography variant="body2"><strong>Telefon:</strong> {r.phone || <em>— ko‘rsatilmagan —</em>}</Typography>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1} justifyContent="flex-end">
                              <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => approveRestaurant({ variables: { restaurantId: r._id } })}
                              >
                                Tasdiqlash
                              </Button>
                              <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => setRejectTarget({ _id: r._id, name: r.name })}
                              >
                                Reject
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                  {pending.length === 0 && !pendingLoading && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary">Tasdiqlashni kutayotgan restoran yo‘q 🎉</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {/* Users Tab — all accounts across restaurants */}
            {tab === 4 && (
              <Box sx={{ overflowX: 'auto' }}>
                {usersLoading && <LinearProgress />}
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Foydalanuvchi</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Restoran</TableCell>
                      <TableCell>Holati</TableCell>
                      <TableCell>Qo‘shilgan</TableCell>
                      <TableCell align="right">Amallar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((u: any) => {
                      const isSelf = u._id === (user as any)._id;
                      return (
                        <TableRow key={u._id} hover>
                          <TableCell>
                            <Typography fontWeight={600}>{u.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={u.role.replace('_', ' ').toLowerCase()}
                              size="small"
                              color={u.role === 'SUPER_ADMIN' ? 'secondary' : u.role === 'RESTAURANT_ADMIN' ? 'primary' : 'default'}
                              variant="outlined"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color={u.restaurantName ? 'text.primary' : 'text.disabled'}>
                              {u.restaurantName ?? '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={u.isActive ? 'Faol' : 'O‘chirilgan'} size="small" color={u.isActive ? 'success' : 'default'} variant={u.isActive ? 'filled' : 'outlined'} />
                          </TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{dayjs(u.createdAt).format('MMM D, YYYY')}</Typography></TableCell>
                          <TableCell align="right">
                            <Tooltip title="Parolni tiklash">
                              <IconButton size="small" onClick={() => { setNewPassword(''); setPwTarget({ _id: u._id, name: u.name }); }}>
                                <Key fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isSelf ? 'O‘z hisobingizni o‘chira olmaysiz' : u.isActive ? 'O‘chirish' : 'Faollashtirish'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color={u.isActive ? 'error' : 'success'}
                                  disabled={isSelf}
                                  onClick={() => toggleUser({ variables: { userId: u._id } })}
                                >
                                  {u.isActive ? <Block fontSize="small" /> : <CheckCircleOutline fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {users.length === 0 && !usersLoading && (
                      <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>Foydalanuvchi yo‘q</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* Analytics Tab — platform trends over time */}
            {tab === 5 && (
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {trendsLoading && <LinearProgress sx={{ mb: 2 }} />}
                <PlatformTrends data={trends} />
              </Box>
            )}

            {/* Billing Tab — service-fee invoices */}
            {tab === 6 && (
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Har oy restoran savdosining 0.3% xizmat haqi. Egasi to‘lovni bildirgach, bu yerda tasdiqlang.
                  </Typography>
                  <Button size="small" variant="outlined" disabled={generating} onClick={() => generateInvoices({ variables: { period: lastMonthPeriod } })}>
                    {lastMonthPeriod} uchun yaratish
                  </Button>
                </Stack>
                {invoicesLoading && <LinearProgress />}
                <Box sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Restoran</TableCell>
                        <TableCell>Davr</TableCell>
                        <TableCell>Savdo</TableCell>
                        <TableCell>To‘lov</TableCell>
                        <TableCell>Holati</TableCell>
                        <TableCell align="right">Amal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((inv: any) => {
                        const meta = inv.status === 'PAID'
                          ? { label: 'To‘langan', color: 'success' as const }
                          : inv.status === 'AWAITING_REVIEW'
                            ? { label: 'Tekshirilmoqda', color: 'info' as const }
                            : { label: 'To‘lanmagan', color: 'warning' as const };
                        return (
                          <TableRow key={inv._id} hover>
                            <TableCell><Typography fontWeight={600}>{inv.restaurantName ?? inv.restaurantId?.slice(-6)}</Typography></TableCell>
                            <TableCell>{inv.period}</TableCell>
                            <TableCell>{formatMoney(inv.revenue, inv.currency)}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{formatMoney(inv.amountDue, inv.currency)}</TableCell>
                            <TableCell><Chip label={meta.label} color={meta.color} size="small" /></TableCell>
                            <TableCell align="right">
                              {inv.status !== 'PAID' ? (
                                <Button size="small" variant="contained" color="success" onClick={() => confirmInvoice({ variables: { invoiceId: inv._id } })}>
                                  Tasdiqlash
                                </Button>
                              ) : (
                                <CheckCircle sx={{ color: 'success.main' }} />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {invoices.length === 0 && !invoicesLoading && (
                        <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 5 }}>
                          <Typography color="text.secondary">Hali hisob-faktura yo‘q. Oy uchun yaratib ko‘ring.</Typography>
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}
          </Card>
        </Box>
      </Box>

      {/* Reject reason dialog */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>{rejectTarget?.name}ni rad etasizmi?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Egasi bu sababni ko‘radi va profilini yangilab qayta ariza bera oladi.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Sabab (ixtiyoriy)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="masalan: manzil to‘liq emas, menyu tushunarsiz…"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Bekor qilish</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => rejectTarget && rejectRestaurant({ variables: { restaurantId: rejectTarget._id, reason: rejectReason } })}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!pwTarget} onClose={() => setPwTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Parolni tiklash — {pwTarget?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Bu hisob uchun yangi parol o‘rnating. Uni egasiga xavfsiz yetkazing; u kirgach o‘zgartira oladi.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Yangi parol"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Kamida 6 ta belgi"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwTarget(null)}>Bekor qilish</Button>
          <Button
            variant="contained"
            disabled={resetting || newPassword.length < 6}
            onClick={() => pwTarget && resetUserPassword({ variables: { userId: pwTarget._id, newPassword } })}
          >
            Parolni tiklash
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restaurant drill-down dialog */}
      <Dialog open={!!detailId} onClose={() => setDetailId(null)} fullWidth maxWidth="md">
        {detailLoading && <LinearProgress />}
        {detail && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar src={detail.logo || undefined} sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
                  {detail.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography fontWeight={800}>{detail.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    /{detail.slug} · qo‘shilgan: {dayjs(detail.createdAt).format('MMM D, YYYY')}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <Chip
                  label={(APPROVAL_META[detail.status as RestaurantStatus] ?? APPROVAL_META.PENDING_REVIEW).label}
                  color={(APPROVAL_META[detail.status as RestaurantStatus] ?? APPROVAL_META.PENDING_REVIEW).color}
                  size="small"
                />
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              {/* Count tiles */}
              <Grid container spacing={2} mb={3}>
                {[
                  { label: 'Taomlar', value: detail.menuItemCount },
                  { label: 'Stollar', value: detail.tableCount },
                  { label: 'Buyurtmalar', value: detail.orderCount },
                  { label: 'Daromad', value: formatMoney(detail.revenue, detail.currency) },
                ].map((s) => (
                  <Grid item xs={6} sm={3} key={s.label}>
                    <Card variant="outlined" sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography variant="h6" fontWeight={800}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Profile */}
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Profil</Typography>
              <Stack spacing={0.5} mb={3}>
                <Typography variant="body2"><strong>Tavsif:</strong> {detail.description || <em>— ko‘rsatilmagan —</em>}</Typography>
                <Typography variant="body2"><strong>Manzil:</strong> {detail.address || <em>— ko‘rsatilmagan —</em>}</Typography>
                <Typography variant="body2"><strong>Telefon:</strong> {detail.phone || <em>— ko‘rsatilmagan —</em>}</Typography>
                {detail.status === 'REJECTED' && detail.rejectionReason && (
                  <Typography variant="body2" color="error"><strong>Rad sababi:</strong> {detail.rejectionReason}</Typography>
                )}
              </Stack>

              {/* Staff */}
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Xodimlar ({detail.staff.length})</Typography>
              <Stack spacing={1} mb={3}>
                {detail.staff.map((s: any) => (
                  <Stack key={s._id} direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                    <Chip label={s.role.replace('_', ' ').toLowerCase()} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    {!s.isActive && <Chip label="disabled" size="small" color="default" />}
                  </Stack>
                ))}
                {detail.staff.length === 0 && <Typography variant="body2" color="text.secondary">Xodim hisoblari yo‘q.</Typography>}
              </Stack>

              {/* Recent orders */}
              <Typography variant="subtitle2" fontWeight={700} mb={1}>So‘nggi buyurtmalar</Typography>
              {detail.recentOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Hali buyurtma yo‘q.</Typography>
              ) : (
                <Stack spacing={0.5}>
                  {detail.recentOrders.map((o: any) => (
                    <Stack key={o._id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2">{o.tableNumber}-stol · {o.items.length} ta taom</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={statusLabel[o.status as OrderStatus]} color={statusColor[o.status as OrderStatus]} size="small" />
                        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 70, textAlign: 'right' }}>{formatMoney(o.totalAmount, detail.currency)}</Typography>
                        <Typography variant="caption" color="text.secondary">{dayjs(o.createdAt).format('MMM D HH:mm')}</Typography>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailId(null)}>Yopish</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default AdminPage;
