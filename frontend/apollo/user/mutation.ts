import { gql } from '@apollo/client';

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
export const ADD_STAFF_MUTATION = gql`
  mutation AddStaff($input: AddStaffInput!) {
    addStaff(input: $input) {
      _id name email role isActive
    }
  }
`;
export const UPDATE_RESTAURANT_MUTATION = gql`
  mutation UpdateRestaurant($input: UpdateRestaurantInput!) {
    updateRestaurant(input: $input) {
      _id name description address phone logo coverImage currency telegramChatId
      printerEnabled printerIp printerPort
      openingTime closingTime alwaysOpen timezone
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
export const REORDER_CATEGORIES_MUTATION = gql`
  mutation ReorderCategories($categoryIds: [ID!]!) {
    reorderCategories(categoryIds: $categoryIds) {
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
      _id price imageUrl images isAvailable isPopular tags trackQuantity quantity
      name
      description
      translations { en { name description } ru { name description } ko { name description } }
    }
  }
`;
export const UPDATE_MENU_ITEM_MUTATION = gql`
  mutation UpdateMenuItem($input: UpdateMenuItemInput!) {
    updateMenuItem(input: $input) {
      _id price imageUrl images isAvailable isPopular tags trackQuantity quantity
      name
      description
      translations { en { name description } ru { name description } ko { name description } }
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
export const ADD_ITEMS_TO_ORDER_MUTATION = gql`
  mutation AddItemsToOrder($input: AddItemsToOrderInput!) {
    addItemsToOrder(input: $input) {
      _id totalAmount
      items { menuItemId name quantity price notes }
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
export const SUBMIT_FEEDBACK_MUTATION = gql`
  mutation SubmitFeedback($input: SubmitFeedbackInput!) {
    submitFeedback(input: $input) {
      _id rating comment createdAt
    }
  }
`;
export const REPORT_INVOICE_PAID_MUTATION = gql`
  mutation ReportInvoicePaid($invoiceId: ID!) {
    reportInvoicePaid(invoiceId: $invoiceId) { _id status }
  }
`;
