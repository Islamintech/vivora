import type { NextPage } from 'next';
import Head from 'next/head';
import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Stack,
  Chip, Skeleton, Avatar, LinearProgress,
} from '@mui/material';
import {
  TrendingUp, ShoppingBag, TableRestaurant, Star,
} from '@mui/icons-material';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ANALYTICS_QUERY, FEEDBACK_SUMMARY_QUERY } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { formatMoney } from '@/lib/money';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';
import { statusColor, statusLabel } from '@/types';

// All four cards must render at the same height, so the card fills its grid
// cell and the label/value/sub block stretches inside it.
const StatCard = ({ label, value, icon, color, sub }: any) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ height: '100%', display: 'flex' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500} mb={0.5}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} noWrap>{value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 0.5 }}>
            {sub ?? ' '}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, width: 48, height: 48, flexShrink: 0 }}>
          {icon}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

const DashboardPage: NextPage = () => {
  const { user } = useRequireAuth();
  const currency = useCurrency();

  // Memoized: fresh Date objects on every render make Apollo see "new
  // variables" and refetch in an endless loop.
  const period = useMemo(
    () => ({
      startDate: dayjs().subtract(30, 'day').startOf('day').toDate(),
      endDate: dayjs().endOf('day').toDate(),
    }),
    [],
  );

  const { data: analyticsData, loading: aLoading } = useQuery(ANALYTICS_QUERY, {
    variables: { period },
    skip: !user,
  });

  const { data: feedbackData } = useQuery(FEEDBACK_SUMMARY_QUERY, { skip: !user });

  const analytics = analyticsData?.analytics;
  const feedbackSummary = feedbackData?.feedbackSummary;

  if (!user) return null;

  return (
    <>
      <Head><title>Boshqaruv paneli - Vivora</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800}>Xush kelibsiz 👋</Typography>
            <Typography color="text.secondary">Bugun restoraningizda nimalar bo‘layotganiga bir nazar tashlang.</Typography>
          </Box>

          {/* Stat cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              {aLoading ? <Skeleton variant="rounded" height={130} /> : (
                <StatCard
                  label="Umumiy daromad (30 kun)"
                  value={formatMoney(analytics?.totalRevenue ?? 0, currency)}
                  icon={<TrendingUp />}
                  color="success"
                  sub={`${analytics?.totalOrders ?? 0} ta buyurtma`}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {aLoading ? <Skeleton variant="rounded" height={130} /> : (
                <StatCard
                  label="Bugungi buyurtmalar"
                  value={analytics?.totalOrders ?? 0}
                  icon={<ShoppingBag />}
                  color="primary"
                  sub={`${analytics?.pendingOrders ?? 0} ta kutilmoqda`}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {aLoading ? <Skeleton variant="rounded" height={130} /> : (
                <StatCard
                  label="O‘rtacha buyurtma summasi"
                  value={formatMoney(analytics?.averageOrderValue ?? 0, currency)}
                  icon={<TableRestaurant />}
                  color="info"
                  sub="So‘nggi 30 kun"
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Mijozlar bahosi"
                value={feedbackSummary ? `${feedbackSummary.averageRating.toFixed(1)} ★` : '-'}
                icon={<Star />}
                color="warning"
                sub={`${feedbackSummary?.totalCount ?? 0} ta sharh`}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Popular items */}
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>🔥 Mashhur taomlar</Typography>
                  {aLoading && <LinearProgress sx={{ mb: 2 }} />}
                  <Stack spacing={2}>
                    {(analytics?.popularItems ?? []).slice(0, 6).map((item: any, i: number) => (
                      <Box key={item.menuItemId}>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            #{i + 1} {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.totalOrdered} marta
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (item.totalOrdered / (analytics?.popularItems?.[0]?.totalOrdered || 1)) * 100)}
                          sx={{ height: 6 }}
                          color="primary"
                        />
                      </Box>
                    ))}
                    {(!analytics?.popularItems?.length) && (
                      <Typography variant="body2" color="text.secondary">Bu davrda hali buyurtma yo‘q.</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Table turnover */}
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>📊 Stollar faolligi</Typography>
                  <Stack spacing={1.5}>
                    {(analytics?.tableTurnover ?? []).slice(0, 6).map((table: any) => (
                      <Stack key={table.tableNumber} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={600}>{table.tableName}</Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip label={`${table.totalOrders} ta buyurtma`} size="small" variant="outlined" />
                          <Chip label={formatMoney(table.totalRevenue, currency)} size="small" color="primary" variant="outlined" />
                        </Stack>
                      </Stack>
                    ))}
                    {(!analytics?.tableTurnover?.length) && (
                      <Typography variant="body2" color="text.secondary">Hali stol faolligi yo‘q.</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent feedback */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>💬 So‘nggi sharhlar</Typography>
                  <Stack spacing={2}>
                    {(feedbackSummary?.recent ?? []).map((fb: any) => (
                      <Box key={fb._id} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Stack direction="row" spacing={0.5}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Typography key={i} sx={{ color: i < fb.rating ? '#F59E0B' : '#E2E8F0', fontSize: 16 }}>★</Typography>
                            ))}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {fb.tableNumber}-stol · {dayjs(fb.createdAt).fromNow?.() ?? dayjs(fb.createdAt).format('MMM D')}
                          </Typography>
                        </Stack>
                        {fb.comment && <Typography variant="body2" color="text.secondary">{fb.comment}</Typography>}
                      </Box>
                    ))}
                    {(!feedbackSummary?.recent?.length) && (
                      <Typography variant="body2" color="text.secondary">Hali sharh yo‘q.</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default DashboardPage;
