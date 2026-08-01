import { registerEnumType } from '@nestjs/graphql';

// Onboarding/approval lifecycle for a restaurant. A fresh signup starts as
// PENDING_REVIEW and cannot serve customers until a super admin APPROVES it.
export enum RestaurantStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
registerEnumType(RestaurantStatus, { name: 'RestaurantStatus' });
