import { useState } from 'react';
import { Box, Typography, Stack, Avatar, Collapse, Fade, ButtonBase } from '@mui/material';
import { Restaurant, ShoppingBag } from '@mui/icons-material';
import { LANGUAGES, Lang, getStrings } from '@/lib/i18n';
import Flag from '@/components/Flag';

export type OrderType = 'DINE_IN' | 'TAKE_OUT';

interface Props {
  restaurantName?: string;
  logo?: string;
  tableNumber: number;
  onComplete: (lang: Lang, orderType: OrderType) => void;
}

/**
 * Shown right after the guest scans the table QR.
 *
 * Two stages in one screen: a 2x2 grid of language flags, and once one is
 * picked the dine-in / take-out choice drops in above while the flags shrink
 * to a compact row underneath - so the language stays changeable without
 * going back. Both answers are remembered per table, so this only appears on
 * the first scan of a sitting.
 */
export default function WelcomeGate({ restaurantName, logo, tableNumber, onComplete }: Props) {
  const [lang, setLang] = useState<Lang | null>(null);
  const [picking, setPicking] = useState<OrderType | null>(null);
  const t = getStrings(lang ?? 'en');

  const chooseServing = (type: OrderType) => {
    if (!lang) return;
    // Hold the pressed state briefly so the guest sees which one they hit.
    setPicking(type);
    window.setTimeout(() => onComplete(lang, type), 180);
  };

  const servingCard = (type: OrderType, icon: React.ReactNode, label: string, hint: string) => {
    const active = picking === type;
    return (
      <ButtonBase
        onClick={() => chooseServing(type)}
        sx={{
          flex: 1, flexDirection: 'column', gap: 1.25, py: 3, px: 1.5,
          borderRadius: 5, bgcolor: active ? 'primary.main' : '#fff',
          color: active ? '#fff' : 'text.primary',
          border: '2px solid', borderColor: active ? 'primary.main' : '#E8E2DC',
          boxShadow: active ? '0 12px 28px rgba(249,115,22,0.35)' : '0 2px 10px rgba(0,0,0,0.05)',
          transform: active ? 'scale(0.97)' : 'none',
          transition: 'all .18s ease',
        }}
      >
        <Box
          sx={{
            width: 72, height: 72, borderRadius: '50%',
            bgcolor: active ? 'rgba(255,255,255,0.22)' : '#FFF3E8',
            color: active ? '#fff' : 'primary.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            '& svg': { fontSize: 36 },
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography fontWeight={800} fontSize="1.1rem" lineHeight={1.2}>{label}</Typography>
          <Typography variant="caption" sx={{ color: active ? 'rgba(255,255,255,0.85)' : 'text.secondary' }}>
            {hint}
          </Typography>
        </Box>
      </ButtonBase>
    );
  };

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
        {/* Stage 2 drops in above the flags once a language is chosen */}
        <Collapse in={lang !== null} timeout={420}>
          <Fade in={lang !== null} timeout={600} style={{ transitionDelay: lang ? '160ms' : '0ms' }}>
            <Box mb={4}>
              <Typography variant="h6" fontWeight={800} textAlign="center" mb={2}>
                {t.chooseServing}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="stretch">
                {servingCard('DINE_IN', <Restaurant />, t.dineIn, t.dineInHint)}
                {servingCard('TAKE_OUT', <ShoppingBag />, t.takeOut, t.takeOutHint)}
              </Stack>
            </Box>
          </Fade>
        </Collapse>

        {/* Language: big 2x2 grid at first, compact row once chosen */}
        <Typography
          variant={lang === null ? 'h6' : 'caption'}
          fontWeight={lang === null ? 800 : 700}
          textAlign="center"
          display="block"
          color={lang === null ? 'text.primary' : 'text.secondary'}
          mb={lang === null ? 0.5 : 1.25}
        >
          {t.chooseLanguage}
        </Typography>

        {/* Neutral prompt in every language while none is chosen yet. */}
        <Collapse in={lang === null}>
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mb={3}>
            언어 선택 · Choose language · Выберите язык · Tilni tanlang
          </Typography>
        </Collapse>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: lang === null ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: lang === null ? 1.75 : 1,
            transition: 'gap .3s ease',
          }}
        >
          {LANGUAGES.map((l) => {
            const selected = lang === l.code;
            return (
              <ButtonBase
                key={l.code}
                onClick={() => setLang(l.code)}
                sx={{
                  flexDirection: 'column',
                  gap: lang === null ? 1.25 : 0.5,
                  py: lang === null ? 3 : 1.25,
                  borderRadius: lang === null ? 5 : 3,
                  bgcolor: '#fff',
                  border: '2px solid',
                  borderColor: selected ? 'primary.main' : '#E8E2DC',
                  boxShadow: selected ? '0 6px 18px rgba(249,115,22,0.2)' : '0 2px 10px rgba(0,0,0,0.05)',
                  transition: 'all .3s ease',
                }}
              >
                <Flag code={l.code} w={lang === null ? 54 : 30} />
                <Typography
                  fontWeight={selected ? 800 : 600}
                  fontSize={lang === null ? '1rem' : '0.68rem'}
                  color={selected ? 'primary.main' : 'text.primary'}
                  noWrap
                >
                  {lang === null ? l.label : l.code.toUpperCase()}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
