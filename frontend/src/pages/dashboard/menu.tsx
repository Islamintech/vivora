import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useRef } from 'react';
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
  PhotoCamera,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  CATEGORIES_QUERY, MENU_ITEMS_QUERY, CREATE_CATEGORY_MUTATION,
  CREATE_MENU_ITEM_MUTATION, UPDATE_MENU_ITEM_MUTATION, DELETE_MENU_ITEM_MUTATION,
  DELETE_CATEGORY_MUTATION,
} from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { MenuItem, MenuCategory } from '@/types';
import { formatMoney } from '@/lib/money';
import { useCurrency } from '@/hooks/useCurrency';
import { uploadImage, cloudinaryConfigured } from '@/lib/cloudinary';

const MenuPage: NextPage = () => {
  const { user } = useRequireAuth();
  const currency = useCurrency();
  // The item form is tall - go full-screen on phones so it scrolls naturally.
  const fullScreenDialog = useMediaQuery(useTheme().breakpoints.down('sm'));

  const { data: catData, refetch: refetchCats } = useQuery(CATEGORIES_QUERY, { skip: !user });
  const { data: itemData, refetch: refetchItems } = useQuery(MENU_ITEMS_QUERY, { skip: !user });

  const categories: MenuCategory[] = catData?.categories ?? [];
  const items: MenuItem[] = itemData?.menuItems ?? [];

  // Category dialog
  const [catDialog, setCatDialog] = useState(false);
  const [catForm, setCatForm] = useState({ name: '' });

  // Item dialog
  const [itemDialog, setItemDialog] = useState<'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    allergens: '',
    tags: '',
    isAvailable: true,
    isPopular: false,
    trackQuantity: false,
    quantity: '',
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!cloudinaryConfigured) {
      toast.error('Rasm yuklash sozlanmagan. Buning o‘rniga rasm havolasini joylashtiring.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setItemForm((p) => ({ ...p, imageUrl: url }));
      toast.success('Rasm yuklandi');
    } catch (e: any) {
      toast.error(e.message || 'Yuklab bo‘lmadi');
    } finally {
      setUploading(false);
    }
  };

  const [createCategory] = useMutation(CREATE_CATEGORY_MUTATION, {
    onCompleted() { toast.success('Kategoriya yaratildi'); setCatDialog(false); refetchCats(); },
    onError(e) { toast.error(e.message); },
  });

  const [createItem] = useMutation(CREATE_MENU_ITEM_MUTATION, {
    onCompleted() { toast.success('Taom qo‘shildi'); setItemDialog(null); refetchItems(); },
    onError(e) { toast.error(e.message); },
  });

  const [updateItem] = useMutation(UPDATE_MENU_ITEM_MUTATION, {
    onCompleted() { toast.success('Taom yangilandi'); setItemDialog(null); refetchItems(); },
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

  const openCreateItem = (categoryId: string) => {
    setEditingItem(null);
    setItemForm({ categoryId, name: '', description: '', price: '', imageUrl: '', allergens: '', tags: '', isAvailable: true, isPopular: false, trackQuantity: false, quantity: '' });
    setItemDialog('create');
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      imageUrl: item.imageUrl || '',
      allergens: item.allergens.join(', '),
      tags: item.tags.join(', '),
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      trackQuantity: item.trackQuantity,
      quantity: String(item.quantity ?? 0),
    });
    setItemDialog('edit');
  };

  const handleSaveItem = () => {
    const payload = {
      ...itemForm,
      price: parseFloat(itemForm.price),
      quantity: parseInt(itemForm.quantity, 10) || 0,
      allergens: itemForm.allergens.split(',').map((s) => s.trim()).filter(Boolean),
      tags: itemForm.tags.split(',').map((s) => s.trim()).filter(Boolean),
    };
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
            <Button variant="contained" startIcon={<Add />} onClick={() => setCatDialog(true)}>
              Kategoriya qo‘shish
            </Button>
          </Stack>

          {categories.length === 0 && (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">Hali kategoriyalar yo‘q</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Boshlash uchun birinchi menyu kategoriyasini yarating</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setCatDialog(true)}>Kategoriya qo‘shish</Button>
            </Card>
          )}

          {categories.map((cat) => (
            <Accordion key={cat._id} defaultExpanded sx={{ mb: 2, borderRadius: '16px !important', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                  <DragIndicator sx={{ color: 'text.disabled' }} />
                  <Typography fontWeight={700} noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {cat.name || 'Nomsiz kategoriya'}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label={`${items.filter((i) => i.categoryId === cat._id).length} ta taom`} size="small" />
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

        {/* Category Dialog */}
        <Dialog open={catDialog} onClose={() => setCatDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle fontWeight={700}>Yangi kategoriya</DialogTitle>
          <DialogContent>
            <TextField
              label="Kategoriya nomi"
              value={catForm.name}
              onChange={(e) => setCatForm({ name: e.target.value })}
              fullWidth
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCatDialog(false)}>Bekor qilish</Button>
            <Button variant="contained" onClick={() => createCategory({ variables: { input: catForm } })}>
              Kategoriya yaratish
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
              {/* Photo: upload (Cloudinary) or paste a URL */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  {itemForm.imageUrl ? (
                    <Box component="img" src={itemForm.imageUrl} alt="preview"
                      sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }} />
                  ) : (
                    <Avatar sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.dark' }}>🍽</Avatar>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={uploading ? <CircularProgress size={16} /> : <PhotoCamera />}
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? 'Yuklanmoqda…' : 'Rasm yuklash'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleUpload(e.target.files?.[0] ?? undefined)}
                  />
                </Stack>
                <TextField
                  label="Rasm havolasi (URL)"
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  fullWidth
                  helperText={cloudinaryConfigured ? 'Yuqoridan yuklang yoki havolani joylashtiring' : 'Rasm havolasini joylashtiring (yuklash sozlanmagan)'}
                />
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
              <TextField
                label="Allergenlar (vergul bilan ajrating)"
                value={itemForm.allergens}
                onChange={(e) => setItemForm((p) => ({ ...p, allergens: e.target.value }))}
                fullWidth
                placeholder="yong‘oq, sut mahsulotlari, glyuten"
              />
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
