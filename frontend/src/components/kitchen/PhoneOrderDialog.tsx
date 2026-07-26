import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Stack, Typography,
  Button, IconButton, TextField, Chip, Avatar, Divider, Badge, CircularProgress,
} from '@mui/material';
import {
  Close, ArrowBack, Restaurant, ShoppingBag, Add, Remove, Person, Schedule,
} from '@mui/icons-material';
import { MenuItem, Table, TableSession } from '@/types';
import { formatMoney } from '@/lib/money';

type Step = 'where' | 'menu' | 'who';

export interface PhoneOrderResult {
  tableNumber: number | null;
  orderType: 'DINE_IN' | 'TAKE_OUT';
  items: { menuItemId: string; quantity: number }[];
  customerName: string;
  customerPhone: string;
  /** ISO string, or null when the caller is on their way now. */
  scheduledFor: string | null;
  customerNote: string;
}

interface Props {
  open: boolean;
  tables: Table[];
  openSessions: TableSession[];
  sections: { category: { _id: string; name: string }; items: MenuItem[] }[];
  currency: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (result: PhoneOrderResult) => void;
}

/**
 * Taking an order over the phone, from the kitchen display.
 *
 * Three steps, because that is the order the conversation happens in: where
 * they will sit (or that they are collecting), what they want, and who they
 * are. Staff are holding a phone while doing this, so every step is one
 * decision and nothing is required except the food itself.
 */
