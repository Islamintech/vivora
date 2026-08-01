import { Box, Card, CardContent, Typography, Stack, Tooltip, Skeleton } from '@mui/material';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import dayjs from 'dayjs';
import { formatMoney } from '../../money';

// One hue, two steps: every bar is the brand orange and the best day is the
// darker step of the same hue. A second hue for the peak (the obvious choice,
// amber) fails the normal-vision separation floor against orange - readers
// can't reliably tell the two apart, colour vision or not.
const BAR = '#FD6511';
const BAR_PEAK = '#B03D02';

// dayjs ships English day names; the rest of this dashboard is Uzbek. Indexed
// by dayjs().day(), so Sunday first.
const UZ_DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export interface DayRevenue {
  date: string;        // "YYYY-MM-DD"
  revenue: number;
  orderCount: number;
}

/** Percent change, or null when there's no baseline to compare against. */
function delta(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <Box sx={{ height: 20 }} />;
  const up = value >= 0;
  return (
    <Stack direction="row" alignItems="center" sx={{ height: 20 }}>
      {up ? (
        <ArrowDropUp sx={{ fontSize: 20, color: 'success.main' }} />
      ) : (
        <ArrowDropDown sx={{ fontSize: 20, color: 'error.main' }} />
      )}
      <Typography variant="caption" fontWeight={700} color={up ? 'success.main' : 'error.main'}>
        {up ? '+' : ''}{value.toFixed(0)}%
      </Typography>
      <Typography variant="caption" color="text.secondary" ml={0.75}>
        kechagiga nisbatan
      </Typography>
    </Stack>
  );
}

function StatTile({ label, value, deltaPct, loading }: {
  label: string; value: string; deltaPct: number | null; loading?: boolean;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%', bgcolor: '#FEF6EF',
        border: '1px solid', borderColor: '#F6E3D2', borderRadius: 4,
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.75}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton width="60%" height={40} sx={{ mx: 'auto' }} />
        ) : (
          <Typography variant="h4" fontWeight={800} noWrap>{value}</Typography>
        )}
        <Stack alignItems="center" mt={0.5}><Delta value={deltaPct} /></Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Weekly revenue as bars. Hand-rolled rather than a chart library: seven values
 * with no axis to speak of, and this way the bars keep the dashboard's own
 * radius and spacing.
 */
function WeeklyRevenue({ days, currency }: { days: DayRevenue[]; currency: string }) {
  const max = Math.max(...days.map((d) => d.revenue), 0);
  const peak = max > 0 ? days.findIndex((d) => d.revenue === max) : -1;

  return (
    <Card
      elevation={0}
      sx={{ height: '100%', bgcolor: '#FEF6EF', border: '1px solid', borderColor: '#F6E3D2', borderRadius: 4 }}
    >
      <CardContent>
        <Typography variant="body2" color="text.secondary" fontWeight={600} textAlign="center" mb={2}>
          Haftalik daromad
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: 160, px: 0.5 }}>
          {days.map((d, i) => {
            // Anchored to the baseline; a day with sales always shows a sliver
            // so "a little" never looks like "nothing".
            const pct = max > 0 ? (d.revenue / max) * 100 : 0;
            const height = d.revenue > 0 ? Math.max(pct, 4) : 0;
            return (
              <Tooltip
                key={d.date}
                arrow
                placement="top"
                title={
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" display="block" fontWeight={700}>
                      {UZ_DAYS[dayjs(d.date).day()]}, {dayjs(d.date).format('DD.MM')}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {formatMoney(d.revenue, currency)}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {d.orderCount} ta buyurtma
                    </Typography>
                  </Box>
                }
              >
                <Box
                  sx={{
                    flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end',
                    cursor: 'default', minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: `${height}%`,
                      minHeight: d.revenue > 0 ? 6 : 0,
                      bgcolor: i === peak ? BAR_PEAK : BAR,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height .35s ease, background-color .2s ease',
                      '&:hover': { opacity: 0.85 },
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Day labels double as the relief for the bars' contrast against the
            card, which sits just under 3:1. */}
        <Box sx={{ display: 'flex', gap: '6px', mt: 1, px: 0.5 }}>
          {days.map((d) => (
            <Typography
              key={d.date}
              variant="caption"
              color="text.secondary"
              sx={{ flex: 1, textAlign: 'center', fontSize: '0.68rem', minWidth: 0 }}
            >
              {UZ_DAYS[dayjs(d.date).day()]}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export interface RecentOrder {
  _id: string;
  tableNumber: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card
      elevation={0}
      sx={{ height: '100%', bgcolor: '#FEF6EF', border: '1px solid', borderColor: '#F6E3D2', borderRadius: 4 }}
    >
      <CardContent>
        <Typography variant="body2" color="text.secondary" fontWeight={600} textAlign="center" mb={2}>
          So‘nggi buyurtmalar
        </Typography>
        <Stack spacing={1.25}>
          {orders.map((o) => (
            <Box
              key={o._id}
              sx={{ bgcolor: '#fff', borderRadius: 3, px: 2, py: 1.5, border: '1px solid #F6E3D2' }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                <Typography fontWeight={800} fontSize="0.95rem" noWrap>
                  {o.tableNumber}-stol
                </Typography>
                <Typography variant="caption" color="text.secondary" flexShrink={0}>
                  {dayjs(o.createdAt).format('HH:mm')}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {o.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
              </Typography>
            </Box>
          ))}
          {!orders.length && (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
              Bugun hali buyurtma yo‘q.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export { StatTile, WeeklyRevenue, RecentOrders, delta };

/** Last `count` days ending today, with missing days filled in as zero. */
export function fillDays(daily: DayRevenue[], count = 7): DayRevenue[] {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  return Array.from({ length: count }, (_, i) => {
    const date = dayjs().subtract(count - 1 - i, 'day').format('YYYY-MM-DD');
    return byDate.get(date) ?? { date, revenue: 0, orderCount: 0 };
  });
}

/** Today's and yesterday's rows, for the headline figures. */
export function todayAndYesterday(daily: DayRevenue[]) {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const blank = (date: string) => ({ date, revenue: 0, orderCount: 0 });
  const t = dayjs().format('YYYY-MM-DD');
  const y = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  return { today: byDate.get(t) ?? blank(t), yesterday: byDate.get(y) ?? blank(y) };
}
