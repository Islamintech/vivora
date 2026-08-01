import { gql } from '@apollo/client';

export const ORDER_CREATED_SUBSCRIPTION = gql`
  subscription OrderCreated($restaurantId: ID!) {
    orderCreated(restaurantId: $restaurantId) {
      _id tableNumber status orderType totalAmount customerNote customerName customerPhone scheduledFor createdAt
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
// Public - a guest watching their own table. Fires when an order is placed at
// the table or when one of its orders changes status.
export const TABLE_ORDER_CHANGED_SUBSCRIPTION = gql`
  subscription TableOrderChanged($restaurantId: ID!, $tableNumber: Int!) {
    tableOrderChanged(restaurantId: $restaurantId, tableNumber: $tableNumber) {
      _id status updatedAt
    }
  }
`;
