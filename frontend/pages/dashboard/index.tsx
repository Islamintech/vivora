import type { NextPage } from 'next';
import Head from 'next/head';
import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Box, Grid, Typography, Stack } from '@mui/material';
import DashboardLayout from '../../libs/components/dashboard/DashboardLayout';
import { ANALYTICS_QUERY, ORDERS_QUERY } from '../../apollo/user/query';
import { useRequireAuth } from '../../libs/hooks/useAuth';
import { formatMoney } from '../../libs/money';
import { useCurrency } from '../../libs/hooks/useCurrency';
import dayjs from 'dayjs';
import {
  StatTile, WeeklyRevenue, RecentOrders, delta, fillDays, todayAndYesterday,
} from '../../libs/components/dashboard/TodayPanel';

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

  const { data: ordersData } = useQuery(ORDERS_QUERY, {
    variables: { limit: 5 },
    skip: !user,
    pollInterval: 30_000,
  });

  const daily = analyticsData?.analytics?.dailyRevenue ?? [];
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

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <WeeklyRevenue days={week} currency={currency} />
            </Grid>
            <Grid item xs={12} md={5}>
              <RecentOrders orders={recentOrders} />
            </Grid>
          </Grid>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default DashboardPage;
