import { registerEnumType } from '@nestjs/graphql';

// One dine-in visit at a table. OPEN collects orders into a running tab;
// staff closes it when the bill is paid.
export enum TableSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}
registerEnumType(TableSessionStatus, { name: 'TableSessionStatus' });
