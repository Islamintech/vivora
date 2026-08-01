import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Button, Stack, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Switch, FormControlLabel, Avatar, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Tooltip,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Add, Edit, Delete, ExpandMore, DragIndicator,
  PhotoCamera, Close, Translate, ArrowUpward, ArrowDownward,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import DashboardLayout from '../../libs/components/dashboard/DashboardLayout';
import { CREATE_CATEGORY_MUTATION, CREATE_MENU_ITEM_MUTATION, UPDATE_MENU_ITEM_MUTATION, DELETE_MENU_ITEM_MUTATION, DELETE_CATEGORY_MUTATION, REORDER_CATEGORIES_MUTATION, UPDATE_CATEGORY_MUTATION } from '../../apollo/user/mutation';
import { CATEGORIES_QUERY, MENU_ITEMS_QUERY } from '../../apollo/user/query';
import { useRequireAuth } from '../../libs/hooks/useAuth';
import { MenuItem, MenuCategory } from '../../libs/types';
import { formatMoney } from '../../libs/money';
import { useCurrency } from '../../libs/hooks/useCurrency';
import { uploadImage, cloudinaryConfigured } from '../../libs/cloudinary';

// The customer menu's languages other than Uzbek, which is the original.
const TRANSLATION_LANGS = [
  { code: 'en' as const, label: 'English' },
  { code: 'ru' as const, label: 'Русский' },
  { code: 'ko' as const, label: '한국어' },
];

