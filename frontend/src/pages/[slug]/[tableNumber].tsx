import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Typography, Stack, Card, CardContent, Button, Chip,
  IconButton, Drawer, Badge, Avatar, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, Menu, MenuItem as MuiMenuItem, Skeleton, Slide,
} from '@mui/material';
import {
  ShoppingCart, Add, Remove, Delete, Star, Close,
  Translate, ThumbUp, ReceiptLong,
} from '@mui/icons-material';
import {
  PUBLIC_MENU_QUERY, PLACE_ORDER_MUTATION, SUBMIT_FEEDBACK_MUTATION,
  PUBLIC_RESTAURANT_QUERY, TABLE_SESSION_QUERY,
} from '@/graphql/operations';
import { CartItem, MenuItem, Order, OrderStatus, TableSession } from '@/types';
import { formatMoney } from '@/lib/money';
import { Lang, LANGUAGES, getStrings, UIStrings } from '@/lib/i18n';
import WelcomeGate, { OrderType } from '@/components/customer/WelcomeGate';
import ItemSheet from '@/components/customer/ItemSheet';

// Which of the 3 calm stages an order is at (READY folds into "preparing").
const orderStep = (s: OrderStatus): number =>
  s === 'SERVED' ? 2 : s === 'PREPARING' || s === 'READY' ? 1 : 0;

