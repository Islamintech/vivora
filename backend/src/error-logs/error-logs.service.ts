import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ErrorLog, ErrorLogDocument } from './schemas/error-log.schema';
import { ErrorLogLevel } from '../common/enums';

@Injectable()
export class ErrorLogsService {
  constructor(
    @InjectModel(ErrorLog.name) private logModel: Model<ErrorLogDocument>,
  ) {}

  async log(
    level: ErrorLogLevel,
    message: string,
    opts?: { restaurantId?: string; stack?: string; context?: string; meta?: any },
  ) {
    try {
      await this.logModel.create({ level, message, ...opts });
    } catch {
      console.error('[ErrorLogsService] Failed to write log:', message);
    }
  }

  async error(message: string, opts?: any) {
    console.error(`[ERROR] ${message}`);
    return this.log(ErrorLogLevel.ERROR, message, opts);
  }

  async warn(message: string, opts?: any) {
    console.warn(`[WARN] ${message}`);
    return this.log(ErrorLogLevel.WARN, message, opts);
  }

  async findAll(restaurantId?: string, limit = 100): Promise<ErrorLogDocument[]> {
    const filter: any = {};
    if (restaurantId) filter.restaurantId = restaurantId;
    return this.logModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async countAll(): Promise<number> {
    return this.logModel.countDocuments();
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const result = await this.logModel.deleteMany({ createdAt: { $lt: cutoff } });
    return result.deletedCount;
  }
}
