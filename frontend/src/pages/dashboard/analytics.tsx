import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Grid, Avatar,
  ToggleButton, ToggleButtonGroup, LinearProgress, IconButton, Tooltip,
} from '@mui/material';
import {
  TrendingUp, ShoppingBag, Star, TableRestaurant,
  ChevronLeft, ChevronRight,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ANALYTICS_QUERY } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { formatMoney } from '@/lib/money';
import { useCurrency } from '@/hooks/useCurrency';

type View = 'week' | 'month';

// Monday-first Uzbek weekday initials.
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const WEEKDAY_NAMES = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];

// Monday-first weekday index (dayjs .day() is Sunday-first).
const mondayIndex = (d: Dayjs) => (d.day() + 6) % 7;

// Short number for tight calendar cells: 1.2M / 45k / 730.
function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

const AnalyticsPage: NextPage = () => {
  const { user } = useRequireAuth();
  const currency = useCurrency();
  const [view, setView] = useState<View>('week');
  // Which month the calendar shows; always the 1st of the month.
  const [month, setMonth] = useState<Dayjs>(dayjs().startOf('month'));

  // Query period follows the view: trailing 7 days, or the selected month.
  // Memoized: fresh Date objects on every render make Apollo see "new
  // variables" and refetch in an endless loop.
  const periodInput = useMemo(() => {
    // The browser's zone, so the backend groups days by OUR midnight, not UTC.
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (view === 'week') {
      return {
        startDate: dayjs().subtract(6, 'day').startOf('day').toDate(),
        endDate: dayjs().endOf('day').toDate(),
        timezone,
      };
    }
    return {
      startDate: month.startOf('month').toDate(),
      endDate: month.endOf('month').toDate(),
      timezone,
    };
  }, [view, month]);

  const { data, loading } = useQuery(ANALYTICS_QUERY, {
    variables: { period: periodInput },
    skip: !user,
  });
  const analytics = data?.analytics;

  // Revenue keyed by YYYY-MM-DD (days without orders are simply absent).
  const revenueByDate = useMemo(() => {
    const map = new Map<string, { revenue: number; orderCount: number }>();
    (analytics?.dailyRevenue ?? []).forEach((d: any) =>
      map.set(d.date, { revenue: d.revenue, orderCount: d.orderCount }),
    );
    return map;
  }, [analytics]);

  // ── Weekly: exactly 7 days ending today, zero-filled ──
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = dayjs().subtract(6 - i, 'day');
      const rec = revenueByDate.get(d.format('YYYY-MM-DD'));
      return {
        date: d,
        label: WEEKDAYS[mondayIndex(d)],
        revenue: rec?.revenue ?? 0,
        orders: rec?.orderCount ?? 0,
      };
    });
  }, [revenueByDate]);

  const weekMax = Math.max(...weekDays.map((d) => d.revenue), 1);
  const bestWeekDay = weekDays.reduce((a, b) => (b.revenue > a.revenue ? b : a), weekDays[0]);

  // ── Monthly: calendar cells with leading blanks (Monday-first) ──
  const monthDays = useMemo(() => {
    const count = month.daysInMonth();
    return Array.from({ length: count }, (_, i) => {
      const d = month.date(i + 1);
      const rec = revenueByDate.get(d.format('YYYY-MM-DD'));
      return { date: d, revenue: rec?.revenue ?? 0, orders: rec?.orderCount ?? 0 };
    });
  }, [month, revenueByDate]);

  const monthMax = Math.max(...monthDays.map((d) => d.revenue), 0);
  const bestMonthDay = monthMax > 0 ? monthDays.find((d) => d.revenue === monthMax) : undefined;
  const leadingBlanks = mondayIndex(month);
  const atCurrentMonth = month.isSame(dayjs().startOf('month'), 'month');

  // Bars mount at height 0, then a state flip lets CSS grow them (staggered).
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    setGrown(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
    return () => cancelAnimationFrame(id);
  }, [view, data]);

  const topItems = (analytics?.popularItems ?? []).slice(0, 5);
  const topMax = topItems[0]?.totalOrdered || 1;

  const bestDay = view === 'week' ? (bestWeekDay?.revenue ? bestWeekDay : undefined)
    : bestMonthDay && { date: bestMonthDay.date, revenue: bestMonthDay.revenue, orders: bestMonthDay.orders };

  return (
    <>
      <Head><title>Tahlil - Vivora</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Tahlil</Typography>
              <Typography color="text.secondary">Daromad, buyurtmalar va samaradorlik</Typography>
            </Box>
            <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
              <ToggleButton value="week">Hafta</ToggleButton>
              <ToggleButton value="month">Oy</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {loading && <LinearProgress sx={{ mb: 3 }} />}

          {/* KPI Cards */}
          <Grid container spacing={3} mb={4}>
            {[
              { label: 'Umumiy daromad', value: formatMoney(analytics?.totalRevenue ?? 0, currency), icon: <TrendingUp />, color: 'success' },
              { label: 'Umumiy buyurtmalar', value: analytics?.totalOrders ?? 0, icon: <ShoppingBag />, color: 'primary' },
              { label: 'O‘rtacha buyurtma', value: formatMoney(analytics?.averageOrderValue ?? 0, currency), icon: <TableRestaurant />, color: 'info' },
              { label: 'Berilgan buyurtmalar', value: analytics?.servedOrders ?? 0, icon: <Star />, color: 'warning' },
            ].map((kpi) => (
              <Grid item xs={12} sm={6} md={3} key={kpi.label}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box minWidth={0}>
                        <Typography variant="body2" color="text.secondary" mb={0.5}>{kpi.label}</Typography>
                        <Typography variant="h4" fontWeight={800} noWrap>{kpi.value}</Typography>
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
            {/* Revenue chart: weekly bars or monthly calendar */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2.5}>
                    <Typography variant="h6" fontWeight={700}>
                      {view === 'week' ? 'Haftalik daromad' : 'Oylik daromad'}
                    </Typography>
                    {view === 'month' && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <IconButton size="small" onClick={() => setMonth((m) => m.subtract(1, 'month'))} aria-label="Oldingi oy">
                          <ChevronLeft />
                        </IconButton>
                        <Typography fontWeight={700} sx={{ minWidth: 110, textAlign: 'center' }}>
                          {MONTHS[month.month()]} {month.year()}
                        </Typography>
                        <IconButton size="small" disabled={atCurrentMonth} onClick={() => setMonth((m) => m.add(1, 'month'))} aria-label="Keyingi oy">
                          <ChevronRight />
                        </IconButton>
                      </Stack>
                    )}
                  </Stack>

                  {view === 'week' ? (
                    /* ── 7-day animated bar chart ── */
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 1, sm: 2 }, height: 230, pt: 3 }}>
                      {weekDays.map((day, i) => {
                        const isBest = day.revenue > 0 && day.date.isSame(bestWeekDay.date, 'day');
                        const target = Math.max(6, (day.revenue / weekMax) * 160);
                        return (
                          <Tooltip
                            key={day.date.format('YYYY-MM-DD')}
                            title={`${WEEKDAY_NAMES[mondayIndex(day.date)]}: ${formatMoney(day.revenue, currency)} · ${day.orders} ta buyurtma`}
                          >
                            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: 'default' }}>
                              <Typography variant="caption" sx={{ mb: 0.5, fontSize: '0.62rem', fontWeight: isBest ? 700 : 500, color: isBest ? 'text.primary' : 'text.secondary', opacity: grown ? 1 : 0, transition: 'opacity .35s ease', transitionDelay: `${i * 45 + 220}ms`, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {compactNum(day.revenue)}
                              </Typography>
                              {/* The peak day is marked by a deeper fill, not an ornament. */}
                              <Box
                                sx={{
                                  width: '100%', maxWidth: 44,
                                  height: grown ? `${target}px` : '4px',
                                  bgcolor: isBest ? '#C2410C' : 'rgba(249,115,22,0.55)',
                                  borderRadius: '4px 4px 0 0',
                                  transition: 'height .55s ease-out',
                                  transitionDelay: `${i * 45}ms`,
                                }}
                              />
                              <Typography variant="caption" sx={{ mt: 0.75, fontWeight: isBest ? 700 : 500, color: isBest ? 'text.primary' : 'text.secondary' }}>
                                {day.label}
                              </Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                                {day.date.format('D/M')}
                              </Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  ) : (
                    /* ── Month calendar with per-day income ── */
                    <Box sx={{ overflowX: 'auto' }}>
                      <Box sx={{ minWidth: 330 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75, mb: 0.75 }}>
                          {WEEKDAYS.map((w) => (
                            <Typography key={w} variant="caption" fontWeight={700} color="text.secondary" textAlign="center">
                              {w}
                            </Typography>
                          ))}
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75 }}>
                          {Array.from({ length: leadingBlanks }).map((_, i) => <Box key={`b${i}`} />)}
                          {monthDays.map((day, i) => {
                            const isBest = monthMax > 0 && day.revenue === monthMax;
                            const isToday = day.date.isSame(dayjs(), 'day');
                            const isFuture = day.date.isAfter(dayjs(), 'day');
                            const heat = monthMax > 0 ? day.revenue / monthMax : 0;
                            return (
                              <Tooltip
                                key={day.date.format('YYYY-MM-DD')}
                                title={`${day.date.format('D')}-${MONTHS[day.date.month()].toLowerCase()}: ${formatMoney(day.revenue, currency)} · ${day.orders} ta buyurtma`}
                              >
                                <Box
                                  sx={{
                                    borderRadius: 1.5, px: 0.5, py: 0.75, textAlign: 'center', minHeight: 52,
                                    border: '1px solid',
                                    // Peak day reads through a heavier border + deepest fill.
                                    borderColor: isBest ? '#C2410C' : isToday ? 'primary.main' : 'divider',
                                    bgcolor: heat > 0 ? `rgba(249,115,22,${0.05 + heat * 0.22})` : 'transparent',
                                    opacity: grown ? (isFuture ? 0.45 : 1) : 0,
                                    transition: 'opacity .3s ease',
                                    transitionDelay: `${i * 8}ms`,
                                    cursor: 'default',
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: isBest || isToday ? 700 : 500, display: 'block', lineHeight: 1.4 }}>
                                    {day.date.date()}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: isBest ? 700 : 600, color: day.revenue > 0 ? '#C2410C' : 'text.disabled', display: 'block' }}>
                                    {day.revenue > 0 ? compactNum(day.revenue) : isFuture ? '' : '-'}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* Peak-day summary line */}
                  {bestDay && (
                    <Stack
                      direction="row" alignItems="baseline" justifyContent="space-between"
                      flexWrap="wrap" gap={1}
                      sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Eng daromadli kun
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {view === 'week'
                          ? WEEKDAY_NAMES[mondayIndex(bestDay.date)]
                          : `${bestDay.date.date()}-${MONTHS[bestDay.date.month()].toLowerCase()}`}
                        {' · '}{formatMoney(bestDay.revenue, currency)}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {' · '}{bestDay.orders} ta buyurtma
                        </Typography>
                      </Typography>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Top 5 foods */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant="h6" fontWeight={700} mb={2}>Eng ko‘p sotilgan 5 ta taom</Typography>
                  <Stack spacing={2} sx={{ flex: 1 }}>
                    {topItems.map((item: any, i: number) => (
                      <Box key={item.menuItemId}>
                        <Stack direction="row" alignItems="center" spacing={1.25} mb={0.75}>
                          <Typography variant="caption" sx={{ fontWeight: 700, width: 16, textAlign: 'right', color: 'text.disabled', flexShrink: 0 }}>
                            {i + 1}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                            {item.totalOrdered}× · {formatMoney(item.revenue, currency)}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={grown ? Math.min(100, (item.totalOrdered / topMax) * 100) : 0}
                          sx={{
                            height: 5, borderRadius: 1, ml: '28px',
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': { borderRadius: 1, transition: `transform .5s ease-out ${i * 60}ms`, bgcolor: i === 0 ? '#C2410C' : 'rgba(249,115,22,0.55)' },
                          }}
                        />
                      </Box>
                    ))}
                    {!topItems.length && (
                      <Typography variant="body2" color="text.secondary">Hali ma’lumot yo‘q</Typography>
                    )}
                  </Stack>
                  {topItems.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'block' }}>
                      Ushbu taomlar mijozlar menyusida avtomatik tavsiya qilinadi.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Table Turnover */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>Stollar aylanmasi</Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Stack direction="row" spacing={2} sx={{ minWidth: 'max-content' }}>
                      {(analytics?.tableTurnover ?? []).map((table: any) => (
                        <Card key={table.tableNumber} variant="outlined" sx={{ minWidth: 140, textAlign: 'center', p: 2 }}>
                          <Typography fontWeight={700} fontSize="1.5rem">{table.tableNumber}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{table.tableName}</Typography>
                          <Typography variant="h6" fontWeight={700} color="primary" mt={1}>
                            {formatMoney(table.totalRevenue, currency)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{table.totalOrders} ta buyurtma</Typography>
                        </Card>
                      ))}
                      {!analytics?.tableTurnover?.length && (
                        <Typography variant="body2" color="text.secondary">Hali stol ma’lumoti yo‘q</Typography>
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
