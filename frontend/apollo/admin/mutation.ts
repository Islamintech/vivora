import { gql } from '@apollo/client';

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
export const PURGE_ERROR_LOGS_MUTATION = gql`
  mutation PurgeErrorLogs($olderThanDays: Int!) {
    purgeErrorLogs(olderThanDays: $olderThanDays)
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
