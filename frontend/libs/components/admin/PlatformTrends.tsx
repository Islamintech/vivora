import { useState } from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { formatMoney } from '../../money';

export interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
  signups: number;
}

// Small-multiple trend chart: one single-series area+line per measure. Three
// measures of different scales must never share a y-axis, so each gets its own
// chart and its own hue. Single series ⇒ no legend, no categorical CVD concern.
function TrendChart({
  points,
  color,
  fmt,
}: {
  points: { date: string; value: number }[];
  color: string;
  fmt: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 320;
  const H = 96;
  const padY = 8;
  const max = Math.max(1, ...points.map((p) => p.value));
  const n = points.length;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - padY - (v / max) * (H - padY * 2);

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ');
  const areaPath =
    n > 0
      ? `M 0 ${H} ${points.map((p, i) => `L ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')} L ${W} ${H} Z`
      : '';

  const gradId = `grad-${color.replace('#', '')}`;
  const active = hover != null ? points[hover] : null;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round((rel / W) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        component="svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        sx={{ width: '100%', height: 96, display: 'block', cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {active && (
          <>
            <line
              x1={x(hover!)}
              y1={0}
              x2={x(hover!)}
              y2={H}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              opacity={0.5}
            />
            <circle cx={x(hover!)} cy={y(active.value)} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          </>
        )}
      </Box>
      {active && (
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            left: `${(x(hover!) / W) * 100}%`,
            transform: 'translate(-50%, -100%)',
            bgcolor: 'rgba(15,23,42,0.92)',
            color: '#fff',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 2,
          }}
        >
          <Typography variant="caption" component="div" fontWeight={700}>{fmt(active.value)}</Typography>
          <Typography variant="caption" component="div" sx={{ opacity: 0.7 }}>
            {new Date(active.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function TrendCard({
  title,
  total,
  points,
  color,
  fmt,
}: {
  title: string;
  total: string;
  points: { date: string; value: number }[];
  color: string;
  fmt: (n: number) => string;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
        <Typography variant="h5" fontWeight={800} mb={1.5}>{total}</Typography>
        <TrendChart points={points} color={color} fmt={fmt} />
      </CardContent>
    </Card>
  );
}

export default function PlatformTrends({ data }: { data: TrendPoint[] }) {
  if (!data.length) {
    return <Typography color="text.secondary">No trend data yet.</Typography>;
  }

  // Platform revenue is cross-restaurant; format with the app default (kr).
  const money = (n: number) => formatMoney(n);
  const count = (n: number) => `${n}`;

  const sum = (key: keyof TrendPoint) =>
    data.reduce((s, p) => s + (p[key] as number), 0);

  const span = `${new Date(data[0].date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(data[data.length - 1].date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;

  return (
    <Box>
      <Typography variant="h6" fontWeight={800}>Platform trends</Typography>
      <Typography variant="caption" color="text.secondary">Last {data.length} days · {span}</Typography>
      <Grid container spacing={2} mt={0.5}>
        <Grid item xs={12} md={4}>
          <TrendCard
            title="Revenue"
            total={money(sum('revenue'))}
            points={data.map((p) => ({ date: p.date, value: p.revenue }))}
            color="#22C55E"
            fmt={money}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TrendCard
            title="Orders"
            total={count(sum('orders'))}
            points={data.map((p) => ({ date: p.date, value: p.orders }))}
            color="#FD6511"
            fmt={count}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TrendCard
            title="New signups"
            total={count(sum('signups'))}
            points={data.map((p) => ({ date: p.date, value: p.signups }))}
            color="#3B82F6"
            fmt={count}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
