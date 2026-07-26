import type { NextPage } from 'next';
import Head from 'next/head';
import { useQuery } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Chip,
  Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import dayjs from 'dayjs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ORDERS_QUERY } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { Order } from '@/types';
import { formatMoney } from '@/lib/money';
import { useCurrency } from '@/hooks/useCurrency';

/** "2× Palov, 1× Lag'mon" - what the order actually was. */
const summarise = (order: Order) =>
  order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ');

function TakeOut({ order }: { order: Order }) {
  if (order.orderType !== 'TAKE_OUT') return null;
  return <Chip label="Olib ketish" size="small" color="secondary" sx={{ height: 20, fontSize: '0.68rem', flexShrink: 0 }} />;
}

function OrderRow({ order }: { order: Order }) {
  const currency = useCurrency();
  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography fontWeight={600}>{order.tableNumber}-stol</Typography>
          <TakeOut order={order} />
        </Stack>
      </TableCell>
      <TableCell sx={{ maxWidth: 420 }}>
        <Typography variant="body2">{summarise(order)}</Typography>
        {order.customerNote && (
          <Typography variant="caption" color="text.secondary">Izoh: {order.customerNote}</Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography fontWeight={700}>{formatMoney(order.totalAmount, currency)}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {dayjs(order.createdAt).format('HH:mm · MMM D')}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function OrderCardMobile({ order }: { order: Order }) {
  const currency = useCurrency();
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} fontSize="1.05rem">{order.tableNumber}-stol</Typography>
            <TakeOut order={order} />
          </Stack>
          <Typography fontWeight={700} flexShrink={0}>{formatMoney(order.totalAmount, currency)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">{summarise(order)}</Typography>
        {order.customerNote && (
          <Typography variant="caption" color="text.secondary" display="block">Izoh: {order.customerNote}</Typography>
        )}
        <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
          {dayjs(order.createdAt).format('HH:mm · MMM D')}
        </Typography>
      </CardContent>
    </Card>
  );
}

/**
 * Served orders only - what was ordered, what it cost, when.
 *
 * Deliberately not a workflow screen: statuses advance on their own and the
 * kitchen display is where staff act on an order in progress. By the time an
 * owner looks here, the question left is what went out and for how much.
 */
const OrdersPage: NextPage = () => {
  const { user } = useRequireAuth();
  const currency = useCurrency();

  const { data } = useQuery(ORDERS_QUERY, {
    variables: { status: 'SERVED', limit: 100 },
    skip: !user,
    pollInterval: 15000,
  });

  const orders: Order[] = data?.orders ?? [];
  const total = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <>
      <Head><title>Buyurtmalar - Vivora</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={4}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Buyurtmalar</Typography>
              <Typography color="text.secondary">Berilgan buyurtmalar</Typography>
            </Box>
            {orders.length > 0 && (
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {orders.length} ta buyurtma
                </Typography>
                <Typography variant="h6" fontWeight={800}>{formatMoney(total, currency)}</Typography>
              </Box>
            )}
          </Stack>

          <Card>
            {/* Table on desktop, stacked cards on phones and tablets. */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Stol</TableCell>
                    <TableCell>Taomlar</TableCell>
                    <TableCell>Jami</TableCell>
                    <TableCell>Vaqt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => <OrderRow key={order._id} order={order} />)}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 6 }}>
                        <Typography color="text.secondary">Hali berilgan buyurtma yo‘q.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
            <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' }, p: 2 }}>
              {orders.map((order) => <OrderCardMobile key={order._id} order={order} />)}
              {orders.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
                  Hali berilgan buyurtma yo‘q.
                </Typography>
              )}
            </Stack>
          </Card>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default OrdersPage;
