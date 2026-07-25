import { gql } from '@apollo/client';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        _id name email role restaurantId isActive
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        _id name email role restaurantId isActive
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      _id name email role restaurantId isActive
    }
  }
`;

export const ADD_STAFF_MUTATION = gql`
  mutation AddStaff($input: AddStaffInput!) {
    addStaff(input: $input) {
      _id name email role isActive
    }
  }
`;

// ─── Restaurant ───────────────────────────────────────────────────────────────

export const MY_RESTAURANT_QUERY = gql`
  query MyRestaurant {
    myRestaurant {
      _id name slug description address phone logo currency telegramChatId
      printerEnabled printerIp printerPort isActive status rejectionReason createdAt
      openingTime closingTime alwaysOpen timezone
    }
  }
`;

export const PUBLIC_RESTAURANT_QUERY = gql`
  query PublicRestaurant($slug: String!) {
    publicRestaurant(slug: $slug) {
      _id name slug description logo currency address phone
      openingTime closingTime alwaysOpen isOpenNow
    }
  }
`;

export const UPDATE_RESTAURANT_MUTATION = gql`
  mutation UpdateRestaurant($input: UpdateRestaurantInput!) {
    updateRestaurant(input: $input) {
      _id name description address phone logo currency telegramChatId
      printerEnabled printerIp printerPort
      openingTime closingTime alwaysOpen timezone
    }
  }
`;

// ─── Menu ─────────────────────────────────────────────────────────────────────

export const CATEGORIES_QUERY = gql`
  query Categories {
    categories {
      _id restaurantId order isActive
      name
    }
  }
`;

export const MENU_ITEMS_QUERY = gql`
  query MenuItems($categoryId: ID) {
    menuItems(categoryId: $categoryId) {
      _id categoryId restaurantId price imageUrl isAvailable isPopular allergens tags trackQuantity quantity
      name
      description
    }
  }
`;

export const PUBLIC_MENU_QUERY = gql`
  query PublicMenu($restaurantId: ID!) {
    publicMenu(restaurantId: $restaurantId) {
      category {
        _id order
        name
      }
      items {
        _id price imageUrl isAvailable isPopular isBestSeller allergens tags
        trackQuantity quantity
        name
        description
      }
    }
  }
`;

export const CREATE_CATEGORY_MUTATION = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      _id order isActive
      name
    }
  }
`;

export const UPDATE_CATEGORY_MUTATION = gql`
  mutation UpdateCategory($input: UpdateCategoryInput!) {
    updateCategory(input: $input) {
      _id order isActive
      name
    }
  }
`;

export const DELETE_CATEGORY_MUTATION = gql`
  mutation DeleteCategory($categoryId: ID!) {
    deleteCategory(categoryId: $categoryId)
  }
`;

export const CREATE_MENU_ITEM_MUTATION = gql`
  mutation CreateMenuItem($input: CreateMenuItemInput!) {
    createMenuItem(input: $input) {
      _id price imageUrl isAvailable isPopular trackQuantity quantity
      name
      description
    }
  }
`;

export const UPDATE_MENU_ITEM_MUTATION = gql`
  mutation UpdateMenuItem($input: UpdateMenuItemInput!) {
    updateMenuItem(input: $input) {
      _id price imageUrl isAvailable isPopular allergens tags trackQuantity quantity
      name
      description
    }
  }
`;

export const DELETE_MENU_ITEM_MUTATION = gql`
  mutation DeleteMenuItem($itemId: ID!) {
    deleteMenuItem(itemId: $itemId)
  }
`;

export const UPDATE_ITEM_AVAILABILITY_MUTATION = gql`
  mutation UpdateItemAvailability($input: UpdateItemAvailabilityInput!) {
    updateItemAvailability(input: $input) {
      _id isAvailable trackQuantity quantity
    }
  }
`;

// ─── Tables ───────────────────────────────────────────────────────────────────

export const TABLES_QUERY = gql`
  query Tables {
    tables {
      _id number name qrCodeDataUrl capacity isActive createdAt
    }
  }
`;

export const CREATE_TABLE_MUTATION = gql`
  mutation CreateTable($input: CreateTableInput!) {
    createTable(input: $input) {
      _id number name qrCodeDataUrl capacity isActive
    }
  }
`;

export const UPDATE_TABLE_MUTATION = gql`
  mutation UpdateTable($input: UpdateTableInput!) {
    updateTable(input: $input) {
      _id number name capacity isActive
    }
  }
`;

export const DELETE_TABLE_MUTATION = gql`
  mutation DeleteTable($tableId: ID!) {
    deleteTable(tableId: $tableId)
  }
`;

export const REGENERATE_QR_MUTATION = gql`
  mutation RegenerateQrCode($tableId: ID!) {
    regenerateQrCode(tableId: $tableId) {
      _id number name qrCodeDataUrl
    }
  }
`;

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ORDERS_QUERY = gql`
  query Orders($status: OrderStatus, $limit: Float, $unpaidOnly: Boolean) {
    orders(status: $status, limit: $limit, unpaidOnly: $unpaidOnly) {
      _id tableNumber status orderType totalAmount customerNote language createdAt updatedAt
      isPaid paidAt
      items {
        menuItemId quantity price notes
        name
      }
    }
  }
`;