// A quiet 3-segment progress strip: Received → Preparing → Served. Far calmer
// than a chip that implies second-by-second accuracy.
function OrderProgress({ t, status }: { t: UIStrings; status: OrderStatus }) {
  if (status === 'CANCELLED') {
    return <Chip label={t.statusCancelled} color="error" size="small" variant="outlined" />;
  }
  const step = orderStep(status);
  const labels = [t.statusPending, t.statusPreparing, t.statusServed];
  return (
    <Box sx={{ mt: 0.5 }}>
      <Stack direction="row" spacing={0.5} mb={0.5}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1, height: 4, borderRadius: 2,
              bgcolor: i <= step ? '#22C55E' : '#E2E8F0',
              transition: 'background-color .3s ease',
            }}
          />
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        {labels.map((label, i) => (
          <Typography
            key={label}
            variant="caption"
            sx={{ fontSize: '0.66rem', fontWeight: i === step ? 800 : 500, color: i <= step ? 'success.main' : 'text.disabled' }}
          >
            {label}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

// Language + dine-in/take-out are remembered per table so the gate only shows
// on the first scan of a sitting.
const prefsKey = (slug: string, table: number) => `resto:prefs:${slug}:${table}`;

interface Props { slug: string; tableNumber: number; }

const PublicMenuPage: NextPage<Props> = ({ slug, tableNumber }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [tabOpen, setTabOpen] = useState(false);

  // null until we've read localStorage; then either the saved prefs or none
  // (which shows the welcome gate).
  const [prefs, setPrefs] = useState<{ lang: Lang; orderType: OrderType } | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(prefsKey(slug, tableNumber));
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      // Corrupt/blocked storage — just show the gate.
    }
    setPrefsLoaded(true);
  }, [slug, tableNumber]);

  const savePrefs = (next: { lang: Lang; orderType: OrderType }) => {
    setPrefs(next);
    try {
      window.localStorage.setItem(prefsKey(slug, tableNumber), JSON.stringify(next));
    } catch {
      // Non-fatal: prefs just won't persist across reloads.
    }
  };

  const t = getStrings(prefs?.lang ?? 'en');

  // Item detail sheet + the "just added" bump on a card.
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [bumpId, setBumpId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pillBarRef = useRef<HTMLDivElement | null>(null);

  const bump = (id: string) => {
    setBumpId(id);
    window.setTimeout(() => setBumpId((cur) => (cur === id ? null : cur)), 220);
  };

  const { data: restaurantData, error: restError, loading: restLoading } = useQuery(PUBLIC_RESTAURANT_QUERY, { variables: { slug } });
  const restaurant = restaurantData?.publicRestaurant;
  const restaurantId: string | undefined = restaurant?._id;

  const { data: menuData, loading, refetch: refetchMenu } = useQuery(PUBLIC_MENU_QUERY, {
    variables: { restaurantId },
    skip: !restaurantId,
  });
  const sections = menuData?.publicMenu ?? [];

  // The table's open tab: every order placed this visit, shared by the whole
  // table, until staff closes it as paid.
  const { data: sessionData, refetch: refetchSession } = useQuery(TABLE_SESSION_QUERY, {
    variables: { restaurantId, tableNumber },
    skip: !restaurantId,
    pollInterval: 20000,
  });
  const session: TableSession | null = sessionData?.tableSession ?? null;
  const placedOrders: Order[] = session?.orders ?? [];
  const tabTotal = session?.totalAmount ?? 0;

  const [placeOrder, { loading: ordering }] = useMutation(PLACE_ORDER_MUTATION, {
    onCompleted() {
      setCart([]);
      setOrderNote('');
      setCartOpen(false);
      setOrderSuccess(true);
      refetchSession();
      refetchMenu();
      setTimeout(() => setFeedbackOpen(true), 2000);
    },
    onError(err) {
      // e.g. an item sold out between browsing and ordering. Surface a friendly
      // message instead of letting the ApolloError crash the page, and refresh
      // the menu so the customer sees updated stock.
      setOrderError(err.message || 'Something went wrong. Please try again.');
      refetchMenu();
    },
  });

  const [submitFeedback] = useMutation(SUBMIT_FEEDBACK_MUTATION, {
    onCompleted() { setFeedbackOpen(false); setFeedbackSent(true); },
    onError(err) { setOrderError(err.message || 'Could not submit feedback.'); },
  });

  // How many of each item may still be ordered. Untracked items are unlimited;
  // tracked ones are capped at their remaining stock, so the cart can never ask
  // for more than exists.
  const stockById = useMemo(() => {
    const m = new Map<string, number>();
    for (const section of sections as any[]) {
      for (const it of (section.items ?? []) as MenuItem[]) {
        m.set(it._id, it.trackQuantity ? Math.max(0, it.quantity ?? 0) : Infinity);
      }
    }
    return m;
  }, [menuData]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxFor = (menuItemId: string) => stockById.get(menuItemId) ?? Infinity;

  const addToCart = (item: MenuItem) => {
    const max = maxFor(item._id);
    if (max <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item._id);
      if (existing) {
        if (existing.quantity >= max) return prev; // already at the stock limit
        return prev.map((c) => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (menuItemId: string, delta: number) => {
    const max = maxFor(menuItemId);
    setCart((prev) =>
      prev.map((c) => c.menuItemId === menuItemId
          ? { ...c, quantity: Math.min(c.quantity + delta, max) }
          : c)
         .filter((c) => c.quantity > 0),
    );
  };

  // Stock can drop while the customer is browsing (another table ordered the
  // last one). Trim the cart to what's left so they see it right away instead
  // of hitting an error at checkout.
  useEffect(() => {
    setCart((prev) => {
      const next = prev
        .map((c) => {
          const max = maxFor(c.menuItemId);
          return c.quantity > max ? { ...c, quantity: max } : c;
        })
        .filter((c) => c.quantity > 0);
      const changed =
        next.length !== prev.length ||
        next.some((c, i) => c.quantity !== prev[i].quantity);
      return changed ? next : prev;
    });
  }, [stockById]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quick add straight from the card (the sheet handles quantity + notes).
  const quickAdd = (item: MenuItem) => {
    addToCart(item);
    bump(item._id);
  };

  // Set an exact quantity/note for one line — used by the detail sheet.
  const setCartLine = (item: MenuItem, quantity: number, note: string) => {
    const q = Math.min(quantity, maxFor(item._id));
    setCart((prev) => {
      if (q <= 0) return prev.filter((c) => c.menuItemId !== item._id);
      const exists = prev.some((c) => c.menuItemId === item._id);
      if (exists) {
        return prev.map((c) =>
          c.menuItemId === item._id ? { ...c, quantity: q, notes: note || undefined } : c);
      }
      return [...prev, {
        menuItemId: item._id, name: item.name, price: item.price,
        quantity: q, notes: note || undefined,
      }];
    });
  };

  const scrollToSection = (catId: string) => {
    const el = sectionRefs.current[catId];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 104;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // Scroll-spy: highlight whichever section is currently under the pill bar.
  useEffect(() => {
    const els = Object.values(sectionRefs.current).filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = visible?.target.getAttribute('data-cat');
        if (id) setActiveCat(id);
      },
      // Band just under the sticky pill bar, so the active pill flips as a
      // section's heading reaches the top rather than when it merely appears.
      { rootMargin: '-110px 0px -65% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [menuData]);

  // Keep the active pill in view as the spy moves through sections.
  useEffect(() => {
    if (!activeCat || !pillBarRef.current) return;
    const pill = pillBarRef.current.querySelector(`[data-pill="${activeCat}"]`);
    pill?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeCat]);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const currency = restaurant?.currency || 'KRW';
  const fmt = (n: number) => formatMoney(n, currency);

  const handlePlaceOrder = () => {
    if (!cart.length || !restaurantId) return;
    placeOrder({
      variables: {
        input: {
          restaurantId,
          tableNumber,
          items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity, notes: c.notes })),
          customerNote: orderNote,
          language: prefs?.lang ?? 'en',
          orderType: prefs?.orderType ?? 'DINE_IN',
        },
      },
    });
  };


  // First scan of this sitting: ask for language, then dine-in vs take-out.
  // Held until localStorage has been read so the gate doesn't flash.
  if (prefsLoaded && !prefs && !restError) {
    return (
      <>
        <Head>
          <title>{restaurant?.name || 'Menu'}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <WelcomeGate
          restaurantName={restaurant?.name}
          logo={restaurant?.logo}
          tableNumber={tableNumber}
          onComplete={(lang, orderType) => savePrefs({ lang, orderType })}
        />
      </>
    );
  }

  // Restaurant not available (pending approval, rejected, or suspended) — the
  // publicRestaurant query is rejected by the backend gate.
  if (restError && !restLoading) {
    return (
      <>
        <Head><title>Menu unavailable</title></Head>
        <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA', maxWidth: 480, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Card sx={{ width: '100%', textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography sx={{ fontSize: 48, mb: 1 }}>🍽️</Typography>
              <Typography variant="h6" fontWeight={800} mb={1}>{t.menuUnavailable}</Typography>
              <Typography color="text.secondary">{t.menuUnavailableHint}</Typography>
            </CardContent>
          </Card>
        </Box>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{restaurant?.name || 'Menu'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA', maxWidth: 480, mx: 'auto', position: 'relative' }}>

        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
            pt: 4, pb: 6, px: 2.5, position: 'relative',
          }}
        >
          {/* Language switcher — the gate sets it once, this allows changing it later. */}
          <IconButton
            onClick={(e) => setLangMenuAnchor(e.currentTarget)}
            aria-label={t.chooseLanguage}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
          >
            <Typography component="span" sx={{ fontSize: '1.3rem', lineHeight: 1 }}>
              {LANGUAGES.find((l) => l.code === prefs?.lang)?.flag ?? '🌐'}
            </Typography>
          </IconButton>
          <Menu
            anchorEl={langMenuAnchor}
            open={!!langMenuAnchor}
            onClose={() => setLangMenuAnchor(null)}
          >
            {LANGUAGES.map((l) => (
              <MuiMenuItem
                key={l.code}
                selected={l.code === prefs?.lang}
                onClick={() => {
                  if (prefs) savePrefs({ ...prefs, lang: l.code });
                  setLangMenuAnchor(null);
                }}
              >
                <Typography component="span" sx={{ fontSize: '1.2rem', mr: 1.5 }}>{l.flag}</Typography>
                {l.label}
              </MuiMenuItem>
            ))}
          </Menu>

          {restaurant?.logo && (
            <Avatar src={restaurant.logo} sx={{ width: 56, height: 56, mb: 1.5, mx: 'auto' }} />
          )}
          <Typography variant="h5" fontWeight={800} color="white" textAlign="center">
            {restaurant?.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.400', textAlign: 'center', mt: 0.5 }}>
            {t.table} {tableNumber} · {prefs?.orderType === 'TAKE_OUT' ? t.takeOut : t.dineIn}
          </Typography>
        </Box>

        {/* Category pills — tapping scrolls to that section; the active pill
            follows the scroll position (scroll-spy). */}
        <Box
          ref={pillBarRef}
          sx={{
            px: 2, py: 1.5, bgcolor: 'white', borderBottom: '1px solid #F1F5F9',
            position: 'sticky', top: 0, zIndex: 10, overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ minWidth: 'max-content' }}>
            {sections.map((section: any) => {
              const active = activeCat === section.category._id;
              return (
                <Chip
                  key={section.category._id}
                  data-pill={section.category._id}
                  label={section.category.name}
                  onClick={() => scrollToSection(section.category._id)}
                  color={active ? 'primary' : 'default'}
                  sx={{
                    fontWeight: 700,
                    transition: 'transform .18s ease, background-color .18s ease',
                    transform: active ? 'scale(1.04)' : 'none',
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Menu sections */}
        <Box sx={{ pb: 14, px: 2, pt: 2 }}>
          {loading && !sections.length && (
            <Stack spacing={1.5}>
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.75}>
                      <Skeleton variant="rounded" width={88} height={88} sx={{ borderRadius: 3, flexShrink: 0 }} />
                      <Box flex={1}>
                        <Skeleton width="60%" height={22} />
                        <Skeleton width="90%" height={16} />
                        <Skeleton width="35%" height={22} sx={{ mt: 1.5 }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {sections.map((section: any) => (
            <Box
              key={section.category._id}
              ref={(el: HTMLDivElement | null) => { sectionRefs.current[section.category._id] = el; }}
              data-cat={section.category._id}
              sx={{ mb: 3, scrollMarginTop: '110px' }}
            >
              <Typography variant="h6" fontWeight={800} mb={1.5} mt={1}>
                {section.category.name}
              </Typography>
              <Stack spacing={1.5}>
                {section.items.map((item: MenuItem) => {
                  const cartItem = cart.find((c) => c.menuItemId === item._id);
                  const desc = item.description ?? '';
                  // Stock signalling for tracked items: show the count at 5 or
                  // fewer left, "Sold out" at 0 (which also blocks ordering),
                  // and stop the cart from exceeding what's in stock.
                  const remaining = maxFor(item._id);
                  const soldOut = !item.isAvailable || remaining <= 0;
                  const lowStock = Number.isFinite(remaining) && remaining > 0 && remaining <= 5;
                  const atMax = !!cartItem && cartItem.quantity >= remaining;
                  const bumping = bumpId === item._id;
                  return (
                    <Card
                      key={item._id}
                      onClick={() => { if (!soldOut) setSheetItem(item); }}
                      sx={{
                        borderRadius: 4,
                        opacity: soldOut ? 0.55 : 1,
                        cursor: soldOut ? 'default' : 'pointer',
                        border: '1px solid',
                        borderColor: cartItem ? 'primary.main' : '#F1F5F9',
                        transition: 'transform .18s ease, border-color .18s ease',
                        transform: bumping ? 'scale(0.985)' : 'none',
                      }}
                    >
                      <CardContent sx={{ p: 2, pb: '12px !important' }}>
                        <Stack direction="row" spacing={1.75} alignItems="flex-start">
                          <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            {item.imageUrl ? (
                              <Box
                                component="img"
                                src={item.imageUrl}
                                alt={item.name}
                                loading="lazy"
                                sx={{ width: 88, height: 88, borderRadius: 3, objectFit: 'cover', display: 'block' }}
                              />
                            ) : (
                              <Avatar variant="rounded" sx={{ width: 88, height: 88, borderRadius: 3, bgcolor: '#FFF7ED', fontSize: '2rem' }}>🍽</Avatar>
                            )}
                            {cartItem && (
                              <Box
                                sx={{
                                  position: 'absolute', top: -6, left: -6, minWidth: 24, height: 24, px: 0.5,
                                  borderRadius: '999px', bgcolor: 'primary.main', color: 'white',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.75rem', fontWeight: 800,
                                  boxShadow: '0 2px 8px rgba(249,115,22,0.5)',
                                }}
                              >
                                {cartItem.quantity}
                              </Box>
                            )}
                          </Box>

                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.3}>
                              <Typography fontWeight={700} fontSize="0.98rem" noWrap sx={{ minWidth: 0 }}>
                                {item.name}
                              </Typography>
                              {item.isPopular && <Star sx={{ fontSize: 15, color: '#F59E0B', flexShrink: 0 }} />}
                            </Stack>
                            {desc && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {desc}
                              </Typography>
                            )}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.25}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography fontWeight={800} color="primary">{fmt(item.price)}</Typography>
                                {lowStock && (
                                  <Chip
                                    label={`${remaining} ${t.left}`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                                  />
                                )}
                              </Stack>
                              {soldOut ? (
                                <Chip label={t.soldOut} size="small" color="error" variant="outlined" />
                              ) : (
                                <IconButton
                                  aria-label={t.addToCart}
                                  disabled={atMax}
                                  onClick={(e) => { e.stopPropagation(); quickAdd(item); }}
                                  sx={{
                                    bgcolor: 'primary.main', color: 'white', width: 34, height: 34,
                                    transition: 'transform .18s ease',
                                    transform: bumping ? 'scale(1.18)' : 'none',
                                    '&:hover': { bgcolor: 'primary.dark' },
                                    '&.Mui-disabled': { bgcolor: 'grey.300', color: 'white' },
                                  }}
                                >
                                  <Add sx={{ fontSize: 18 }} />
                                </IconButton>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Box>

        {/* Floating cart + running tab buttons — slide up rather than pop in */}
        <Slide direction="up" in={cartCount > 0 || placedOrders.length > 0} mountOnEnter unmountOnExit>
          <Box sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 200, width: 'calc(100% - 32px)', maxWidth: 448 }}>
            <Stack direction="row" spacing={1.5}>
              {placedOrders.length > 0 && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setTabOpen(true)}
                  startIcon={<ReceiptLong />}
                  sx={{
                    py: 1.8, borderRadius: 3, fontSize: '1rem', whiteSpace: 'nowrap',
                    flex: cartCount > 0 ? '0 0 auto' : 1,
                    bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' },
                    boxShadow: '0 8px 30px rgba(15,23,42,0.35)',
                  }}
                >
                  {cartCount > 0 ? fmt(tabTotal) : `${t.myOrders} — ${fmt(tabTotal)}`}
                </Button>
              )}
              {cartCount > 0 && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => setCartOpen(true)}
                  sx={{ py: 1.8, borderRadius: 3, flex: 1, boxShadow: '0 8px 30px rgba(249,115,22,0.4)', fontSize: '1rem' }}
                  startIcon={<ShoppingCart />}
                >
                  {t.cart} ({cartCount}) — {fmt(cartTotal)}
                </Button>
              )}
            </Stack>
          </Box>
        </Slide>

        {/* Dish detail: big image, allergens, quantity and a per-item note */}
        <ItemSheet
          item={sheetItem}
          open={!!sheetItem}
          t={t}
          fmt={fmt}
          max={sheetItem ? maxFor(sheetItem._id) : 0}
          inCart={cart.find((c) => c.menuItemId === sheetItem?._id)?.quantity ?? 0}
          cartNote={cart.find((c) => c.menuItemId === sheetItem?._id)?.notes}
          onClose={() => setSheetItem(null)}
          onConfirm={(quantity, note) => {
            if (sheetItem) {
              setCartLine(sheetItem, quantity, note);
              bump(sheetItem._id);
            }
            setSheetItem(null);
          }}
        />

        {/* Running tab drawer — all orders this visit + grand total */}
        <Drawer anchor="bottom" open={tabOpen} onClose={() => setTabOpen(false)}
          PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '80vh', maxWidth: 480, mx: 'auto' } }}>
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={800}>{t.myOrders}</Typography>
              <IconButton onClick={() => setTabOpen(false)}><Close /></IconButton>
            </Stack>
            <Stack spacing={2} mb={2} sx={{ overflowY: 'auto' }}>
              {placedOrders.map((order, idx) => {
                return (
                  <Box key={order._id} sx={{ border: '1px solid #F1F5F9', borderRadius: 3, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700} fontSize="0.9rem">
                        {t.orderN} #{idx + 1}
                        <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Typography>
                    </Stack>
                    <OrderProgress t={t} status={order.status} />
                    <Box sx={{ mt: 1 }} />
                    {order.items.map((item, i) => (
                      <Stack key={i} direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ textDecoration: order.status === 'CANCELLED' ? 'line-through' : 'none' }}>
                          {item.name} × {item.quantity}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>{fmt(item.price * item.quantity)}</Typography>
                      </Stack>
                    ))}
                  </Box>
                );
              })}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography fontWeight={700}>{t.tabTotal}</Typography>
              <Typography fontWeight={800} color="primary" fontSize="1.1rem">{fmt(tabTotal)}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">{t.payNote}</Typography>
          </Box>
        </Drawer>

        {/* Cart drawer */}
        <Drawer anchor="bottom" open={cartOpen} onClose={() => setCartOpen(false)}
          PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '80vh', maxWidth: 480, mx: 'auto' } }}>
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={800}>{t.cart}</Typography>
              <IconButton onClick={() => setCartOpen(false)}><Close /></IconButton>
            </Stack>
            <Stack spacing={1.5} mb={2}>
              {cart.map((item) => {
                const max = maxFor(item.menuItemId);
                const atMax = item.quantity >= max;
                return (
                  <Stack key={item.menuItemId} direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                      {item.notes && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          📝 {item.notes}
                        </Typography>
                      )}
                      {atMax && Number.isFinite(max) && (
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                          {t.onlyLeft.replace('{n}', String(max))}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconButton size="small" onClick={() => updateQty(item.menuItemId, -1)}><Remove fontSize="small" /></IconButton>
                      <Typography fontWeight={700}>{item.quantity}</Typography>
                      <IconButton size="small" disabled={atMax} onClick={() => updateQty(item.menuItemId, 1)}>
                        <Add fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" fontWeight={600} sx={{ minWidth: 60, textAlign: 'right' }}>
                        {fmt(item.price * item.quantity)}
                      </Typography>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
            <TextField
              label={t.note}
              placeholder={t.noteHint}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              fullWidth multiline rows={2} sx={{ mb: 2 }}
            />
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Typography fontWeight={700}>{t.total}</Typography>
              <Typography fontWeight={800} color="primary" fontSize="1.1rem">{fmt(cartTotal)}</Typography>
            </Stack>
            <Button
              fullWidth variant="contained" size="large"
              onClick={handlePlaceOrder} disabled={ordering || !cart.length}
              sx={{ py: 1.8, borderRadius: 3, fontSize: '1rem' }}
            >
              {ordering ? '...' : t.placeOrder}
            </Button>
          </Box>
        </Drawer>

        {/* Order success */}
        <Snackbar open={orderSuccess} autoHideDuration={4000} onClose={() => setOrderSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="success" icon={<ThumbUp />} sx={{ borderRadius: 3, fontWeight: 600 }}>
            {t.orderPlaced} 🎉
          </Alert>
        </Snackbar>

        {/* Order failure (e.g. an item sold out before the order went through) */}
        <Snackbar open={!!orderError} autoHideDuration={6000} onClose={() => setOrderError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setOrderError(null)} sx={{ borderRadius: 3, fontWeight: 600 }}>
            {orderError}
          </Alert>
        </Snackbar>

        {/* Feedback dialog */}
        <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2 } }}>
          <DialogTitle textAlign="center" fontWeight={800}>{t.feedbackTitle}</DialogTitle>
          <DialogContent>
            <Stack alignItems="center" spacing={2}>
              <Stack direction="row" spacing={0.5}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <IconButton key={s} onClick={() => setRating(s)} sx={{ p: 0.5 }}>
                    <Star sx={{ fontSize: 40, color: s <= rating ? '#F59E0B' : '#E2E8F0' }} />
                  </IconButton>
                ))}
              </Stack>
              <TextField
                label={t.comment}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                fullWidth multiline rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setFeedbackOpen(false)}>{t.cancel}</Button>
            <Button
              variant="contained" onClick={() => submitFeedback({
                variables: { input: { restaurantId, rating, comment: feedbackComment, language: 'en', tableNumber } },
              })}
            >
              {t.submit}
            </Button>
          </DialogActions>
        </Dialog>

        {feedbackSent && (
          <Snackbar open autoHideDuration={3000} onClose={() => setFeedbackSent(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert severity="success" sx={{ borderRadius: 3 }}>{t.thanks} 🙏</Alert>
          </Snackbar>
        )}
      </Box>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  const tableNumber = parseInt(params?.tableNumber as string, 10);

  if (!slug || isNaN(tableNumber)) {
    return { notFound: true };
  }

  // restaurantId is resolved client-side from the publicRestaurant(slug) query result.
  return {
    props: {
      slug,
      tableNumber,
    },
  };
};

export default PublicMenuPage;
