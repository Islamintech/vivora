import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '../common/enums';

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

  async countAll(): Promise<number> {
    return this.userModel.countDocuments();
  }

  async seedSuperAdmin() {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com';
    const existing = await this.findByEmail(email);
    if (existing) return;

    await this.create({
      name: process.env.SUPER_ADMIN_NAME || 'Platform Admin',
      email,
      password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
      role: UserRole.SUPER_ADMIN,
    });

    console.log(`✅ Super admin created: ${email}`);
  }
}