export const MARK_ORDER_PAID_MUTATION = gql`
  mutation MarkOrderPaid($orderId: ID!) {
    markOrderPaid(orderId: $orderId) {
      _id isPaid paidAt
    }
  }
`;

export const PLACE_ORDER_MUTATION = gql`
  mutation PlaceOrder($input: PlaceOrderInput!) {
    placeOrder(input: $input) {
      _id tableNumber status totalAmount createdAt
      items {
        menuItemId quantity price
        name
      }
    }
  }
`;

export const UPDATE_ORDER_STATUS_MUTATION = gql`
  mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
    updateOrderStatus(input: $input) {
      _id status updatedAt
    }
  }
`;

export const ORDER_CREATED_SUBSCRIPTION = gql`
  subscription OrderCreated($restaurantId: ID!) {
    orderCreated(restaurantId: $restaurantId) {
      _id tableNumber status orderType totalAmount customerNote createdAt
      items {
        menuItemId quantity price notes
        name
      }
    }
  }
`;

export const ORDER_STATUS_UPDATED_SUBSCRIPTION = gql`
  subscription OrderStatusUpdated($restaurantId: ID!) {
    orderStatusUpdated(restaurantId: $restaurantId) {
      _id status updatedAt
    }
  }
`;

// ─── Table sessions (tabs) ────────────────────────────────────────────────────

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

// Staff add verbally-taken items to an open tab (recorded as SERVED).
export const ADD_ORDER_TO_SESSION_MUTATION = gql`
  mutation AddOrderToSession($input: AddOrderToSessionInput!) {
    addOrderToSession(input: $input) {
      _id sessionId totalAmount status
    }
  }
`;

export const CLOSE_TABLE_SESSION_MUTATION = gql`
  mutation CloseTableSession($sessionId: ID!) {
    closeTableSession(sessionId: $sessionId) {
      _id status totalAmount closedAt
    }
  }
`;

// ─── Analytics ────────────────────────────────────────────────────────────────

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

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const SUBMIT_FEEDBACK_MUTATION = gql`
  mutation SubmitFeedback($input: SubmitFeedbackInput!) {
    submitFeedback(input: $input) {
      _id rating comment createdAt
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

// ─── Billing ──────────────────────────────────────────────────────────────────

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

export const REPORT_INVOICE_PAID_MUTATION = gql`
  mutation ReportInvoicePaid($invoiceId: ID!) {
    reportInvoicePaid(invoiceId: $invoiceId) { _id status }
  }
`;

export const ALL_INVOICES_QUERY = gql`
  query AllInvoices($period: String) {
    allInvoices(period: $period) {
      _id restaurantId restaurantName period revenue amountDue currency status
      paidReportedAt confirmedAt createdAt
    }
  }
`;

export const GENERATE_INVOICES_MUTATION = gql`
  mutation GenerateInvoices($period: String!) {
    generateInvoices(period: $period)
  }
`;

export const CONFIRM_INVOICE_PAID_MUTATION = gql`
  mutation ConfirmInvoicePaid($invoiceId: ID!) {
    confirmInvoicePaid(invoiceId: $invoiceId) { _id status }
  }
`;

// ─── Admin ────────────────────────────────────────────────────────────────────

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

export const ADMIN_TOGGLE_RESTAURANT_MUTATION = gql`
  mutation AdminToggleRestaurant($restaurantId: ID!) {
    adminToggleRestaurant(restaurantId: $restaurantId) {
      _id isActive
    }
  }
`;

export const APPROVE_RESTAURANT_MUTATION = gql`
  mutation ApproveRestaurant($restaurantId: ID!) {
    approveRestaurant(restaurantId: $restaurantId) {
      _id status isActive
    }
  }
`;

export const REJECT_RESTAURANT_MUTATION = gql`
  mutation RejectRestaurant($restaurantId: ID!, $reason: String) {
    rejectRestaurant(restaurantId: $restaurantId, reason: $reason) {
      _id status rejectionReason
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

export const PURGE_ERROR_LOGS_MUTATION = gql`
  mutation PurgeErrorLogs($olderThanDays: Int!) {
    purgeErrorLogs(olderThanDays: $olderThanDays)
  }
`;

export const ALL_ORDERS_QUERY = gql`
  query AllOrders($limit: Float) {
    allOrders(limit: $limit) {
      _id restaurantId tableNumber status totalAmount createdAt
      items { quantity price name }
    }
  }
`;

// ─── Admin: users, restaurant drill-down, platform trends ─────────────────────

export const ADMIN_USERS_QUERY = gql`
  query AdminUsers {
    adminUsers {
      _id name email role restaurantId restaurantName isActive createdAt
    }
  }
`;

export const ADMIN_TOGGLE_USER_MUTATION = gql`
  mutation AdminToggleUser($userId: ID!) {
    adminToggleUser(userId: $userId) {
      _id isActive
    }
  }
`;

export const ADMIN_RESET_USER_PASSWORD_MUTATION = gql`
  mutation AdminResetUserPassword($userId: ID!, $newPassword: String!) {
    adminResetUserPassword(userId: $userId, newPassword: $newPassword)
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
