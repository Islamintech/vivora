import { useQuery } from '@apollo/client';
import { MY_RESTAURANT_QUERY } from '@/graphql/operations';

// The signed-in restaurant's currency, for owner/kitchen-facing money displays.
// Reads from the same MY_RESTAURANT_QUERY the layout already runs, so it's
// served from Apollo's cache - no extra request. Defaults to Korean won (KRW).
export function useCurrency(): string {
  const { data } = useQuery(MY_RESTAURANT_QUERY, { fetchPolicy: 'cache-first' });
  return data?.myRestaurant?.currency || 'KRW';
}
