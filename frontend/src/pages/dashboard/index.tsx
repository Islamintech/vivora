import type { NextPage } from 'next';
import Head from 'next/head';
import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Stack,
  Chip, LinearProgress,
} from '@mui/material';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ANALYTICS_QUERY, FEEDBACK_SUMMARY_QUERY, ORDERS_QUERY } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { formatMoney } from '@/lib/money';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';
import {
  StatTile, WeeklyRevenue, RecentOrders, delta, fillDays, todayAndYesterday,
} from '@/components/dashboard/TodayPanel';

const DashboardPage: NextPage = () => {
  const { user } = useRequireAuth();
  const currency = useCurrency();

  // Memoized: fresh Date objects on every render make Apollo see "new
  // variables" and refetch in an endless loop. The viewer's own timezone so
  // "today" means their midnight, not UTC's.
  const period = useMemo(
    () => ({
      startDate: dayjs().subtract(30, 'day').startOf('day').toDate(),
      endDate: dayjs().endOf('day').toDate(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    [],
  );

  // Polled, which is what makes the "Jonli" badge honest.
  const { data: analyticsData, loading: aLoading } = useQuery(ANALYTICS_QUERY, {
    variables: { period },
    skip: !user,
    pollInterval: 60_000,
  });

  const { data: feedbackData } = useQuery(FEEDBACK_SUMMARY_QUERY, { skip: !user });

  const { data: ordersData } = useQuery(ORDERS_QUERY, {
    variables: { limit: 5 },
    skip: !user,
    pollInterval: 30_000,
  });

  const analytics = analyticsData?.analytics;
  const feedbackSummary = feedbackData?.feedbackSummary;

  const daily = analytics?.dailyRevenue ?? [];
  const week = useMemo(() => fillDays(daily, 7), [daily]);
  const { today, yesterday } = useMemo(() => todayAndYesterday(daily), [daily]);

  // Average cheque is derived, so it needs its own comparison rather than
  // inheriting either of the other two deltas.
  const todayAvg = today.orderCount ? today.revenue / today.orderCount : 0;
  const yestAvg = yesterday.orderCount ? yesterday.revenue / yesterday.orderCount : 0;

  const recentOrders = (ordersData?.orders ?? []).slice(0, 3);

  if (!user) return null;

  return (
    <>
      <Head><title>Boshqaruv paneli - Vivora</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={800}>Bugungi ko‘rsatkichlar</Typography>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.35 },
                  },
                }}
              />
              <Typography variant="body2" color="success.main" fontWeight={700}>Jonli</Typography>
            </Stack>
          </Stack>

          {/* Today at a glance, each figure against the same one yesterday */}
          <Grid container spacing={2.5} mb={2.5}>
            <Grid item xs={12} sm={4}>
              <StatTile
                label="Daromad"
                value={formatMoney(today.revenue, currency)}
                deltaPct={delta(today.revenue, yesterday.revenue)}
                loading={aLoading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatTile
                label="Buyurtmalar"
                value={String(today.orderCount)}
                deltaPct={delta(today.orderCount, yesterday.orderCount)}
                loading={aLoading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatTile
                label="O‘rtacha chek"
                value={formatMoney(todayAvg, currency)}
                deltaPct={delta(todayAvg, yestAvg)}
                loading={aLoading}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5} mb={4}>
            <Grid item xs={12} md={7}>
              <WeeklyRevenue days={week} currency={currency} />
            </Grid>
            <Grid item xs={12} md={5}>
              <RecentOrders orders={recentOrders} />
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