const MenuPage: NextPage = () => {
  const { user } = useRequireAuth();
  const currency = useCurrency();
  // The item form is tall - go full-screen on phones so it scrolls naturally.
  const fullScreenDialog = useMediaQuery(useTheme().breakpoints.down('sm'));

  const { data: catData, refetch: refetchCats } = useQuery(CATEGORIES_QUERY, { skip: !user });
  const { data: itemData, refetch: refetchItems } = useQuery(MENU_ITEMS_QUERY, { skip: !user });

  const items: MenuItem[] = itemData?.menuItems ?? [];

  // --- Category order ----------------------------------------------------
  // The server sorts by `order`, but a drag has to look instant, so the list
  // is held locally while the mutation is in flight and handed back to the
  // query result once the new order is stored.
  const serverCats: MenuCategory[] = catData?.categories ?? [];
  const [draftCats, setDraftCats] = useState<MenuCategory[] | null>(null);
  const categories = draftCats ?? serverCats;

  // dragIndex drives the styling; dragIndexRef is what the drop handler trusts.
  // Same reason as the grip: drag events can fire faster than React commits, so
  // the handler's closure may still hold the pre-drag value.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  // A whole accordion being draggable would fight with expanding it and with
  // selecting the title, so dragging is armed only from the grip handle.
  // A ref, not state: mousedown and dragstart can arrive in the same frame, and
  // a state update would not have been committed yet - dragstart would read the
  // stale value and cancel every drag.
  const gripArmed = useRef(false);

  const [reorderCategories] = useMutation(REORDER_CATEGORIES_MUTATION, {
    onCompleted() { setDraftCats(null); refetchCats(); },
    onError(e) {
      // Snap back to the stored order - leaving the dragged position on screen
      // would tell the owner it saved when it did not.
      setDraftCats(null);
      toast.error(e.message);
    },
  });

  const moveCategory = (from: number, to: number) => {
    if (to < 0 || to >= categories.length || from === to) return;
    const next = [...categories];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraftCats(next);
    reorderCategories({ variables: { categoryIds: next.map((c) => c._id) } });
  };

  // Category dialog - the same dialog creates and renames, like the item one.
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '' });

  const openCreateCategory = () => { setEditingCat(null); setCatForm({ name: '' }); setCatDialog(true); };
  const openRenameCategory = (cat: MenuCategory) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name });
    setCatDialog(true);
  };
  const closeCatDialog = () => { setCatDialog(false); setEditingCat(null); };

  // Item dialog
  const [itemDialog, setItemDialog] = useState<'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    images: [] as string[],
    translations: {} as Partial<Record<'en' | 'ru' | 'ko', { name?: string; description?: string }>>,
    tags: '',
    isAvailable: true,
    isPopular: false,
    trackQuantity: false,
    quantity: '',
  });
  const [uploading, setUploading] = useState(false);
  // Whether the owner typed in the translation boxes during this edit.
  const [translationsTouched, setTranslationsTouched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Several photos at once: a dish is usually shot from a few angles in one
  // sitting, and picking them one at a time is the tedious way to do it.
  const handleUpload = async (files?: FileList | null) => {
    if (!files?.length) return;
    if (!cloudinaryConfigured) {
      toast.error('Rasm yuklash sozlanmagan. Buning o‘rniga rasm havolasini joylashtiring.');
      return;
    }
    setUploading(true);
    const chosen = Array.from(files);
    const results = await Promise.allSettled(chosen.map((f) => uploadImage(f)));
    const urls = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value);
    const failed = results.length - urls.length;

    if (urls.length) setItemForm((p) => ({ ...p, images: [...p.images, ...urls] }));
    if (urls.length) toast.success(`${urls.length} ta rasm yuklandi`);
    // Don't let one bad file silently swallow the whole batch.
    if (failed) toast.error(`${failed} ta rasm yuklanmadi`);
    setUploading(false);
  };

  const removeImage = (url: string) =>
    setItemForm((p) => ({ ...p, images: p.images.filter((u) => u !== url) }));

  // The first image is the one the menu card and the kitchen ticket use.
  const makePrimary = (url: string) =>
    setItemForm((p) => ({ ...p, images: [url, ...p.images.filter((u) => u !== url)] }));

  // Translation runs in the background on the server so that saving a dish
  // never waits on a network call, and it lands a few seconds after the
  // mutation returns. Refetching only once - immediately - therefore always
  // draws the row untranslated, and nothing ever asks again, so it looks like
  // translation is broken when it simply had not finished yet. These follow-up
  // reads cover that window; the timers are cleared on unmount so leaving the
  // page mid-translation does not set state on a dead component.
  const settleTimers = useRef<number[]>([]);
  useEffect(() => () => settleTimers.current.forEach(clearTimeout), []);

  const refetchAfterTranslation = (refetch: () => void) => {
    settleTimers.current.forEach(clearTimeout);
    settleTimers.current = [3000, 7000, 12000].map((ms) =>
      window.setTimeout(refetch, ms),
    );
  };

  const [createCategory] = useMutation(CREATE_CATEGORY_MUTATION, {
    onCompleted() {
      toast.success('Kategoriya yaratildi. Tarjima bir necha soniyada tayyor bo‘ladi.');
      closeCatDialog();
      refetchCats();
      refetchAfterTranslation(refetchCats);
    },
    onError(e) { toast.error(e.message); },
  });

  const [updateCategory] = useMutation(UPDATE_CATEGORY_MUTATION, {
    onCompleted() {
      // A renamed category is re-translated server-side, on the same few-second
      // delay as a new one, so it needs the same follow-up reads.
      toast.success('Kategoriya yangilandi. Tarjima bir necha soniyada tayyor bo‘ladi.');
      closeCatDialog();
      refetchCats();
      refetchAfterTranslation(refetchCats);
    },
    onError(e) { toast.error(e.message); },
  });

  const [createItem] = useMutation(CREATE_MENU_ITEM_MUTATION, {
    onCompleted() {
      toast.success('Taom qo‘shildi. Tarjima bir necha soniyada tayyor bo‘ladi.');
      setItemDialog(null);
      refetchItems();
      refetchAfterTranslation(refetchItems);
    },
    onError(e) { toast.error(e.message); },
  });

  const [updateItem] = useMutation(UPDATE_MENU_ITEM_MUTATION, {
    onCompleted() {
      toast.success('Taom yangilandi');
      setItemDialog(null);
      refetchItems();
      // A rename re-translates, so the same delay applies here.
      refetchAfterTranslation(refetchItems);
    },
    onError(e) { toast.error(e.message); },
  });

  const [deleteItem] = useMutation(DELETE_MENU_ITEM_MUTATION, {
    onCompleted() { toast.success('Taom o‘chirildi'); refetchItems(); },
    onError(e) { toast.error(e.message); },
  });

  const [deleteCategory] = useMutation(DELETE_CATEGORY_MUTATION, {
    onCompleted() { toast.success('Kategoriya o‘chirildi'); refetchCats(); refetchItems(); },
    onError(e) { toast.error(e.message); },
  });

  const submitCategory = () => {
    const name = catForm.name.trim();
    if (!name) return;
    if (editingCat) {
      // Nothing changed - don't spend a translation call on a no-op save.
      if (name === editingCat.name) { closeCatDialog(); return; }
      updateCategory({ variables: { input: { categoryId: editingCat._id, name } } });
    } else {
      createCategory({ variables: { input: { name } } });
    }
  };

  const openCreateItem = (categoryId: string) => {
    setEditingItem(null);
    setItemForm({ categoryId, name: '', description: '', price: '', images: [], translations: {}, tags: '', isAvailable: true, isPopular: false, trackQuantity: false, quantity: '' });
    setTranslationsTouched(false);
    setItemDialog('create');
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      // Items saved before galleries existed have only imageUrl.
      images: item.images?.length ? item.images : (item.imageUrl ? [item.imageUrl] : []),
      // Strip __typename so the object can go straight back as an input.
      translations: {
        en: item.translations?.en ? { name: item.translations.en.name ?? '', description: item.translations.en.description ?? '' } : undefined,
        ru: item.translations?.ru ? { name: item.translations.ru.name ?? '', description: item.translations.ru.description ?? '' } : undefined,
        ko: item.translations?.ko ? { name: item.translations.ko.name ?? '', description: item.translations.ko.description ?? '' } : undefined,
      },
      tags: item.tags.join(', '),
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      trackQuantity: item.trackQuantity,
      quantity: String(item.quantity ?? 0),
    });
    setTranslationsTouched(false);
    setItemDialog('edit');
  };

  const handleSaveItem = () => {
    const { translations, ...rest } = itemForm;
    const payload: Record<string, unknown> = {
      ...rest,
      price: parseFloat(itemForm.price),
      quantity: parseInt(itemForm.quantity, 10) || 0,
      tags: itemForm.tags.split(',').map((s) => s.trim()).filter(Boolean),
    };
    // Sending translations tells the server they were corrected by hand, which
    // stops it re-translating. Only say that when the owner actually typed in
    // the box - otherwise renaming a dish would never update its translation.
    if (translationsTouched) payload.translations = translations;
    if (itemDialog === 'create') {
      createItem({ variables: { input: payload } });
    } else if (editingItem) {
      const { categoryId, ...update } = payload;
      updateItem({ variables: { input: { itemId: editingItem._id, ...update } } });
    }
  };

  return (
    <>
      <Head><title>Menyu boshqaruvi - Vivora</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={4}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Menyu boshqaruvi</Typography>
              <Typography color="text.secondary">Kategoriyalar va taomlarni boshqaring</Typography>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateCategory}>
              Kategoriya qo‘shish
            </Button>
          </Stack>

          {categories.length === 0 && (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">Hali kategoriyalar yo‘q</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Boshlash uchun birinchi menyu kategoriyasini yarating</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={openCreateCategory}>Kategoriya qo‘shish</Button>
            </Card>
          )}

          {categories.length > 1 && (
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Kategoriyalarni suring yoki strelkalar bilan ko‘chiring - mijoz menyuni shu tartibda ko‘radi.
            </Typography>
          )}

          {categories.map((cat, index) => (
            <Accordion
              key={cat._id}
              defaultExpanded
              // Always draggable, then cancelled unless the grip was the thing
              // grabbed. Flipping the attribute on mousedown instead loses a
              // race: the browser decides draggability when the drag starts,
              // which can be before React has committed the state change.
              draggable
              onDragStart={(e) => {
                if (!gripArmed.current) { e.preventDefault(); return; }
                dragIndexRef.current = index;
                setDragIndex(index);
                e.dataTransfer.effectAllowed = 'move';
                // Firefox starts no drag at all without data on the transfer.
                e.dataTransfer.setData('text/plain', cat._id);
              }}
              onDragOver={(e) => {
                if (dragIndexRef.current === null) return;
                // Without preventDefault the browser refuses the drop outright.
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setOverIndex(index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = dragIndexRef.current;
                if (from !== null) moveCategory(from, index);
                dragIndexRef.current = null;
                setDragIndex(null); setOverIndex(null); gripArmed.current = false;
              }}
              onDragEnd={() => {
                dragIndexRef.current = null;
                setDragIndex(null); setOverIndex(null); gripArmed.current = false;
              }}
              sx={{
                mb: 2, borderRadius: '16px !important', '&:before': { display: 'none' },
                opacity: dragIndex === index ? 0.4 : 1,
                // Show where it will land rather than only what is being moved.
                outline: overIndex === index && dragIndex !== index ? '2px solid' : 'none',
                outlineColor: 'primary.main',
                transition: 'opacity .15s',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                  {/* Arming on mouse-down means the accordion is inert until the
                      grip is actually grabbed. Touch screens get no HTML5 drag
                      at all, which is why the arrows below are not optional. */}
                  <Tooltip title="Tartibni o‘zgartirish uchun suring">
                    <DragIndicator
                      onMouseDown={() => { gripArmed.current = true; }}
                      onMouseUp={() => { gripArmed.current = false; }}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ color: 'text.disabled', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
                    />
                  </Tooltip>
                  <Typography fontWeight={700} noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {cat.name || 'Nomsiz kategoriya'}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {categories.length > 1 && (
                      <Stack direction="row">
                        <Tooltip title="Yuqoriga">
                          {/* span: a disabled button fires no events, and a
                              Tooltip with nothing to listen to warns. */}
                          <span>
                            <IconButton
                              size="small"
                              disabled={index === 0}
                              aria-label={`${cat.name} - yuqoriga`}
                              onClick={(e) => { e.stopPropagation(); moveCategory(index, index - 1); }}
                            >
                              <ArrowUpward fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Pastga">
                          <span>
                            <IconButton
                              size="small"
                              disabled={index === categories.length - 1}
                              aria-label={`${cat.name} - pastga`}
                              onClick={(e) => { e.stopPropagation(); moveCategory(index, index + 1); }}
                            >
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    )}
                    <Chip label={`${items.filter((i) => i.categoryId === cat._id).length} ta taom`} size="small" />
                    <Tooltip title="Nomini o‘zgartirish">
                      <IconButton
                        size="small"
                        aria-label={`${cat.name} - tahrirlash`}
                        onClick={(e) => { e.stopPropagation(); openRenameCategory(cat); }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Kategoriyani o‘chirish">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => { e.stopPropagation(); if (confirm('Kategoriya va undagi barcha taomlar o‘chirilsinmi?')) deleteCategory({ variables: { categoryId: cat._id } }); }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {items.filter((item) => item.categoryId === cat._id).map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item._id}>
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ pb: '12px !important' }}>
                          <Stack direction="row" spacing={2} alignItems="flex-start">
                            {item.imageUrl ? (
                              <Box
                                component="img"
                                src={item.imageUrl}
                                alt={item.name}
                                sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                              />
                            ) : (
                              <Avatar sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.dark', fontSize: '1.5rem' }}>
                                🍽
                              </Avatar>
                            )}
                            <Box flex={1} minWidth={0}>
                              <Typography fontWeight={700} noWrap>{item.name}</Typography>
                              <Typography variant="body2" color="primary" fontWeight={600}>{formatMoney(item.price, currency)}</Typography>
                              <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
                                {item.isPopular && <Chip label="Mashhur" size="small" color="warning" />}
                                {!item.isAvailable && <Chip label="Tugadi" size="small" color="error" />}
                                {item.trackQuantity && item.isAvailable && (
                                  <Chip label={`${item.quantity} ta qoldi`} size="small" variant="outlined" color={item.quantity <= 5 ? 'warning' : 'default'} />
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1} mt={1.5} justifyContent="flex-end">
                            <Button size="small" startIcon={<Edit />} onClick={() => openEditItem(item)}>Tahrirlash</Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => { if (confirm('Bu taom o‘chirilsinmi?')) deleteItem({ variables: { itemId: item._id } }); }}
                            >
                              O‘chirish
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      variant="outlined"
                      sx={{ borderRadius: 3, border: '2px dashed', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' } }}
                      onClick={() => openCreateItem(cat._id)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Add sx={{ color: 'text.disabled', fontSize: 32 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>Taom qo‘shish</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Category Dialog - creates a category, or renames an existing one */}
        <Dialog open={catDialog} onClose={closeCatDialog} fullWidth maxWidth="sm">
          <DialogTitle fontWeight={700}>
            {editingCat ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Kategoriya nomi"
              value={catForm.name}
              onChange={(e) => setCatForm({ name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCategory(); }}
              fullWidth
              autoFocus
              sx={{ mt: 1 }}
            />
            {editingCat && (
              <Typography variant="body2" color="text.secondary" mt={1.5}>
                Nom o‘zgartirilsa, tarjimalar qayta tayyorlanadi.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeCatDialog}>Bekor qilish</Button>
            <Button variant="contained" disabled={!catForm.name.trim()} onClick={submitCategory}>
              {editingCat ? 'Saqlash' : 'Kategoriya yaratish'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Item Dialog */}
        <Dialog open={!!itemDialog} onClose={() => setItemDialog(null)} fullWidth maxWidth="sm" fullScreen={fullScreenDialog}>
          <DialogTitle fontWeight={700}>{itemDialog === 'edit' ? 'Taomni tahrirlash' : 'Yangi taom'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} mt={1}>
              <TextField
                label="Nomi"
                value={itemForm.name}
                onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Tavsifi"
                value={itemForm.description}
                onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
              <TextField
                label="Narxi"
                type="number"
                value={itemForm.price}
                onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))}
                fullWidth
              />
              {/* Photos: several per dish, the first one leading */}
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>Rasmlar</Typography>
                {itemForm.images.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={1.5}>
                    {itemForm.images.map((url, i) => (
                      <Box key={url} sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={url}
                          alt=""
                          sx={{
                            width: 84, height: 84, borderRadius: 2, objectFit: 'cover',
                            border: '2px solid', borderColor: i === 0 ? 'primary.main' : 'divider',
                            display: 'block',
                          }}
                        />
                        {i === 0 ? (
                          <Chip
                            label="Asosiy"
                            size="small"
                            color="primary"
                            sx={{ position: 'absolute', bottom: 4, left: 4, height: 18, fontSize: '0.62rem', fontWeight: 800 }}
                          />
                        ) : (
                          <Button
                            size="small"
                            onClick={() => makePrimary(url)}
                            sx={{
                              position: 'absolute', bottom: 2, left: 2, minWidth: 0, px: 0.75,
                              fontSize: '0.62rem', bgcolor: 'rgba(255,255,255,0.9)',
                              '&:hover': { bgcolor: '#fff' },
                            }}
                          >
                            Asosiy
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => removeImage(url)}
                          aria-label="Rasmni o‘chirish"
                          sx={{
                            position: 'absolute', top: -6, right: -6, width: 22, height: 22,
                            bgcolor: 'error.main', color: '#fff',
                            '&:hover': { bgcolor: 'error.dark' },
                          }}
                        >
                          <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
                <Button
                  variant="outlined"
                  startIcon={uploading ? <CircularProgress size={16} /> : <PhotoCamera />}
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? 'Yuklanmoqda…' : itemForm.images.length ? 'Yana rasm qo‘shish' : 'Rasm yuklash'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => { handleUpload(e.target.files); e.target.value = ''; }}
                />
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  {cloudinaryConfigured
                    ? 'Bir nechta rasm tanlash mumkin. Birinchi rasm menyuda ko‘rinadi.'
                    : 'Rasm yuklash sozlanmagan.'}
                </Typography>
              </Box>
              {/* Prep quantity tracking */}
              <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
                <FormControlLabel
                  control={<Switch checked={itemForm.trackQuantity} onChange={(e) => setItemForm((p) => ({ ...p, trackQuantity: e.target.checked }))} />}
                  label="Tayyorlangan miqdorni hisoblash (0 da avtomatik «tugadi»)"
                />
                {itemForm.trackQuantity && (
                  <TextField
                    label="Tayyorlangan miqdor"
                    type="number"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm((p) => ({ ...p, quantity: e.target.value }))}
                    fullWidth
                    sx={{ mt: 1.5 }}
                    inputProps={{ min: 0 }}
                  />
                )}
              </Box>
              {/* Translations. Filled in automatically a moment after saving;
                  editable because a machine will occasionally mangle a dish
                  name, and the owner is the one who knows what it should say. */}
              {itemDialog === 'edit' && (
                <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <Translate sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" fontWeight={700}>Tarjimalar</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    Avtomatik tarjima qilinadi. Noto‘g‘ri bo‘lsa, o‘zgartiring.
                  </Typography>
                  {TRANSLATION_LANGS.map(({ code, label }) => (
                    <Box key={code} mb={1.5}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        {label}
                      </Typography>
                      <TextField
                        size="small"
                        placeholder={`${itemForm.name || 'Nomi'} - ${label}`}
                        value={itemForm.translations[code]?.name ?? ''}
                        onChange={(e) => {
                          setTranslationsTouched(true);
                          setItemForm((p) => ({
                            ...p,
                            translations: {
                              ...p.translations,
                              [code]: { ...p.translations[code], name: e.target.value },
                            },
                          }));
                        }}
                        fullWidth
                        sx={{ mt: 0.5 }}
                      />
                      <TextField
                        size="small"
                        placeholder="Tavsifi"
                        value={itemForm.translations[code]?.description ?? ''}
                        onChange={(e) => {
                          setTranslationsTouched(true);
                          setItemForm((p) => ({
                            ...p,
                            translations: {
                              ...p.translations,
                              [code]: { ...p.translations[code], description: e.target.value },
                            },
                          }));
                        }}
                        fullWidth
                        multiline
                        sx={{ mt: 0.75 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              <TextField
                label="Teglar (vergul bilan ajrating)"
                value={itemForm.tags}
                onChange={(e) => setItemForm((p) => ({ ...p, tags: e.target.value }))}
                fullWidth
                placeholder="vegetarian, achchiq, mashhur"
              />
              <Stack direction="row" spacing={3}>
                <FormControlLabel
                  control={<Switch checked={itemForm.isAvailable} onChange={(e) => setItemForm((p) => ({ ...p, isAvailable: e.target.checked }))} color="success" />}
                  label="Mavjud"
                />
                <FormControlLabel
                  control={<Switch checked={itemForm.isPopular} onChange={(e) => setItemForm((p) => ({ ...p, isPopular: e.target.checked }))} color="warning" />}
                  label="Mashhur"
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setItemDialog(null)}>Bekor qilish</Button>
            <Button variant="contained" onClick={handleSaveItem}>
              {itemDialog === 'edit' ? 'O‘zgarishlarni saqlash' : 'Taom qo‘shish'}
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default MenuPage;
