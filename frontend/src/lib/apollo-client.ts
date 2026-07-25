import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import toast from 'react-hot-toast';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rp_token');
}

const httpLink = createHttpLink({ uri: API_URL });

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const isMutation =
    getMainDefinition(operation.query).kind === 'OperationDefinition' &&
    (getMainDefinition(operation.query) as any).operation === 'mutation';

  if (graphQLErrors) {
    graphQLErrors.forEach((err) => {
      const code = (err.extensions?.code as string) || 'ERROR';
      // eslint-disable-next-line no-console
      console.error(`[GraphQL ${code}] ${operation.operationName}: ${err.message}`);

      if (code === 'UNAUTHENTICATED') {
        if (typeof window === 'undefined') return;
        // On the auth pages a 401 just means wrong credentials - let the
        // form handle it. Elsewhere it's an expired/invalid session: clear
        // everything and hard-redirect so no query keeps retrying.
        const onAuthPage = ['/login', '/register'].some((p) =>
          window.location.pathname.startsWith(p),
        );
        if (onAuthPage) {
          if (isMutation) toast.error(err.message || 'Sign-in failed');
          return;
        }
        localStorage.removeItem('rp_token');
        localStorage.removeItem('rp_user');
        toast.error('Session expired. Please sign in again.');
        window.location.href = '/login';
        return;
      }
      if (code === 'FORBIDDEN') {
        toast.error("You don't have permission to do that.");
        return;
      }
      // Always show on mutations; on queries, only show server errors to avoid noise
      if (isMutation || code === 'INTERNAL_SERVER_ERROR') {
        toast.error(err.message || 'Something went wrong');
      }
    });
  }

  if (networkError) {
    // eslint-disable-next-line no-console
    console.error(`[Network] ${operation.operationName}:`, networkError);
    toast.error('Network error - check your connection.');
  }
});

const authLink = setContext((_, { headers }) => {
  const token = getToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

function makeWsLink() {
  if (typeof window === 'undefined') return null;
  return new GraphQLWsLink(
    createClient({
      url: WS_URL,
      connectionParams: () => ({
        authorization: getToken() ? `Bearer ${getToken()}` : '',
      }),
    }),
  );
}

function makeClient() {
  const wsLink = makeWsLink();

  const splitLink = wsLink
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return (
            def.kind === 'OperationDefinition' &&
            def.operation === 'subscription'
          );
        },
        wsLink,
        errorLink.concat(authLink).concat(httpLink),
      )
    : errorLink.concat(authLink).concat(httpLink);

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            orders: { merge: false },
            menuItems: { merge: false },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
}

let _client: ApolloClient<any> | null = null;

export function getApolloClient() {
  if (!_client) _client = makeClient();
  return _client;
}

export function resetApolloClient() {
  _client = null;
}
