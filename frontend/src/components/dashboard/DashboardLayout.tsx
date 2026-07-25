import { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, AppBar, Typography, IconButton,
  Avatar, Menu, MenuItem, Divider, useTheme, useMediaQuery, Tooltip,
  Alert, AlertTitle, Button, Card, CardContent,
} from '@mui/material';
import {
  Dashboard, MenuBook, TableRestaurant, ShoppingBag,
  Analytics, Feedback, Settings, Logout, Kitchen,
  Menu as MenuIcon, Restaurant, Inventory2, HourglassTop, Block,
  CreditCard,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter as useNextRouter } from 'next/router';
import { MY_RESTAURANT_QUERY } from '@/graphql/operations';

const SETTINGS_PATH = '/dashboard/settings';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Umumiy', href: '/dashboard', icon: <Dashboard /> },
  { label: 'Menyu', href: '/dashboard/menu', icon: <MenuBook /> },
  { label: 'Mavjudlik', href: '/dashboard/availability', icon: <Inventory2 /> },
  { label: 'Stollar va QR', href: '/dashboard/tables', icon: <TableRestaurant /> },
  { label: 'Buyurtmalar', href: '/dashboard/orders', icon: <ShoppingBag /> },
  { label: 'Tahlil', href: '/dashboard/analytics', icon: <Analytics /> },
  { label: 'Mijozlar fikri', href: '/dashboard/feedback', icon: <Feedback /> },
  { label: 'To‘lov', href: '/dashboard/billing', icon: <CreditCard /> },
  { label: 'Sozlamalar', href: '/dashboard/settings', icon: <Settings /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useNextRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Approval gate: a restaurant must be APPROVED before its owner can use the
  // operational pages. Until then we show a status banner, and lock everything
  // except Settings so they can still complete their profile.
  const { data: restData } = useQuery(MY_RESTAURANT_QUERY, { skip: !user });
  const restaurant = restData?.myRestaurant;
  const status: string | undefined = restaurant?.status;
  const needsApproval = !!restaurant && status !== 'APPROVED';
  const onSettings = router.pathname === SETTINGS_PATH;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const approvalBanner = needsApproval && (
    status === 'REJECTED' ? (
      <Alert severity="error" icon={<Block />} sx={{ borderRadius: 2, mb: 3 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>Arizangiz rad etildi</AlertTitle>
        {restaurant?.rejectionReason
          ? <>Sabab: {restaurant.rejectionReason}. </>
          : null}
        Profilingizni yangilab, qayta ko‘rib chiqish uchun yuboring.
      </Alert>
    ) : (
      <Alert severity="warning" icon={<HourglassTop />} sx={{ borderRadius: 2, mb: 3 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>Hisobingiz ko‘rib chiqilmoqda</AlertTitle>
        Faoliyatni boshlash uchun avval restoran profilini to‘ldiring. Biz uni
        tekshirib, ruxsat beramiz.
      </Alert>
    )
  );

  const lockCard = (
    <Card sx={{ maxWidth: 520, mx: 'auto', mt: 6, textAlign: 'center' }}>
      <CardContent sx={{ p: 4 }}>
        <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: status === 'REJECTED' ? 'error.light' : 'warning.light', color: status === 'REJECTED' ? 'error.dark' : 'warning.dark' }}>
          {status === 'REJECTED' ? <Block /> : <HourglassTop />}
        </Avatar>
        <Typography variant="h6" fontWeight={800} mb={1}>
          {status === 'REJECTED' ? 'Arizangiz rad etildi' : 'Hali ruxsat berilmagan'}
        </Typography>
        <Typography color="text.secondary" mb={3}>
          {status === 'REJECTED'
            ? (restaurant?.rejectionReason
                ? `Sabab: ${restaurant.rejectionReason}. Profilni tahrirlab, qayta yuboring.`
                : 'Profilni tahrirlab, qayta yuboring.')
            : 'Bu bo‘limdan foydalanish uchun restoran profilini to‘ldiring va tasdiqlashni kuting.'}
        </Typography>
        <Button variant="contained" component={NextLink} href={SETTINGS_PATH} startIcon={<Settings />}>
          Profilni to‘ldirish
        </Button>
      </CardContent>
    </Card>
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand - a Toolbar so its height (and the divider below it) lines up
          exactly with the AppBar's toolbar across the top of the page. */}
      <Toolbar sx={{ px: 3 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Vivora
        </Typography>
      </Toolbar>

      <Divider />

      {/* Nav */}
      <List sx={{ px: 1.5, pt: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const active = router.pathname === item.href;
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NextLink}
                href={item.href}
                selected={active}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: active ? 'inherit' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Kitchen link */}
      <Divider />
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <ListItemButton
          component={NextLink}
          href="/kitchen"
          sx={{ borderRadius: 2, color: 'text.secondary' }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}><Kitchen /></ListItemIcon>
          <ListItemText
            primary="Oshxona ekrani"
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` },
          // Same 1px divider as under the sidebar brand, so the two line up
          // into one continuous rule across the top.
          boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }} aria-label="Open navigation menu">
              <MenuIcon />
            </IconButton>
          )}
          {/* Keep page context visible on mobile once the drawer closes. */}
          {isMobile && (
            <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: '1.05rem' }}>
              {navItems.find((i) => i.href === router.pathname)?.label ?? 'Vivora'}
            </Typography>
          )}
          <Box sx={{ flex: 1 }} />
          <Tooltip title={user?.name || 'Hisob'}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography fontWeight={600} fontSize="0.875rem">{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1 }}>
              <Logout fontSize="small" /> Chiqish
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{ flex: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minHeight: '100vh' }}
      >
        <Toolbar />
        {needsApproval ? (
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            {approvalBanner}
            {onSettings ? children : lockCard}
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}
