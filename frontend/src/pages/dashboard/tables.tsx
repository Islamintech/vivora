import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Button, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, IconButton, Tooltip, Avatar,
} from '@mui/material';
import { Add, Delete, Refresh, Download, QrCode2 } from '@mui/icons-material';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  TABLES_QUERY, CREATE_TABLE_MUTATION, DELETE_TABLE_MUTATION, REGENERATE_QR_MUTATION,
} from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { Table } from '@/types';
import { useQuery as useApolloQuery } from '@apollo/client';
import { MY_RESTAURANT_QUERY } from '@/graphql/operations';

const TablesPage: NextPage = () => {
  const { user } = useRequireAuth();
  const { data, refetch } = useQuery(TABLES_QUERY, { skip: !user });
  const { data: restData } = useApolloQuery(MY_RESTAURANT_QUERY, { skip: !user });

  const tables: Table[] = data?.tables ?? [];
  const restaurant = restData?.myRestaurant;

  const [createDialog, setCreateDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState<Table | null>(null);
  const [form, setForm] = useState({ number: '', name: '', capacity: '4' });

  const [createTable] = useMutation(CREATE_TABLE_MUTATION, {
    onCompleted() { toast.success('Stol QR kod bilan yaratildi!'); setCreateDialog(false); refetch(); },
    onError(e) { toast.error(e.message); },
  });

  const [deleteTable] = useMutation(DELETE_TABLE_MUTATION, {
    onCompleted() { toast.success('Stol o‘chirildi'); refetch(); },
    onError(e) { toast.error(e.message); },
  });

  const [regenerateQr] = useMutation(REGENERATE_QR_MUTATION, {
    onCompleted(d) {
      toast.success('QR kod qayta yaratildi');
      setQrDialog(d.regenerateQrCode);
      refetch();
    },
    onError(e) { toast.error(e.message); },
  });

  const handleCreate = () => {
    if (!form.number || !form.name) { toast.error('Raqam va nom kiritilishi shart'); return; }
    createTable({
      variables: {
        input: {
          number: parseInt(form.number),
          name: form.name,
          capacity: parseInt(form.capacity) || 4,
        },
      },
    });
  };

  const downloadQr = (table: Table) => {
    const link = document.createElement('a');
    link.href = table.qrCodeDataUrl;
    link.download = `table-${table.number}-qr.png`;
    link.click();
  };

  return (
    <>
      <Head><title>Stollar va QR — RestoPlatform</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={4}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Stollar va QR kodlar</Typography>
              <Typography color="text.secondary">
                Har bir stol menyuingizga olib boradigan alohida QR kod oladi
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
              Stol qo‘shish
            </Button>
          </Stack>

          {tables.length === 0 && (
            <Card sx={{ textAlign: 'center', py: 10 }}>
              <QrCode2 sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Hali stollar yo‘q</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Mijozlar buyurtma berishi uchun QR kodlar yaratish maqsadida stollar qo‘shing
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
                Birinchi stolingizni qo‘shing
              </Button>
            </Card>
          )}

          <Grid container spacing={3}>
            {tables.map((table) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={table._id}>
                <Card sx={{ textAlign: 'center', position: 'relative' }}>
                  <CardContent sx={{ p: 3 }}>
                    {/* Status */}
                    <Box position="absolute" top={12} right={12}>
                      <Chip
                        size="small"
                        label={table.isActive ? 'Faol' : 'Nofaol'}
                        color={table.isActive ? 'success' : 'default'}
                      />
                    </Box>

                    {/* Table number badge */}
                    <Avatar
                      sx={{ width: 48, height: 48, bgcolor: 'primary.main', mx: 'auto', mb: 1.5, fontWeight: 800, fontSize: '1.2rem' }}
                    >
                      {table.number}
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>{table.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Sig‘imi: {table.capacity} · №{table.number}
                    </Typography>

                    {/* QR preview */}
                    {table.qrCodeDataUrl && (
                      <Box
                        component="img"
                        src={table.qrCodeDataUrl}
                        alt={`QR for ${table.name}`}
                        sx={{ width: 140, height: 140, cursor: 'pointer', borderRadius: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}
                        onClick={() => setQrDialog(table)}
                      />
                    )}

                    {/* URL label */}
                    <Typography variant="caption" color="text.disabled" display="block" mb={2} sx={{ wordBreak: 'break-all' }}>
                      /{restaurant?.slug}/{table.number}
                    </Typography>

                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="QR ni ko‘rish va yuklab olish">
                        <IconButton color="primary" onClick={() => setQrDialog(table)}>
                          <QrCode2 />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="PNG yuklab olish">
                        <IconButton onClick={() => downloadQr(table)}>
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="QR ni qayta yaratish">
                        <IconButton onClick={() => regenerateQr({ variables: { tableId: table._id } })}>
                          <Refresh />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Stolni o‘chirish">
                        <IconButton
                          color="error"
                          onClick={() => {
                            if (confirm(`${table.name} o‘chirilsinmi?`)) deleteTable({ variables: { tableId: table._id } });
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Create Table Dialog */}
        <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle fontWeight={700}>Yangi stol qo‘shish</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} mt={1}>
              <TextField
                label="Stol raqami"
                type="number"
                value={form.number}
                onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Stol nomi"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                fullWidth
                placeholder="masalan: 1-stol, Terrasa A, VIP xona"
              />
              <TextField
                label="O‘rinlar soni"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                fullWidth
              />
              <Typography variant="caption" color="text.secondary">
                Menyu sahifangizga olib boradigan QR kod avtomatik yaratiladi.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateDialog(false)}>Bekor qilish</Button>
            <Button variant="contained" onClick={handleCreate}>Stol yaratish</Button>
          </DialogActions>
        </Dialog>

        {/* QR Zoom Dialog */}
        <Dialog open={!!qrDialog} onClose={() => setQrDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle fontWeight={700}>{qrDialog?.name} — QR kod</DialogTitle>
          <DialogContent sx={{ textAlign: 'center' }}>
            {qrDialog?.qrCodeDataUrl && (
              <Box
                component="img"
                src={qrDialog.qrCodeDataUrl}
                alt="QR Code"
                sx={{ width: '100%', maxWidth: 280, borderRadius: 2 }}
              />
            )}
            <Typography variant="body2" color="text.secondary" mt={2}>
              <strong>{qrDialog?.name}</strong> menyusini ochish uchun{' '}
              ushbu QR kodni skanerlang
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setQrDialog(null)}>Yopish</Button>
            {qrDialog && (
              <Button variant="contained" startIcon={<Download />} onClick={() => downloadQr(qrDialog)}>
                PNG yuklab olish
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default TablesPage;
