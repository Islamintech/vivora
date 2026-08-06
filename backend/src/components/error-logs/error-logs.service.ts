import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ErrorLog, ErrorLogDocument } from '../../schemas/ErrorLog.model';
import { ErrorLogLevel } from '../../libs/enums/error-log.enum';
import { AlertService } from '../telegram/alert.service';

@Injectable()
export class ErrorLogsService {
  constructor(
    @InjectModel(ErrorLog.name) private logModel: Model<ErrorLogDocument>,
    private readonly alerts: AlertService,
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
    // Every server-side failure already funnels through here, so this is the
    // one place worth hooking. Fire-and-forget by design: an alert must never
    // delay or break the request that failed. WARN stays out of it - only
    // things that need somebody tonight are worth a phone buzzing.
    this.alerts.capture(message, opts);
    return this.log(ErrorLogLevel.ERROR, message, opts);
  }

  async warn(message: string, opts?: any) {
    console.warn(`[WARN] ${message}`);
    return this.log(ErrorLogLevel.WARN, message, opts);
  }

  async findAll(
    restaurantId?: string,
    limit = 100,
    level?: ErrorLogLevel,
  ): Promise<ErrorLogDocument[]> {
    const filter: any = {};
    if (restaurantId) filter.restaurantId = restaurantId;
    if (level) filter.level = level;
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

  // olderThanDays <= 0 clears every log; otherwise only entries past the cutoff.
  async purge(olderThanDays: number): Promise<number> {
    if (olderThanDays <= 0) {
      const result = await this.logModel.deleteMany({});
      return result.deletedCount;
    }
    return this.deleteOlderThan(olderThanDays);
  }
}
