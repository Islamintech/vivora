import { gql } from '@apollo/client';

export const ALL_INVOICES_QUERY = gql`
  query AllInvoices($period: String) {
    allInvoices(period: $period) {
      _id restaurantId restaurantName period revenue revenueCurrency amountDue currency status
      paidReportedAt confirmedAt createdAt
    }
  }
`;
export const PLATFORM_STATS_QUERY = gql`
  query PlatformStats {
    platformStats {
      totalRestaurants activeRestaurants totalUsers totalOrders totalRevenue totalErrorLogs
    }
  }
`;
export const ADMIN_RESTAURANTS_QUERY = gql`
  query AdminRestaurants {
    adminRestaurants {
      _id name slug isActive status orderCount revenue createdAt
    }
  }
`;
export const PENDING_RESTAURANTS_QUERY = gql`
  query PendingRestaurants {
    pendingRestaurants {
      _id name slug description address phone logo currency status createdAt
    }
  }
`;
export const ERROR_LOGS_QUERY = gql`
  query ErrorLogs($restaurantId: ID, $level: ErrorLogLevel) {
    errorLogs(restaurantId: $restaurantId, level: $level) {
      _id level message stack context createdAt
    }
  }
`;
export const ALL_ORDERS_QUERY = gql`
  query AllOrders($limit: Float, $restaurantId: ID) {
    allOrders(limit: $limit, restaurantId: $restaurantId) {
      _id restaurantId tableNumber status totalAmount createdAt
      items { quantity price name }
    }
  }
`;
export const ADMIN_USERS_QUERY = gql`
  query AdminUsers {
    adminUsers {
      _id name email role restaurantId restaurantName isActive createdAt
    }
  }
`;
export const ADMIN_RESTAURANT_DETAIL_QUERY = gql`
  query AdminRestaurantDetail($restaurantId: ID!) {
    adminRestaurantDetail(restaurantId: $restaurantId) {
      _id name slug description address phone logo currency
      isActive status rejectionReason
      menuItemCount tableCount orderCount revenue createdAt
      staff { _id name email role isActive createdAt }
      recentOrders {
        _id tableNumber status totalAmount createdAt
        items { name quantity price }
      }
    }
  }
`;
export const PLATFORM_TIMESERIES_QUERY = gql`
  query PlatformTimeseries($days: Int, $timezone: String) {
    platformTimeseries(days: $days, timezone: $timezone) {
      date revenue orders signups
    }
  }
`;
