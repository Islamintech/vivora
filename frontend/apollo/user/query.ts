import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      _id name email role restaurantId isActive
    }
  }
`;
export const MY_RESTAURANT_QUERY = gql`
  query MyRestaurant {
    myRestaurant {
      _id name slug description address phone logo coverImage currency telegramChatId
      printerEnabled printerIp printerPort isActive status rejectionReason createdAt
      openingTime closingTime alwaysOpen timezone
    }
  }
`;
export const PUBLIC_RESTAURANT_QUERY = gql`
  query PublicRestaurant($slug: String!) {
    publicRestaurant(slug: $slug) {
      _id name slug description logo coverImage currency address phone
      openingTime closingTime alwaysOpen isOpenNow
    }
  }
`;
export const CATEGORIES_QUERY = gql`
  query Categories {
    categories {
      _id restaurantId order isActive
      name
      translations { en { name } ru { name } ko { name } }
    }
  }
`;
export const MENU_ITEMS_QUERY = gql`
  query MenuItems($categoryId: ID) {
    menuItems(categoryId: $categoryId) {
      _id categoryId restaurantId price imageUrl images isAvailable isPopular tags trackQuantity quantity
      name
      description
      translations { en { name description } ru { name description } ko { name description } }
    }
  }
`;
export const PUBLIC_MENU_QUERY = gql`
  query PublicMenu($restaurantId: ID!) {
    publicMenu(restaurantId: $restaurantId) {
      category {
        _id order
        name
        translations { en { name } ru { name } ko { name } }
      }
      items {
        _id price imageUrl images isAvailable isPopular isBestSeller tags
        trackQuantity quantity
        name
        description
        translations { en { name description } ru { name description } ko { name description } }
      }
    }
  }
`;
export const TABLES_QUERY = gql`
  query Tables {
    tables {
      _id number name qrCodeDataUrl capacity isActive createdAt
    }
  }
`;
export const ORDERS_QUERY = gql`
  query Orders($status: OrderStatus, $limit: Float, $unpaidOnly: Boolean) {
    orders(status: $status, limit: $limit, unpaidOnly: $unpaidOnly) {
      _id tableNumber status orderType totalAmount customerNote customerName customerPhone scheduledFor language createdAt updatedAt
      isPaid paidAt
      items {
        menuItemId quantity price notes
        name
      }
    }
  }
`;
// Public - customer's running tab for the current visit.
export const TABLE_SESSION_QUERY = gql`
  query TableSession($restaurantId: ID!, $tableNumber: Int!) {
    tableSession(restaurantId: $restaurantId, tableNumber: $tableNumber) {
      _id status totalAmount lastOrderAt
      orders {
        _id status totalAmount createdAt
        items { name quantity price }
      }
    }
  }
`;
export const OPEN_TABLE_SESSIONS_QUERY = gql`
  query OpenTableSessions {
    openTableSessions {
      _id tableNumber status totalAmount lastOrderAt createdAt
      orders {
        _id status totalAmount createdAt
        items { name quantity price }
      }
    }
  }
`;
export const ANALYTICS_QUERY = gql`
  query Analytics($period: AnalyticsPeriodInput!) {
    analytics(period: $period) {
      totalRevenue paidRevenue paidOrders totalOrders averageOrderValue pendingOrders servedOrders
      popularItems { menuItemId name totalOrdered revenue }
      dailyRevenue { date revenue orderCount }
      tableTurnover { tableNumber tableName totalOrders totalRevenue }
    }
  }
`;
export const FEEDBACK_SUMMARY_QUERY = gql`
  query FeedbackSummary {
    feedbackSummary {
      averageRating totalCount
      recent { _id rating comment language tableNumber createdAt }
    }
  }
`;
export const FEEDBACK_LIST_QUERY = gql`
  query FeedbackList {
    feedbackList {
      _id rating comment language tableNumber createdAt
    }
  }
`;
export const MY_BILLING_QUERY = gql`
  query MyBilling {
    myBilling {
      currentPeriod currentRevenue currentFee feeRate currency
      bank { bankName cardNumber holder }
      invoices {
        _id period revenue feeRate amountDue currency status paidReportedAt confirmedAt createdAt
      }
    }
  }
`;