export default function PhoneOrderDialog({
  open, tables, openSessions, sections, currency, submitting, onClose, onSubmit,
}: Props) {
  const [step, setStep] = useState<Step>('where');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [collection, setCollection] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');

  const busy = useMemo(
    () => new Set(openSessions.map((s) => s.tableNumber)),
    [openSessions],
  );

  const items = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections],
  );
  const byId = useMemo(
    () => new Map(items.map((i) => [i._id, i])),
    [items],
  );

  const lines = Object.entries(qty).filter(([, n]) => n > 0);
  const total = lines.reduce((sum, [id, n]) => sum + (byId.get(id)?.price ?? 0) * n, 0);
  const count = lines.reduce((sum, [, n]) => sum + n, 0);

  const reset = () => {
    setStep('where'); setTableNumber(null); setCollection(false);
    setQty({}); setActiveCat(null); setName(''); setPhone(''); setWhen(''); setNote('');
  };

  // Reset on open, not only on close: a successful submit closes the dialog
  // from the parent, which would otherwise leave the next call starting on
  // the last caller's details.
  useEffect(() => { if (open) reset(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { reset(); onClose(); };

  const bump = (id: string, delta: number) =>
    setQty((p) => {
      const item = byId.get(id);
      const max = item?.trackQuantity ? Math.max(0, item.quantity ?? 0) : Infinity;
      const next = Math.min(Math.max((p[id] ?? 0) + delta, 0), max);
      return { ...p, [id]: next };
    });

  const submit = () => {
    // "18:30" today; if that has already passed, they mean tomorrow.
    let scheduledFor: string | null = null;
    if (when) {
      const [h, m] = when.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
      scheduledFor = d.toISOString();
    }
    onSubmit({
      tableNumber: collection ? null : tableNumber,
      orderType: collection ? 'TAKE_OUT' : 'DINE_IN',
      items: lines.map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      customerName: name.trim(),
      customerPhone: phone.trim(),
      scheduledFor,
      customerNote: note.trim(),
    });
  };

  const visible = activeCat
    ? sections.filter((s) => s.category._id === activeCat)
    : sections;

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, height: { xs: '100%', sm: '88vh' } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1.5 }}>
        {step !== 'where' && (
          <IconButton size="small" onClick={() => setStep(step === 'who' ? 'menu' : 'where')} aria-label="Orqaga">
            <ArrowBack />
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={800} noWrap>
            {step === 'where' && 'Telefon buyurtma - qayerga?'}
            {step === 'menu' && 'Taomlarni tanlang'}
            {step === 'who' && 'Kim buyurtma qildi?'}
          </Typography>
          {step !== 'where' && (
            <Typography variant="caption" color="text.secondary">
              {collection ? 'Olib ketish' : `${tableNumber}-stol`}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={close} aria-label="Yopish"><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {/* 1. Where -------------------------------------------------------- */}
        {step === 'where' && (
          <>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ShoppingBag />}
              onClick={() => { setCollection(true); setTableNumber(null); setStep('menu'); }}
              sx={{ mb: 2, py: 1.5, borderRadius: 2, fontWeight: 800, justifyContent: 'flex-start', pl: 2 }}
            >
              Olib ketish - stol kerak emas
            </Button>

            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Yoki stolni tanlang. Band stollar tanlanmaydi.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 1.25 }}>
              {tables.map((t) => {
                const isBusy = busy.has(t.number);
                return (
                  <Button
                    key={t._id}
                    disabled={isBusy}
                    onClick={() => { setCollection(false); setTableNumber(t.number); setStep('menu'); }}
                    sx={{
                      flexDirection: 'column', py: 1.25, borderRadius: 2,
                      border: '2px solid',
                      borderColor: isBusy ? 'divider' : 'success.main',
                      color: isBusy ? 'text.disabled' : 'text.primary',
                      bgcolor: isBusy ? 'action.hover' : 'transparent',
                    }}
                  >
                    <Typography fontWeight={800} fontSize="1.1rem">{t.number}</Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.62rem' }}>
                      {isBusy ? 'Band' : 'Bo‘sh'}
                    </Typography>
                  </Button>
                );
              })}
              {!tables.length && (
                <Typography variant="body2" color="text.secondary">Hali stol qo‘shilmagan.</Typography>
              )}
            </Box>
          </>
        )}

        {/* 2. The menu, as a guest sees it --------------------------------- */}
        {step === 'menu' && (
          <>
            <Stack direction="row" spacing={0.75} sx={{ overflowX: 'auto', pb: 1.5, '&::-webkit-scrollbar': { display: 'none' } }}>
              <Chip
                label="Hammasi"
                onClick={() => setActiveCat(null)}
                color={activeCat === null ? 'primary' : 'default'}
                sx={{ fontWeight: 700, flexShrink: 0 }}
              />
              {sections.map((s) => (
                <Chip
                  key={s.category._id}
                  label={s.category.name}
                  onClick={() => setActiveCat(s.category._id)}
                  color={activeCat === s.category._id ? 'primary' : 'default'}
                  sx={{ fontWeight: 700, flexShrink: 0 }}
                />
              ))}
            </Stack>

            {visible.map((section) => (
              <Box key={section.category._id} mb={2}>
                <Typography variant="subtitle2" fontWeight={800} mb={1}>{section.category.name}</Typography>
                <Stack spacing={1}>
                  {section.items.map((item) => {
                    const n = qty[item._id] ?? 0;
                    const remaining = item.trackQuantity ? Math.max(0, item.quantity ?? 0) : Infinity;
                    const soldOut = !item.isAvailable || remaining <= 0;
                    return (
                      <Stack
                        key={item._id}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{
                          p: 1, borderRadius: 2, border: '1px solid',
                          borderColor: n > 0 ? 'primary.main' : 'divider',
                          opacity: soldOut ? 0.5 : 1,
                        }}
                      >
                        {item.imageUrl ? (
                          <Box component="img" src={item.imageUrl} alt="" loading="lazy"
                            sx={{ width: 52, height: 52, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <Avatar variant="rounded" sx={{ width: 52, height: 52, bgcolor: '#FFF7ED', fontSize: '1.4rem' }}>🍽</Avatar>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={700} fontSize="0.92rem" noWrap>{item.name}</Typography>
                          <Typography variant="caption" color="primary" fontWeight={800}>
                            {formatMoney(item.price, currency)}
                          </Typography>
                          {item.trackQuantity && remaining <= 5 && remaining > 0 && (
                            <Typography variant="caption" color="warning.main" display="block">
                              {remaining} ta qoldi
                            </Typography>
                          )}
                        </Box>
                        {soldOut ? (
                          <Chip label="Tugadi" size="small" color="error" variant="outlined" />
                        ) : n > 0 ? (
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                            <IconButton size="small" onClick={() => bump(item._id, -1)}><Remove fontSize="small" /></IconButton>
                            <Typography fontWeight={800} sx={{ minWidth: 20, textAlign: 'center' }}>{n}</Typography>
                            <IconButton size="small" disabled={n >= remaining} onClick={() => bump(item._id, 1)}>
                              <Add fontSize="small" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <IconButton
                            onClick={() => bump(item._id, 1)}
                            aria-label={`${item.name} qo‘shish`}
                            sx={{ bgcolor: 'primary.main', color: '#fff', width: 32, height: 32, flexShrink: 0, '&:hover': { bgcolor: 'primary.dark' } }}
                          >
                            <Add sx={{ fontSize: 18 }} />
                          </IconButton>
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            ))}
            {!sections.length && (
              <Typography variant="body2" color="text.secondary">Menyu bo‘sh.</Typography>
            )}
          </>
        )}

        {/* 3. Who ---------------------------------------------------------- */}
        {step === 'who' && (
          <Stack spacing={2}>
            <TextField
              label="Mijoz ismi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
              InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'text.disabled' }} /> }}
            />
            <TextField
              label="Telefon raqami"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              placeholder="+998 90 123 45 67"
            />
            <TextField
              label="Qachon keladi"
              type="time"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: <Schedule sx={{ mr: 1, color: 'text.disabled' }} /> }}
              helperText={
                when
                  ? 'Buyurtma shu vaqtgacha kutadi - oshxona o‘zi boshlaydi.'
                  : 'Bo‘sh qoldirilsa, buyurtma darhol oshxonaga tushadi.'
              }
            />
            <TextField
              label="Izoh (ixtiyoriy)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth multiline rows={2}
            />

            <Divider />
            <Box>
              <Typography variant="subtitle2" fontWeight={800} mb={1}>Buyurtma</Typography>
              {lines.map(([id, n]) => (
                <Stack key={id} direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
                  <Typography variant="body2">{n}× {byId.get(id)?.name}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatMoney((byId.get(id)?.price ?? 0) * n, currency)}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        {step === 'menu' && (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {count} ta taom
              </Typography>
              <Typography fontWeight={800}>{formatMoney(total, currency)}</Typography>
            </Box>
            <Button
              variant="contained"
              disabled={!count}
              onClick={() => setStep('who')}
              sx={{ fontWeight: 800, px: 3 }}
            >
              Davom etish
            </Button>
          </>
        )}
        {step === 'who' && (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" display="block">Jami</Typography>
              <Typography fontWeight={800}>{formatMoney(total, currency)}</Typography>
            </Box>
            <Button onClick={() => setStep('menu')}>Orqaga</Button>
            <Button
              variant="contained"
              disabled={submitting || !count}
              onClick={submit}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Restaurant />}
              sx={{ fontWeight: 800 }}
            >
              Buyurtmani yuborish
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
