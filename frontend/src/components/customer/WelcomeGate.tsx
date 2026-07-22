import { useState } from 'react';
import { Box, Typography, Stack, Button, Avatar, IconButton } from '@mui/material';
import { Restaurant, ShoppingBag, ArrowBack } from '@mui/icons-material';
import { LANGUAGES, Lang, getStrings } from '@/lib/i18n';

export type OrderType = 'DINE_IN' | 'TAKE_OUT';

interface Props {
  restaurantName?: string;
  logo?: string;
  tableNumber: number;
  onComplete: (lang: Lang, orderType: OrderType) => void;
}

/**
 * Shown right after the guest scans the table QR: pick a language, then choose
 * dine-in or take-out. Both answers are remembered per table, so this only
 * appears on the first visit of a sitting.
 */
export default function WelcomeGate({ restaurantName, logo, tableNumber, onComplete }: Props) {
  const [lang, setLang] = useState<Lang | null>(null);
  const t = getStrings(lang ?? 'en');

  const choice = (
    icon: React.ReactNode,
    label: string,
    hint: string,
    onClick: () => void,
  ) => (
    <Button
      onClick={onClick}
      fullWidth
      sx={{
        p: 2.5, borderRadius: 4, bgcolor: 'white', color: 'text.primary',
        border: '1px solid #E2E8F0', textAlign: 'left', justifyContent: 'flex-start',
        '&:hover': { bgcolor: '#FFF7ED', borderColor: 'primary.main' },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" width="100%">
        <Avatar sx={{ bgcolor: '#FFF7ED', color: 'primary.main', width: 56, height: 56 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography fontWeight={800} fontSize="1.05rem">{label}</Typography>
          <Typography variant="caption" color="text.secondary">{hint}</Typography>
        </Box>
      </Stack>
    </Button>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA', maxWidth: 480, mx: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Branded header */}
      <Box sx={{ background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)', pt: 5, pb: 5, px: 3, textAlign: 'center' }}>
        {logo && <Avatar src={logo} sx={{ width: 64, height: 64, mb: 1.5, mx: 'auto' }} />}
        <Typography variant="h5" fontWeight={800} color="white">{restaurantName}</Typography>
        <Typography variant="body2" sx={{ color: 'grey.400', mt: 0.5 }}>
          {t.table} {tableNumber}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, p: 3 }}>
        {lang === null ? (
          <>
            <Typography variant="h6" fontWeight={800} textAlign="center" mb={0.5}>
              {t.chooseLanguage}
            </Typography>
            {/* Neutral prompt in every language while none is chosen yet. */}
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mb={3}>
              언어 선택 · Choose language · Выберите язык · Tilni tanlang
            </Typography>
            <Stack spacing={1.5}>
              {LANGUAGES.map((l) => (
                <Button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  fullWidth
                  sx={{
                    py: 2, borderRadius: 4, bgcolor: 'white', color: 'text.primary',
                    border: '1px solid #E2E8F0', justifyContent: 'flex-start',
                    '&:hover': { bgcolor: '#FFF7ED', borderColor: 'primary.main' },
                  }}
                >
                  <Typography component="span" sx={{ fontSize: '1.8rem', mr: 2, lineHeight: 1 }}>
                    {l.flag}
                  </Typography>
                  <Typography fontWeight={700} fontSize="1.05rem">{l.label}</Typography>
                </Button>
              ))}
            </Stack>
          </>
        ) : (
          <>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <IconButton onClick={() => setLang(null)} aria-label={t.back}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" fontWeight={800}>{t.chooseServing}</Typography>
            </Stack>
            <Stack spacing={2}>
              {choice(<Restaurant />, t.dineIn, t.dineInHint, () => onComplete(lang, 'DINE_IN'))}
              {choice(<ShoppingBag />, t.takeOut, t.takeOutHint, () => onComplete(lang, 'TAKE_OUT'))}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}
