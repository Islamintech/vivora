import type { NextPage } from 'next';
import NextLink from 'next/link';
import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import { Bolt, Favorite, Insights, Public, ArrowForward } from '@mui/icons-material';
import MarketingLayout, {
  PRIMARY, PRIMARY_DEEP, ON_SURFACE, ON_VAR, SURFACE, SC_LOW, GRAD, pill,
} from '../libs/components/marketing/MarketingLayout';
import { useMarketingT } from '../libs/marketing-i18n';

const VALUE_ICONS = [<Bolt key="0" />, <Favorite key="1" />, <Insights key="2" />, <Public key="3" />];

const About: NextPage = () => {
  const { t } = useMarketingT();
  const a = t.about;

  return (
    <MarketingLayout title="Vivora | About">
      {/* Hero */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY_DEEP, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>
          {a.eyebrow}
        </Typography>
        <Typography sx={{ fontSize: 'clamp(2.1rem, 4.6vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.06, mb: 3, maxWidth: 820, mx: 'auto' }}>
          {a.titlePre}
          <Box component="span" sx={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {a.titleGrad}
          </Box>
          {a.titlePost}
        </Typography>
        <Typography sx={{ fontSize: 'clamp(1.05rem, 1.4vw, 1.3rem)', color: ON_VAR, maxWidth: 700, mx: 'auto', lineHeight: 1.7 }}>
          {a.sub}
        </Typography>
      </Container>

      {/* Metrics band - orange gradient, same family as the pricing card */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: '2rem', background: 'linear-gradient(135deg, #B45309, #D94E05 55%, #FD6511)', p: { xs: 3, md: 5 }, boxShadow: '0 30px 60px rgba(253,101,17,0.25)' }}>
          <Box sx={{ position: 'absolute', top: '-40%', left: '-10%', width: '55%', height: '160%', border: '40px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <Grid container spacing={2} sx={{ position: 'relative' }}>
            {a.metrics.map((m) => (
              <Grid item xs={6} md={3} key={m.l} sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 900, lineHeight: 1, color: '#fff', textShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>{m.n}</Typography>
                <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>{m.l}</Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Mission split */}
      <Container maxWidth="lg" sx={{ pb: { xs: 10, md: 14 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ borderRadius: '2rem', overflow: 'hidden', boxShadow: '0 30px 60px rgba(253,101,17,0.15)' }}>
              <Box component="img" src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80&auto=format&fit=crop" alt="Restaurant" sx={{ width: '100%', height: { xs: 260, md: 380 }, objectFit: 'cover', display: 'block' }} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY_DEEP, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>
              {a.missionEyebrow}
            </Typography>
            <Typography sx={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 2 }}>{a.missionTitle}</Typography>
            <Typography sx={{ fontSize: 17, color: ON_VAR, lineHeight: 1.75, mb: 2 }}>
              {a.missionP1}
            </Typography>
            <Typography sx={{ fontSize: 17, color: ON_VAR, lineHeight: 1.75, mb: 3 }}>
              {a.missionP2}
            </Typography>
            <Stack spacing={1.25}>
              {a.missionBullets.map((b) => (
                <Stack key={b} direction="row" spacing={1.25} alignItems="center">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: GRAD, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 14.5, color: ON_SURFACE, fontWeight: 500 }}>{b}</Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Values */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: SC_LOW }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 9 } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: PRIMARY_DEEP, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>
              {a.valuesEyebrow}
            </Typography>
            <Typography sx={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.7rem)', fontWeight: 800, letterSpacing: '-0.02em', mb: 1.5 }}>{a.valuesTitle}</Typography>
            <Typography sx={{ fontSize: 17, color: ON_VAR }}>{a.valuesSub}</Typography>
          </Box>
          <Grid container spacing={3}>
            {a.values.map((v, i) => (
              <Grid item xs={12} sm={6} md={3} key={v.title}>
                <Box sx={{ height: '100%', bgcolor: '#fff', borderRadius: '1.5rem', p: 3, border: '1px solid rgba(140,113,100,0.14)', transition: 'transform .25s, box-shadow .25s, border-color .25s', '&:hover': { transform: 'translateY(-5px)', borderColor: 'rgba(253,101,17,0.3)', boxShadow: '0 16px 36px rgba(253,101,17,0.1)' } }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(253,101,17,0.1)', border: '1px solid rgba(253,101,17,0.18)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, '& svg': { fontSize: 24 } }}>{VALUE_ICONS[i]}</Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, mb: 0.75 }}>{v.title}</Typography>
                  <Typography sx={{ fontSize: 14, color: ON_VAR, lineHeight: 1.65 }}>{v.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA - same band as the landing page */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 14 } }}>
        <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 5, p: { xs: 4, md: 8 }, textAlign: 'center', background: 'linear-gradient(135deg, #B45309, #D94E05 55%, #FD6511)' }}>
          <Box sx={{ position: 'absolute', top: '-40%', left: '-10%', width: '55%', height: '160%', border: '50px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <Box sx={{ position: 'absolute', bottom: '-50%', right: '-8%', width: '48%', height: '150%', border: '34px solid rgba(255,255,255,0.07)', borderRadius: '50%' }} />
          <Typography sx={{ position: 'relative', fontSize: 'clamp(1.7rem, 3.6vw, 2.7rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', mb: 2 }}>
            {a.ctaTitle}
          </Typography>
          <Typography sx={{ position: 'relative', fontSize: 16.5, color: 'rgba(255,255,255,0.9)', mb: 4 }}>
            {a.ctaSub}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ position: 'relative' }}>
            <Button component={NextLink} href="/register" endIcon={<ArrowForward />} sx={pill({ bgcolor: '#fff', color: '#B45309', boxShadow: '0 14px 30px rgba(0,0,0,0.25)', '&:hover': { bgcolor: SURFACE } })}>
              {t.home.start}
            </Button>
            <Button component={NextLink} href="/contact" sx={pill({ color: '#fff', border: '2px solid rgba(255,255,255,0.35)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' } })}>
              {a.ctaTalk}
            </Button>
          </Stack>
        </Box>
      </Container>
    </MarketingLayout>
  );
};

export default About;
