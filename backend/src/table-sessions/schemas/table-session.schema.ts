import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { TableSessionStatus } from '../../common/enums';

export type TableSessionDocument = TableSession & Document;

// SchemaTypes.ObjectId (not Types.ObjectId, which mongoose treats as Mixed
// here) so string ids from GraphQL inputs are cast when storing and querying.
@Schema({ timestamps: true })
export class TableSession {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Table', required: true })
  tableId: Types.ObjectId;

  @Prop({ required: true })
  tableNumber: number;

  @Prop({ type: String, enum: TableSessionStatus, default: TableSessionStatus.OPEN })
  status: TableSessionStatus;

  // Final bill, snapshotted when the session is closed. While OPEN, the
  // running total is computed live from the session's orders.
  @Prop({ default: 0, min: 0 })
  totalAmount: number;

  @Prop({ type: Date, default: Date.now })
  lastOrderAt: Date;

  @Prop({ type: Date, default: null })
  closedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const TableSessionSchema = SchemaFactory.createForClass(TableSession);

TableSessionSchema.index({ restaurantId: 1, status: 1 });
TableSessionSchema.index({ restaurantId: 1, tableNumber: 1, status: 1 });
// At most one OPEN session per table — concurrent placeOrder calls race on
// find-or-create, and this index makes the loser's insert fail instead of
// silently splitting one visit into two tabs.
TableSessionSchema.index(
  { tableId: 1 },
  { unique: true, partialFilterExpression: { status: TableSessionStatus.OPEN } },
);
