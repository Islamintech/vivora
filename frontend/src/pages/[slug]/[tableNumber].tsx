import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Typography, Stack, Card, CardContent, Button, Chip,
  IconButton, Drawer, Badge, Avatar, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  ToggleButtonGroup, ToggleButton, Snackbar, Alert, LinearProgress,
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

const ui = {
  addToCart: 'Add', cart: 'Your Order', placeOrder: 'Place Order', total: 'Total',
  note: 'Special instructions', empty: 'Your cart is empty', unavailable: 'Unavailable',
  popular: 'Popular', orderPlaced: 'Order placed!', feedbackTitle: 'How was your experience?',
  feedbackBtn: 'Leave Feedback', cancel: 'Cancel', submit: 'Submit',
  noteHint: 'Any allergies or special requests?', close: 'Close',
  myOrders: 'My orders', tabTotal: 'Total so far',
  payNote: 'Show this to the staff when you are ready to pay.',
  orderN: 'Order', soldOut: 'Sold out', left: 'left',
  onlyLeft: 'Only {n} left in stock',
};

// Customer-facing status labels (dashboard uses the Uzbek statusLabel map).
const customerStatus: Record<OrderStatus, { label: string; color: 'warning' | 'info' | 'success' | 'error' | 'default' }> = {
  PENDING: { label: 'Received', color: 'warning' },
  PREPARING: { label: 'Preparing', color: 'info' },
  READY: { label: 'Ready', color: 'success' },
  SERVED: { label: 'Served', color: 'default' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
};

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
          language: 'en',
        },
      },
    });
  };

  const filteredSections = activeCat ? sections.filter((s: any) => s.category._id === activeCat) : sections;

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
              <Typography variant="h6" fontWeight={800} mb={1}>Menu is not available</Typography>
              <Typography color="text.secondary">
                This restaurant isn’t accepting orders right now. Please check back later.
              </Typography>
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
          {restaurant?.logo && (
            <Avatar src={restaurant.logo} sx={{ width: 56, height: 56, mb: 1.5, mx: 'auto' }} />
          )}
          <Typography variant="h5" fontWeight={800} color="white" textAlign="center">
            {restaurant?.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.400', textAlign: 'center', mt: 0.5 }}>
            Table {tableNumber}
          </Typography>
        </Box>

        {/* Category filter pills */}
        {loading && <LinearProgress />}
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'white', borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, zIndex: 10, overflowX: 'auto' }}>
          <Stack direction="row" spacing={1} sx={{ minWidth: 'max-content' }}>
            <Chip
              label="All"
              onClick={() => setActiveCat(null)}
              color={activeCat === null ? 'primary' : 'default'}
              sx={{ fontWeight: 600 }}
            />
            {sections.map((section: any) => (
              <Chip
                key={section.category._id}
                label={section.category.name}
                onClick={() => setActiveCat(section.category._id)}
                color={activeCat === section.category._id ? 'primary' : 'default'}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Menu sections */}
        <Box sx={{ pb: 12, px: 2, pt: 2 }}>
          {filteredSections.map((section: any) => (
            <Box key={section.category._id} mb={3}>
              <Typography variant="h6" fontWeight={800} mb={1.5} mt={1}>
                {section.category.name}
              </Typography>
              <Stack spacing={1.5}>
                {section.items.map((item: MenuItem) => {
                  const cartItem = cart.find((c) => c.menuItemId === item._id);
                  const name = item.name;
                  const desc = item.description ?? '';
                  // Stock signalling for tracked items: show the count at 5 or
                  // fewer left, "Sold out" at 0 (which also blocks ordering),
                  // and stop the cart from exceeding what's in stock.
                  const remaining = maxFor(item._id);
                  const soldOut = !item.isAvailable || remaining <= 0;
                  const lowStock = Number.isFinite(remaining) && remaining > 0 && remaining <= 5;
                  const atMax = !!cartItem && cartItem.quantity >= remaining;
                  return (
                    <Card key={item._id} sx={{ borderRadius: 3, opacity: soldOut ? 0.55 : 1 }}>
                      <CardContent sx={{ p: 2, pb: '12px !important' }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          {item.imageUrl ? (
                            <Box
                              component="img"
                              src={item.imageUrl}
                              alt={name}
                              sx={{ width: 80, height: 80, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <Avatar sx={{ width: 80, height: 80, borderRadius: 2, bgcolor: '#FFF7ED', fontSize: '2rem' }}>🍽</Avatar>
                          )}
                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.3}>
                              <Typography fontWeight={700} fontSize="0.95rem" noWrap>{name}</Typography>
                              {item.isPopular && <Star sx={{ fontSize: 14, color: '#F59E0B' }} />}
                            </Stack>
                            {desc && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {desc}
                              </Typography>
                            )}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography fontWeight={700} color="primary">{fmt(item.price)}</Typography>
                                {lowStock && (
                                  <Chip
                                    label={`${remaining} ${ui.left}`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                                  />
                                )}
                              </Stack>
                              {soldOut ? (
                                <Chip label={ui.soldOut} size="small" color="error" variant="outlined" />
                              ) : cartItem ? (
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <IconButton size="small" onClick={() => updateQty(item._id, -1)} sx={{ bgcolor: 'primary.light', width: 28, height: 28 }}>
                                    <Remove sx={{ fontSize: 14 }} />
                                  </IconButton>
                                  <Typography fontWeight={700} sx={{ minWidth: 20, textAlign: 'center' }}>{cartItem.quantity}</Typography>
                                  <IconButton
                                    size="small"
                                    disabled={atMax}
                                    onClick={() => addToCart(item)}
                                    sx={{ bgcolor: 'primary.main', color: 'white', width: 28, height: 28, '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'grey.300' } }}
                                  >
                                    <Add sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Stack>
                              ) : (
                                <Button size="small" variant="contained" onClick={() => addToCart(item)} sx={{ minWidth: 64, borderRadius: 2 }}>
                                  {ui.addToCart}
                                </Button>
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

        {/* Floating cart + running tab buttons */}
        {(cartCount > 0 || placedOrders.length > 0) && (
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
                  {cartCount > 0 ? fmt(tabTotal) : `${ui.myOrders} — ${fmt(tabTotal)}`}
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
                  {ui.cart} ({cartCount}) — {fmt(cartTotal)}
                </Button>
              )}
            </Stack>
          </Box>
        )}

        {/* Running tab drawer — all orders this visit + grand total */}
        <Drawer anchor="bottom" open={tabOpen} onClose={() => setTabOpen(false)}
          PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '80vh', maxWidth: 480, mx: 'auto' } }}>
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={800}>{ui.myOrders}</Typography>
              <IconButton onClick={() => setTabOpen(false)}><Close /></IconButton>
            </Stack>
            <Stack spacing={2} mb={2} sx={{ overflowY: 'auto' }}>
              {placedOrders.map((order, idx) => {
                const st = customerStatus[order.status];
                return (
                  <Box key={order._id} sx={{ border: '1px solid #F1F5F9', borderRadius: 3, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography fontWeight={700} fontSize="0.9rem">
                        {ui.orderN} #{idx + 1}
                        <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Typography>
                      <Chip label={st.label} color={st.color} size="small" />
                    </Stack>
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
              <Typography fontWeight={700}>{ui.tabTotal}</Typography>
              <Typography fontWeight={800} color="primary" fontSize="1.1rem">{fmt(tabTotal)}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">{ui.payNote}</Typography>
          </Box>
        </Drawer>

        {/* Cart drawer */}
        <Drawer anchor="bottom" open={cartOpen} onClose={() => setCartOpen(false)}
          PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '80vh', maxWidth: 480, mx: 'auto' } }}>
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={800}>{ui.cart}</Typography>
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
                      {atMax && Number.isFinite(max) && (
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                          {ui.onlyLeft.replace('{n}', String(max))}
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
              label={ui.note}
              placeholder={ui.noteHint}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              fullWidth multiline rows={2} sx={{ mb: 2 }}
            />
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Typography fontWeight={700}>{ui.total}</Typography>
              <Typography fontWeight={800} color="primary" fontSize="1.1rem">{fmt(cartTotal)}</Typography>
            </Stack>
            <Button
              fullWidth variant="contained" size="large"
              onClick={handlePlaceOrder} disabled={ordering || !cart.length}
              sx={{ py: 1.8, borderRadius: 3, fontSize: '1rem' }}
            >
              {ordering ? '...' : ui.placeOrder}
            </Button>
          </Box>
        </Drawer>

        {/* Order success */}
        <Snackbar open={orderSuccess} autoHideDuration={4000} onClose={() => setOrderSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="success" icon={<ThumbUp />} sx={{ borderRadius: 3, fontWeight: 600 }}>
            {ui.orderPlaced} 🎉
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
          <DialogTitle textAlign="center" fontWeight={800}>{ui.feedbackTitle}</DialogTitle>
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
                label="Comment (optional)"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                fullWidth multiline rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setFeedbackOpen(false)}>{ui.cancel}</Button>
            <Button
              variant="contained" onClick={() => submitFeedback({
                variables: { input: { restaurantId, rating, comment: feedbackComment, language: 'en', tableNumber } },
              })}
            >
              {ui.submit}
            </Button>
          </DialogActions>
        </Dialog>

        {feedbackSent && (
          <Snackbar open autoHideDuration={3000} onClose={() => setFeedbackSent(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert severity="success" sx={{ borderRadius: 3 }}>Thank you for your feedback! 🙏</Alert>
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
