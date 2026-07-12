import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Avatar, Table, TableHead, TableRow, TableCell, TableBody,
  Tab, Tabs, LinearProgress, AppBar, Toolbar, Alert, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  Store, People, ShoppingBag, TrendingUp, AdminPanelSettings,
  Warning, Error as ErrorIcon, Info, Logout, CheckCircle, Cancel,
  HourglassTop,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import {
  PLATFORM_STATS_QUERY, ADMIN_RESTAURANTS_QUERY, ERROR_LOGS_QUERY,
  ALL_ORDERS_QUERY, ADMIN_TOGGLE_RESTAURANT_MUTATION,
  PENDING_RESTAURANTS_QUERY, APPROVE_RESTAURANT_MUTATION, REJECT_RESTAURANT_MUTATION,
} from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { statusColor, OrderStatus, RestaurantStatus } from '@/types';

// Approval-status chip styling/labels for the super-admin tables.
const APPROVAL_META: Record<RestaurantStatus, { label: string; color: 'success' | 'warning' | 'error' }> = {
  APPROVED: { label: 'Approved', color: 'success' },
  PENDING_REVIEW: { label: 'Pending review', color: 'warning' },
  REJECTED: { label: 'Rejected', color: 'error' },
};

// Super-admin panel stays in English — keep its own English status labels
// (the shared statusLabel map is localized to Uzbek for the owner/customer UI).
const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
  CANCELLED: 'Cancelled',
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
  const { data: logsData, loading: logsLoading } = useQuery(ERROR_LOGS_QUERY, { skip: !user || tab !== 2 });
  const { data: ordersData, loading: ordersLoading } = useQuery(ALL_ORDERS_QUERY, { variables: { limit: 100 }, skip: !user || tab !== 1 });

  // Reject flow needs a reason, so it's captured via a small dialog.
  const [rejectTarget, setRejectTarget] = useState<{ _id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const refetchAll = () => { refetchRests(); refetchPending(); };

  const [toggleRestaurant] = useMutation(ADMIN_TOGGLE_RESTAURANT_MUTATION, {
    onCompleted(d) {
      toast.success(`Restaurant ${d.adminToggleRestaurant.isActive ? 'activated' : 'deactivated'}`);
      refetchRests();
    },
    onError(e) { toast.error(e.message); },
  });

  const [approveRestaurant] = useMutation(APPROVE_RESTAURANT_MUTATION, {
    onCompleted() { toast.success('Restaurant approved'); refetchAll(); },
    onError(e) { toast.error(e.message); },
  });

  const [rejectRestaurant] = useMutation(REJECT_RESTAURANT_MUTATION, {
    onCompleted() {
      toast.success('Restaurant rejected');
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

  const handleLogout = () => { logout(); router.push('/login'); };

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <>
      <Head><title>Super Admin — RestoPlatform</title></Head>
      <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>

        {/* Admin AppBar */}
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <AdminPanelSettings sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
              Platform Admin
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                {user.name?.charAt(0)}
              </Avatar>
              <Button startIcon={<Logout />} size="small" color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800}>Platform Overview</Typography>
            <Typography color="text.secondary">Monitor all restaurants and platform activity</Typography>
          </Box>

          {/* KPI cards */}
          {statsLoading && <LinearProgress sx={{ mb: 3 }} />}
          <Grid container spacing={3} mb={4}>
            {[
              { label: 'Total Restaurants', value: stats?.totalRestaurants ?? 0, sub: `${stats?.activeRestaurants ?? 0} active`, icon: <Store />, color: 'primary' },
              { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: <People />, color: 'info' },
              { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: <ShoppingBag />, color: 'warning' },
              { label: 'Total Revenue', value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: <TrendingUp />, color: 'success' },
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
              action={<Button color="inherit" size="small" onClick={() => setTab(3)}>Review</Button>}
            >
              <strong>{pending.length}</strong> restaurant{pending.length > 1 ? 's are' : ' is'} waiting for approval.
            </Alert>
          )}

          {stats?.totalErrorLogs > 0 && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              There are <strong>{stats.totalErrorLogs}</strong> error log entries. Check the Error Logs tab.
            </Alert>
          )}

          {/* Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label="Restaurants" />
                <Tab label="Recent Orders" />
                <Tab label="Error Logs" />
                <Tab label={<Badge color="warning" badgeContent={pending.length} sx={{ '& .MuiBadge-badge': { right: -14, top: 2 } }}>Approvals</Badge>} />
              </Tabs>
            </Box>

            {/* Restaurants Tab */}
            {tab === 0 && (
              <Box sx={{ overflowX: 'auto' }}>
                {restLoading && <LinearProgress />}
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Restaurant</TableCell>
                      <TableCell>Slug</TableCell>
                      <TableCell>Approval</TableCell>
                      <TableCell>Active</TableCell>
                      <TableCell>Orders</TableCell>
                      <TableCell>Revenue</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Action</TableCell>
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
                            <Typography fontWeight={600}>{r.name}</Typography>
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
                          <Chip label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? 'success' : 'default'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{r.orderCount}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>${r.revenue.toFixed(2)}</TableCell>
                        <TableCell>{dayjs(r.createdAt).format('MMM D, YYYY')}</TableCell>
                        <TableCell>
                          {r.status === 'APPROVED' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color={r.isActive ? 'error' : 'success'}
                              onClick={() => toggleRestaurant({ variables: { restaurantId: r._id } })}
                            >
                              {r.isActive ? 'Deactivate' : 'Activate'}
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
                                Approve
                              </Button>
                              {r.status !== 'REJECTED' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => setRejectTarget({ _id: r._id, name: r.name })}
                                >
                                  Reject
                                </Button>
                              )}
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {restaurants.length === 0 && !restLoading && (
                      <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>No restaurants yet</TableCell></TableRow>
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
                      <TableCell>Order ID</TableCell>
                      <TableCell>Restaurant</TableCell>
                      <TableCell>Table</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((o: any) => (
                      <TableRow key={o._id} hover>
                        <TableCell><Typography variant="caption" fontFamily="monospace">{o._id.slice(-8)}</Typography></TableCell>
                        <TableCell>{o.restaurantId?.slice(-6)}</TableCell>
                        <TableCell>Table {o.tableNumber}</TableCell>
                        <TableCell>{o.items.length} items</TableCell>
                        <TableCell>
                          <Chip label={statusLabel[o.status as OrderStatus]} color={statusColor[o.status as OrderStatus]} size="small" />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>${o.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>{dayjs(o.createdAt).format('MMM D, HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && !ordersLoading && (
                      <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>No orders yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* Error Logs Tab */}
            {tab === 2 && (
              <Box>
                {logsLoading && <LinearProgress />}
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Level</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Context</TableCell>
                      <TableCell>Time</TableCell>
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
                        <Typography color="text.secondary">No error logs 🎉</Typography>
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
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
                                  /{r.slug} · applied {dayjs(r.createdAt).format('MMM D, YYYY')}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack spacing={0.5} sx={{ pl: 0.5 }}>
                              <Typography variant="body2"><strong>Description:</strong> {r.description || <em>— not provided —</em>}</Typography>
                              <Typography variant="body2"><strong>Address:</strong> {r.address || <em>— not provided —</em>}</Typography>
                              <Typography variant="body2"><strong>Phone:</strong> {r.phone || <em>— not provided —</em>}</Typography>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} justifyContent="flex-end">
                              <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => approveRestaurant({ variables: { restaurantId: r._id } })}
                              >
                                Approve
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
                      <Typography color="text.secondary">No restaurants awaiting approval 🎉</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}
          </Card>
        </Box>
      </Box>

      {/* Reject reason dialog */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Reject {rejectTarget?.name}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            The owner will see this reason and can update their profile to re-apply.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Incomplete address, unclear menu concept…"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => rejectTarget && rejectRestaurant({ variables: { restaurantId: rejectTarget._id, reason: rejectReason } })}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminPage;
