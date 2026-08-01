import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../schemas/User.model';
import { UserRole } from '../../libs/enums/user.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    restaurantId?: string;
  }): Promise<UserDocument> {
    const hashed = await bcrypt.hash(data.password, 12);
    return this.userModel.create({
      ...data,
      password: hashed,
      email: data.email.toLowerCase(),
    });
  }

  async updateRestaurantId(userId: string, restaurantId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { restaurantId },
      { new: true },
    );
  }

  async findByRestaurantId(restaurantId: string): Promise<UserDocument[]> {
    return this.userModel.find({ restaurantId }).exec();
  }

  async toggleActive(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.isActive = !user.isActive;
    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async resetPassword(userId: string, newPassword: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.password = await bcrypt.hash(newPassword, 12);
    return user.save();
  }

  async countAll(): Promise<number> {
    return this.userModel.countDocuments();
  }

  async seedSuperAdmin() {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com';
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const isProd = process.env.NODE_ENV === 'production';
    const log = new Logger('SuperAdmin');

    const existing = await this.findByEmail(email);
    if (existing) {
      // The configured address may already belong to a restaurant owner, in
      // which case no super admin is created from it. Saying so out loud
      // matters: the deployment would otherwise look fine while the only
      // super admin is still whatever was seeded first.
      if (existing.role !== UserRole.SUPER_ADMIN) {
        log.error(
          `SUPER_ADMIN_EMAIL (${email}) already belongs to a ${existing.role} account, ` +
            'so no super admin was created. Use a different address.',
        );
      }
      return;
    }

    if (isProd && !password) {
      // Never quietly stand up a production admin on a password that is
      // published in this repository.
      throw new Error(
        'SUPER_ADMIN_PASSWORD must be set in production - refusing to create ' +
          'the super admin with the default password.',
      );
    }

    await this.create({
      name: process.env.SUPER_ADMIN_NAME || 'Platform Admin',
      email,
      password: password || 'Admin@123456',
      role: UserRole.SUPER_ADMIN,
    });

    log.log(`Super admin created: ${email}`);
  }
}
