import { useEffect, useState } from 'react';
import {
  Drawer, Box, Typography, Stack, Chip, IconButton, Button, TextField, Divider, Avatar,
} from '@mui/material';
import { Add, Remove, Close, Star } from '@mui/icons-material';
import { MenuItem } from '@/types';
import { UIStrings } from '@/lib/i18n';

interface Props {
  item: MenuItem | null;
  open: boolean;
  t: UIStrings;
  fmt: (n: number) => string;
  /** Remaining stock; Infinity when the item isn't quantity-tracked. */
  max: number;
  /** Quantity already in the cart for this item (0 if none). */
  inCart: number;
  /** Note already saved on the cart line. */
  cartNote?: string;
  onClose: () => void;
  onConfirm: (quantity: number, note: string) => void;
}

/**
 * Full detail view for one dish, opened by tapping its card. This is where the
 * larger image, description, allergens and the per-item kitchen note live -
 * the card itself stays compact and scannable.
 */
export default function ItemSheet({
  item, open, t, fmt, max, inCart, cartNote, onClose, onConfirm,
}: Props) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  // Re-seed from the cart each time the sheet opens for a different dish.
  useEffect(() => {
    if (open) {
      setQty(inCart > 0 ? inCart : 1);
      setNote(cartNote ?? '');
    }
  }, [open, item?._id, inCart, cartNote]);

  if (!item) return null;

  const atMax = qty >= max;
  const soldOut = max <= 0;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: '24px 24px 0 0', maxHeight: '92vh', maxWidth: 480, mx: 'auto', overflow: 'hidden' },
      }}
    >
      <Box sx={{ position: 'relative', overflowY: 'auto' }}>
        {/* Hero image */}
        {item.imageUrl ? (
          <Box
            component="img"
            src={item.imageUrl}
            alt={item.name}
            sx={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box sx={{ height: 140, bgcolor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'white', fontSize: '2.2rem' }}>🍽</Avatar>
          </Box>
        )}

        <IconButton
          onClick={onClose}
          aria-label={t.close}
          sx={{
            position: 'absolute', top: 12, right: 12,
            bgcolor: 'rgba(15,23,42,0.6)', color: 'white',
            '&:hover': { bgcolor: 'rgba(15,23,42,0.8)' },
          }}
        >
          <Close />
        </IconButton>

        <Box sx={{ p: 2.5, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>{item.name}</Typography>
            {item.isBestSeller ? (
              <Chip label={`🔥 ${t.bestSeller}`} size="small" sx={{ fontWeight: 800, bgcolor: '#FFF1E4', color: '#C2410C' }} />
            ) : item.isPopular ? (
              <Chip icon={<Star sx={{ fontSize: 14 }} />} label={t.popular} size="small" color="warning" variant="outlined" />
            ) : null}
          </Stack>

          <Typography variant="h6" fontWeight={800} color="primary" mb={1.5}>
            {fmt(item.price)}
          </Typography>

          {item.description && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              {item.description}
            </Typography>
          )}

          {!!item.allergens?.length && (
            <Box mb={2}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.75}>
                {t.allergens}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {item.allergens.map((a) => (
                  <Chip key={a} label={a} size="small" color="error" variant="outlined" sx={{ height: 24 }} />
                ))}
              </Stack>
            </Box>
          )}

          {!!item.tags?.length && (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap mb={2}>
              {item.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 24 }} />
              ))}
            </Stack>
          )}

          <TextField
            label={t.itemNote}
            placeholder={t.itemNoteHint}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            rows={2}
            inputProps={{ maxLength: 300 }}
            sx={{ mb: 1 }}
          />
        </Box>

        <Divider />

        {/* Sticky action bar */}
        <Box sx={{ p: 2.5, position: 'sticky', bottom: 0, bgcolor: 'background.paper' }}>
          {soldOut ? (
            <Button fullWidth size="large" disabled variant="contained" sx={{ py: 1.6, borderRadius: 3 }}>
              {t.soldOut}
            </Button>
          ) : (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ border: '1px solid #E2E8F0', borderRadius: 3, px: 0.5, py: 0.25, flexShrink: 0 }}
              >
                <IconButton size="small" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                  <Remove fontSize="small" />
                </IconButton>
                <Typography fontWeight={800} sx={{ minWidth: 24, textAlign: 'center' }}>{qty}</Typography>
                <IconButton size="small" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={atMax}>
                  <Add fontSize="small" />
                </IconButton>
              </Stack>
              {/* Label and price are separate spans: the label may wrap to a
                  second line in longer languages, the price never does. */}
              <Button
                variant="contained"
                size="large"
                onClick={() => onConfirm(qty, note.trim())}
                sx={{ flex: 1, minWidth: 0, py: 1.4, borderRadius: 3, lineHeight: 1.25 }}
              >
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 1, width: '100%', minWidth: 0,
                  }}
                >
                  <Box component="span" sx={{ fontSize: '0.95rem', fontWeight: 700, minWidth: 0 }}>
                    {inCart > 0 ? t.updateOrder : t.addToOrder}
                  </Box>
                  <Box component="span" sx={{ fontSize: '0.95rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {fmt(item.price * qty)}
                  </Box>
                </Box>
              </Button>
            </Stack>
          )}
          {Number.isFinite(max) && max > 0 && max <= 5 && (
            <Typography variant="caption" color="warning.main" fontWeight={600} display="block" mt={1} textAlign="center">
              {t.onlyLeft.replace('{n}', String(max))}
            </Typography>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
