import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Button,
  Tab, Tabs, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Tooltip, Collapse,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ORDERS_QUERY, UPDATE_ORDER_STATUS_MUTATION } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { Order, OrderStatus, statusColor, statusLabel } from '@/types';

const STATUS_TABS: { label: string; value: OrderStatus | 'ALL' }[] = [
  { label: 'Hammasi', value: 'ALL' },
  { label: '🟡 Kutilmoqda', value: 'PENDING' },
  { label: '🔵 Tayyorlanmoqda', value: 'PREPARING' },
  { label: '🟢 Tayyor', value: 'READY' },
  { label: '✅ Berildi', value: 'SERVED' },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

function OrderRow({ order, onStatusUpdate }: { order: Order; onStatusUpdate: (id: string, status: OrderStatus) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen((p) => !p)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell><Typography fontWeight={600}>{order.tableNumber}-stol</Typography></TableCell>
        <TableCell>
          <Chip
            label={statusLabel[order.status as OrderStatus]}
            color={statusColor[order.status as OrderStatus]}
            size="small"
          />
        </TableCell>
        <TableCell>{order.items.length} ta taom</TableCell>
        <TableCell><Typography fontWeight={600}>${order.totalAmount.toFixed(2)}</Typography></TableCell>
        <TableCell>{dayjs(order.createdAt).format('HH:mm · MMM D')}</TableCell>
        <TableCell>
          {NEXT_STATUS[order.status as OrderStatus] && (
            <Button
              size="small"
              variant="contained"
              onClick={() => onStatusUpdate(order._id, NEXT_STATUS[order.status as OrderStatus]!)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {statusLabel[NEXT_STATUS[order.status as OrderStatus]!]} deb belgilash
            </Button>
          )}
          {order.status === 'PENDING' && (
            <Button
              size="small"
              color="error"
              sx={{ ml: 1 }}
              onClick={() => onStatusUpdate(order._id, 'CANCELLED')}
            >
              Bekor qilish
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, bgcolor: 'background.default' }}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Buyurtma tarkibi</Typography>
              {order.items.map((item, i) => (
                <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2">
                    {item.name} × {item.quantity}
                    {item.notes && <Typography component="span" variant="caption" color="text.secondary"> · {item.notes}</Typography>}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>${(item.price * item.quantity).toFixed(2)}</Typography>
                </Stack>
              ))}
              {order.customerNote && (
                <Box mt={1.5}>
                  <Typography variant="caption" color="text.secondary">Mijoz izohi: </Typography>
                  <Typography variant="body2">{order.customerNote}</Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const OrdersPage: NextPage = () => {
  const { user } = useRequireAuth();
  const [activeTab, setActiveTab] = useState(0);

  const status = STATUS_TABS[activeTab].value;

  const { data, refetch } = useQuery(ORDERS_QUERY, {
    variables: { status: status === 'ALL' ? undefined : status, limit: 100 },
    skip: !user,
    pollInterval: 15000,
  });

  const orders: Order[] = data?.orders ?? [];

  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS_MUTATION, {
    onCompleted() { toast.success('Buyurtma holati yangilandi'); refetch(); },
    onError(e) { toast.error(e.message); },
  });

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    updateStatus({ variables: { input: { orderId, status: newStatus } } });
  };

  return (
    <>
      <Head><title>Buyurtmalar — RestoPlatform</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800}>Buyurtmalar</Typography>
            <Typography color="text.secondary">Barcha kelayotgan buyurtmalarni kuzating va boshqaring</Typography>
          </Box>

          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
                {STATUS_TABS.map((tab) => <Tab key={tab.value} label={tab.label} />)}
              </Tabs>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={48} />
                    <TableCell>Stol</TableCell>
                    <TableCell>Holati</TableCell>
                    <TableCell>Taomlar</TableCell>
                    <TableCell>Jami</TableCell>
                    <TableCell>Vaqt</TableCell>
                    <TableCell>Amal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <OrderRow key={order._id} order={order} onStatusUpdate={handleStatusUpdate} />
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                        <Typography color="text.secondary">Buyurtmalar topilmadi</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default OrdersPage;
