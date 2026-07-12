import type { NextPage } from 'next';
import Head from 'next/head';
import { useQuery } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Grid, LinearProgress,
} from '@mui/material';
import dayjs from 'dayjs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { FEEDBACK_SUMMARY_QUERY } from '@/graphql/operations';
import { useRequireAuth } from '@/hooks/useAuth';
import { Feedback } from '@/types';

const RATING_COLORS: Record<number, string> = {
  5: '#22C55E', 4: '#84CC16', 3: '#EAB308', 2: '#F97316', 1: '#EF4444',
};

const FeedbackPage: NextPage = () => {
  const { user } = useRequireAuth();
  const { data, loading } = useQuery(FEEDBACK_SUMMARY_QUERY, { skip: !user });
  const summary = data?.feedbackSummary;

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: summary?.recent?.filter((f: Feedback) => f.rating === r).length ?? 0,
  }));

  return (
    <>
      <Head><title>Feedback — RestoPlatform</title></Head>
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800}>Customer Feedback</Typography>
            <Typography color="text.secondary">Reviews and ratings from your guests</Typography>
          </Box>

          {loading && <LinearProgress sx={{ mb: 3 }} />}

          <Grid container spacing={3}>
            {/* Summary card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h1" fontWeight={800} sx={{ lineHeight: 1 }}>
                    {summary?.averageRating?.toFixed(1) ?? '—'}
                  </Typography>
                  <Stack direction="row" justifyContent="center" spacing={0.5} my={1}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Typography key={s} sx={{ color: s <= Math.round(summary?.averageRating ?? 0) ? '#F59E0B' : '#E2E8F0', fontSize: 24 }}>★</Typography>
                    ))}
                  </Stack>
                  <Typography color="text.secondary">{summary?.totalCount ?? 0} reviews</Typography>

                  <Box mt={3}>
                    {ratingCounts.map(({ rating, count }) => (
                      <Stack key={rating} direction="row" alignItems="center" spacing={1.5} mb={1}>
                        <Typography variant="body2" sx={{ width: 16 }}>{rating}</Typography>
                        <Typography sx={{ color: '#F59E0B', fontSize: 14 }}>★</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={summary?.totalCount ? (count / summary.totalCount) * 100 : 0}
                          sx={{ flex: 1, height: 8, '& .MuiLinearProgress-bar': { bgcolor: RATING_COLORS[rating] } }}
                        />
                        <Typography variant="caption" sx={{ width: 24 }}>{count}</Typography>
                      </Stack>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Feedback list */}
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                {(summary?.recent ?? []).map((fb: Feedback) => (
                  <Card key={fb._id}>
                    <CardContent sx={{ pb: '12px !important' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack direction="row" spacing={0.5}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Typography key={s} sx={{ color: s <= fb.rating ? '#F59E0B' : '#E2E8F0', fontSize: 18 }}>★</Typography>
                          ))}
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={`Table ${fb.tableNumber}`} size="small" variant="outlined" />
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(fb.createdAt).format('MMM D, HH:mm')}
                          </Typography>
                        </Stack>
                      </Stack>
                      {fb.comment && (
                        <Typography variant="body2" color="text.secondary" mt={1.5}>
                          "{fb.comment}"
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {!summary?.recent?.length && (
                  <Card sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">No feedback yet</Typography>
                    <Typography variant="body2" color="text.secondary">Customer feedback will appear here after orders</Typography>
                  </Card>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default FeedbackPage;
