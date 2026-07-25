import type { NextPage } from 'next';
import Head from 'next/head';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Button, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, Alert, Tooltip,
} from '@mui/material';
import { AccountBalance, ContentCopy, CheckCircle, Info } from '@mui/icons-material';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { MY_BILLING_QUERY, REPORT_INVOICE_PAID_MUTATION } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { formatMoney } from '@/lib/money';

const STATUS: Record<string, { label: string; color: 'warning' | 'info' | 'success' }> = {
  PENDING: { label: 'To‘lanmagan', color: 'warning' },
  AWAITING_REVIEW: { label: 'Tekshirilmoqda', color: 'info' },
  PAID: { label: 'To‘langan', color: 'success' },
};

const BillingPage: NextPage = () => {
  const { user } = useRequireAuth();
  const { data, refetch } = useQuery(MY_BILLING_QUERY, { skip: !user });
  const b = data?.myBilling;

  const [reportPaid, { loading: reporting }] = useMutation(REPORT_INVOICE_PAID_MUTATION, {
    onCompleted() { toast.success('To‘lov haqida xabar berildi. Tasdiqlashni kuting.'); refetch(); },
    onError(e) { toast.error(e.message); },
  });

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success('Nusxa olindi'));
  };

  const invoices = b?.invoices ?? [];
  const cur = b?.currency || 'KRW';

  return (
    <>
      <Head><title>To‘lov — Vivora</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900 }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800}>Xizmat uchun to‘lov</Typography>
            <Typography color="text.secondary">
              Vivora buyurtmalaringizdan {b ? (b.feeRate * 100).toFixed(1) : '0.3'}% xizmat haqi oladi.
            </Typography>
          </Box>

          {/* Current amount + bank */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <Card sx={{ background: 'linear-gradient(150deg, #1E293B, #0F172A)', color: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  Joriy oy ({b?.currentPeriod}) — hisoblangan
                </Typography>
                <Typography variant="h3" fontWeight={900} mt={0.5}>
                  {formatMoney(b?.currentFee ?? 0, cur)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'grey.500' }}>
                  {formatMoney(b?.currentRevenue ?? 0, cur)} savdodan {b ? (b.feeRate * 100).toFixed(1) : '0.3'}%
                </Typography>
                <Alert severity="info" icon={<Info />} sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.08)', color: 'grey.300', '& .MuiAlert-icon': { color: 'grey.400' } }}>
                  Bu oy tugagach yakuniy hisob-faktura chiqadi.
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <AccountBalance color="primary" />
                  <Typography variant="h6" fontWeight={800}>To‘lov rekvizitlari</Typography>
                </Stack>
                {[
                  ['Bank', b?.bank?.bankName],
                  ['Karta raqami', b?.bank?.cardNumber],
                  ['Qabul qiluvchi', b?.bank?.holder],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography fontWeight={700}>{value || '—'}</Typography>
                      {value && (
                        <Tooltip title="Nusxa olish">
                          <Button size="small" startIcon={<ContentCopy sx={{ fontSize: 16 }} />} onClick={() => copy(String(value))} sx={{ minWidth: 0 }} />
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Hisob-faktura summasini shu kartaga o‘tkazing va quyida «To‘ladim» tugmasini bosing.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Invoice history */}
          <Card>
            <Box sx={{ p: 2.5, pb: 1 }}>
              <Typography variant="h6" fontWeight={800}>Hisob-fakturalar</Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Davr</TableCell>
                    <TableCell>Savdo</TableCell>
                    <TableCell>To‘lov (0.3%)</TableCell>
                    <TableCell>Holati</TableCell>
                    <TableCell align="right">Amal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv: any) => {
                    const st = STATUS[inv.status] ?? STATUS.PENDING;
                    return (
                      <TableRow key={inv._id} hover>
                        <TableCell><Typography fontWeight={600}>{inv.period}</Typography></TableCell>
                        <TableCell>{formatMoney(inv.revenue, inv.currency)}</TableCell>
                        <TableCell><Typography fontWeight={700}>{formatMoney(inv.amountDue, inv.currency)}</Typography></TableCell>
                        <TableCell><Chip label={st.label} color={st.color} size="small" /></TableCell>
                        <TableCell align="right">
                          {inv.status === 'PENDING' ? (
                            <Button size="small" variant="contained" disabled={reporting} onClick={() => reportPaid({ variables: { invoiceId: inv._id } })}>
                              To‘ladim
                            </Button>
                          ) : inv.status === 'PAID' ? (
                            <CheckCircle sx={{ color: 'success.main' }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">Tekshirilmoqda…</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5 }}>
                        <Typography color="text.secondary">Hali hisob-faktura yo‘q. Birinchi to‘liq oydan so‘ng paydo bo‘ladi.</Typography>
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

export default BillingPage;
