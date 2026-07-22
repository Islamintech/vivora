import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useQuery } from '@apollo/client';
import {
  Box, Typography, Card, CardContent, Avatar, Stack, Divider,
} from '@mui/material';
import { LocationOn, Phone, QrCodeScanner } from '@mui/icons-material';
import { PUBLIC_RESTAURANT_QUERY } from '@/graphql/operations';

interface Props { slug: string }

// Branded landing shown when someone opens a restaurant's bare link
// (e.g. /zaytoon) without a table. Ordering happens on /{slug}/{table},
// reached by scanning the QR code at the table.
const RestaurantProfilePage: NextPage<Props> = ({ slug }) => {
  const { data, error, loading } = useQuery(PUBLIC_RESTAURANT_QUERY, { variables: { slug } });
  const restaurant = data?.publicRestaurant;

  if (error && !loading) {
    return (
      <>
        <Head><title>Restaurant unavailable</title></Head>
        <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA', maxWidth: 480, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Card sx={{ width: '100%', textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography sx={{ fontSize: 48, mb: 1 }}>🍽️</Typography>
              <Typography variant="h6" fontWeight={800} mb={1}>Restaurant not found</Typography>
              <Typography color="text.secondary">
                This restaurant isn’t available right now. Please check the link and try again.
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
        <title>{restaurant?.name || 'Restaurant'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA', maxWidth: 480, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)', pt: 5, pb: 6, px: 2.5, textAlign: 'center' }}>
          {restaurant?.logo && (
            <Avatar src={restaurant.logo} sx={{ width: 80, height: 80, mb: 2, mx: 'auto' }} />
          )}
          <Typography variant="h5" fontWeight={800} color="white">
            {restaurant?.name}
          </Typography>
          {restaurant?.description && (
            <Typography variant="body2" sx={{ color: 'grey.400', mt: 1, maxWidth: 360, mx: 'auto' }}>
              {restaurant.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ px: 2, mt: -4, pb: 4 }}>
          {/* Contact / details card */}
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                {restaurant?.address && (
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <LocationOn sx={{ color: 'primary.main', mt: 0.2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Address</Typography>
                      <Typography variant="body2" fontWeight={600}>{restaurant.address}</Typography>
                    </Box>
                  </Stack>
                )}
                {restaurant?.phone && (
                  <>
                    {restaurant?.address && <Divider />}
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Phone sx={{ color: 'primary.main', mt: 0.2 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Phone</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          <Box component="a" href={`tel:${restaurant.phone}`} sx={{ color: 'inherit', textDecoration: 'none' }}>
                            {restaurant.phone}
                          </Box>
                        </Typography>
                      </Box>
                    </Stack>
                  </>
                )}
                {!restaurant?.address && !restaurant?.phone && !loading && (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Welcome to {restaurant?.name}.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Order prompt */}
          <Card sx={{ borderRadius: 3, bgcolor: '#FFF7ED', border: '1px solid #FFEDD5' }}>
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <QrCodeScanner sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={800} mb={0.5}>Ready to order?</Typography>
              <Typography variant="body2" color="text.secondary">
                Scan the QR code on your table to view the menu and place your order.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };
  return { props: { slug } };
};

export default RestaurantProfilePage;
