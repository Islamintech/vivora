import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Grid,
  Avatar, ToggleButton, ToggleButtonGroup, LinearProgress,
} from '@mui/material';
import { TrendingUp, ShoppingBag, Star, TableRestaurant } from '@mui/icons-material';
import dayjs from 'dayjs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ANALYTICS_QUERY } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';

type PeriodKey = '7d' | '30d' | '90d';

const PERIODS: { label: string; key: PeriodKey; days: number }[] = [
  { label: '7 days', key: '7d', days: 7 },
  { label: '30 days', key: '30d', days: 30 },
  { label: '90 days', key: '90d', days: 90 },
];

const AnalyticsPage: NextPage = () => {
  const { user } = useRequireAuth();
  const [period, setPeriod] = useState<PeriodKey>('30d');

  const days = PERIODS.find((p) => p.key === period)?.days ?? 30;
  const periodInput = {
    startDate: dayjs().subtract(days, 'day').toDate(),
    endDate: dayjs().toDate(),
  };

  const { data, loading } = useQuery(ANALYTICS_QUERY, {
    variables: { period: periodInput },
    skip: !user,
  });

  const analytics = data?.analytics;

  const maxRevenue = Math.max(...(analytics?.dailyRevenue?.map((d: any) => d.revenue) ?? [1]));

  return (
    <>
      <Head><title>Analytics — RestoPlatform</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Analytics</Typography>
              <Typography color="text.secondary">Revenue, orders, and performance insights</Typography>
            </Box>
            <ToggleButtonGroup value={period} exclusive onChange={(_, v) => v && setPeriod(v)} size="small">
              {PERIODS.map((p) => <ToggleButton key={p.key} value={p.key}>{p.label}</ToggleButton>)}
            </ToggleButtonGroup>
          </Stack>

          {loading && <LinearProgress sx={{ mb: 3 }} />}

          {/* KPI Cards */}
          <Grid container spacing={3} mb={4}>
            {[
              { label: 'Total Revenue', value: `$${(analytics?.totalRevenue ?? 0).toFixed(2)}`, icon: <TrendingUp />, color: 'success' },
              { label: 'Total Orders', value: analytics?.totalOrders ?? 0, icon: <ShoppingBag />, color: 'primary' },
              { label: 'Avg Order Value', value: `$${(analytics?.averageOrderValue ?? 0).toFixed(2)}`, icon: <TableRestaurant />, color: 'info' },
              { label: 'Orders Served', value: analytics?.servedOrders ?? 0, icon: <Star />, color: 'warning' },
            ].map((kpi) => (
              <Grid item xs={12} sm={6} md={3} key={kpi.label}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" color="text.secondary" mb={0.5}>{kpi.label}</Typography>
                        <Typography variant="h4" fontWeight={800}>{kpi.value}</Typography>
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

          <Grid container spacing={3}>
            {/* Daily Revenue Chart (custom bar chart with divs) */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={3}>Revenue Over Time</Typography>
                  {analytics?.dailyRevenue?.length ? (
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 180, overflowX: 'auto', pb: 1 }}>
                      {analytics.dailyRevenue.map((day: any) => (
                        <Box key={day.date} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28, flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.65rem' }}>
                            ${day.revenue.toFixed(0)}
                          </Typography>
                          <Box
                            sx={{
                              width: '100%',
                              height: `${Math.max(4, (day.revenue / maxRevenue) * 140)}px`,
                              background: 'linear-gradient(180deg, #F97316 0%, #EA580C 100%)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s',
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.6rem', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                            {dayjs(day.date).format('MMM D')}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary">No revenue data for this period</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Popular Items */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>🔥 Top Items</Typography>
                  <Stack spacing={2}>
                    {(analytics?.popularItems ?? []).slice(0, 8).map((item: any, i: number) => (
                      <Box key={item.menuItemId}>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                            #{i + 1} {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                            {item.totalOrdered}×
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (item.totalOrdered / (analytics.popularItems[0]?.totalOrdered || 1)) * 100)}
                          sx={{ height: 5 }}
                          color="primary"
                        />
                      </Box>
                    ))}
                    {!analytics?.popularItems?.length && (
                      <Typography variant="body2" color="text.secondary">No data yet</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Table Turnover */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>📊 Table Turnover</Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Stack direction="row" spacing={2} sx={{ minWidth: 'max-content' }}>
                      {(analytics?.tableTurnover ?? []).map((table: any) => (
                        <Card key={table.tableNumber} variant="outlined" sx={{ minWidth: 140, textAlign: 'center', p: 2 }}>
                          <Typography fontWeight={700} fontSize="1.5rem">{table.tableNumber}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{table.tableName}</Typography>
                          <Typography variant="h6" fontWeight={700} color="primary" mt={1}>
                            ${table.totalRevenue.toFixed(0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{table.totalOrders} orders</Typography>
                        </Card>
                      ))}
                      {!analytics?.tableTurnover?.length && (
                        <Typography variant="body2" color="text.secondary">No table data yet</Typography>
                      )}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default AnalyticsPage;
