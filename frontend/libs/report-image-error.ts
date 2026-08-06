import { REPORT_CLIENT_ERROR_MUTATION } from '../apollo/user/mutation';
import { getApolloClient } from '../apollo/client';

/**
 * Tells the server when a menu photo fails to load in a guest's browser.
 *
 * A broken image is invisible server-side: the request went to Cloudinary, not
 * to us, so nothing in the API ever hears about it. Without this the first
 * report comes from a customer, or never.
 *
 * Three things keep it quiet. The same URL is reported once per page load, so
 * a guest scrolling a menu with one dead photo sends one report rather than
 * one per re-render. Nothing is sent while the browser is offline, since then
 * every image fails and none of it is the server's fault. And the whole thing
 * is best-effort - a failed report is swallowed, because a reporting problem
 * must never become a visible problem for someone trying to order lunch.
 */
const reported = new Set<string>();

/** Guards against a single broken page filling the log by itself. */
const MAX_PER_PAGE = 5;

/**
 * Customer URLs are /{slug} and /{slug}/{table}, so the restaurant is already
 * in the path - no need to thread it through every component that shows a
 * photo. A staff page yields something like "dashboard", which simply fails to
 * resolve server-side and leaves the report unattributed.
 */
function slugFromPath(): string | undefined {
  const first = window.location.pathname.split('/').filter(Boolean)[0];
  return first ? first.slice(0, 80) : undefined;
}

export function reportImageError(url: string, restaurantSlug?: string): void {
  if (typeof window === 'undefined') return;
  if (!url || url.startsWith('data:')) return; // inline QR codes cannot 404
  if (reported.has(url) || reported.size >= MAX_PER_PAGE) return;
  // Offline means every image fails; that is the guest's connection, not a
  // broken asset, and alerting on it would be pure noise.
  if (navigator.onLine === false) return;

  reported.add(url);

  try {
    void getApolloClient()
      .mutate({
        mutation: REPORT_CLIENT_ERROR_MUTATION,
        variables: {
          input: {
            kind: 'IMAGE',
            url: url.slice(0, 500),
            restaurantSlug: restaurantSlug ?? slugFromPath(),
            page: window.location.pathname.slice(0, 300),
          },
        },
        // Reporting a failure must not poison the cache or retry noisily.
        fetchPolicy: 'no-cache',
      })
      .catch(() => {});
  } catch {
    /* never let reporting break rendering */
  }
}

/** Handy in JSX: `onError={onImageError(url, slug)}` */
export const onImageError =
  (url: string, restaurantSlug?: string) =>
  (): void =>
    reportImageError(url, restaurantSlug);
