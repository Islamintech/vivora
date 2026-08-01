import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as QRCode from 'qrcode';
import { Table, TableDocument } from '../../schemas/Table.model';
import { CreateTableInput, UpdateTableInput } from '../../libs/dto/table/table.input';

@Injectable()
export class TablesService {
  constructor(
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
  ) {}

  async create(
    restaurantId: string,
    restaurantSlug: string,
    input: CreateTableInput,
    frontendUrl: string,
  ): Promise<TableDocument> {
    const menuUrl = `${frontendUrl}/${restaurantSlug}/${input.number}`;
    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
    });

    return this.tableModel.create({
      restaurantId,
      ...input,
      capacity: input.capacity || 4,
      qrCodeDataUrl,
    });
  }

  async findByRestaurant(restaurantId: string): Promise<TableDocument[]> {
    return this.tableModel
      .find({ restaurantId })
      .sort({ number: 1 })
      .exec();
  }

  async findById(tableId: string): Promise<TableDocument | null> {
    return this.tableModel.findById(tableId).exec();
  }

  async findByNumber(
    restaurantId: string,
    tableNumber: number,
  ): Promise<TableDocument | null> {
    return this.tableModel.findOne({ restaurantId, number: tableNumber }).exec();
  }

  async update(restaurantId: string, input: UpdateTableInput): Promise<TableDocument> {
    const { tableId, ...update } = input;
    const table = await this.tableModel.findOneAndUpdate(
      { _id: tableId, restaurantId },
      { $set: update },
      { new: true },
    );
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async delete(restaurantId: string, tableId: string): Promise<boolean> {
    const table = await this.tableModel.findOneAndDelete({ _id: tableId, restaurantId });
    if (!table) throw new NotFoundException('Table not found');
    return true;
  }

  async regenerateQr(
    restaurantId: string,
    tableId: string,
    restaurantSlug: string,
    frontendUrl: string,
  ): Promise<TableDocument> {
    const table = await this.tableModel.findOne({ _id: tableId, restaurantId });
    if (!table) throw new NotFoundException('Table not found');

    const menuUrl = `${frontendUrl}/${restaurantSlug}/${table.number}`;
    table.qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
    });

    return table.save();
  }

  async countByRestaurant(restaurantId: string): Promise<number> {
    return this.tableModel.countDocuments({ restaurantId });
  }
}
