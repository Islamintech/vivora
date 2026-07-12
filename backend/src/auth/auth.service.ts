import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { LoginInput, RegisterInput, AddStaffInput } from './dto/auth.input';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private usersService: UsersService,
    private restaurantsService: RestaurantsService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.usersService.seedSuperAdmin();
  }

  async register(input: RegisterInput) {
    const existing = await this.usersService.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Create restaurant first
    const restaurant = await this.restaurantsService.create({
      name: input.restaurantName,
      ownerId: null, // Will update after user is created
    });

    // Create user with restaurant link; if this fails (e.g. duplicate email
    // race), remove the just-created restaurant so it doesn't orphan.
    let user;
    try {
      user = await this.usersService.create({
        name: input.name,
        email: input.email,
        password: input.password,
        role: UserRole.RESTAURANT_ADMIN,
        restaurantId: restaurant._id.toString(),
      });
    } catch (err) {
      await this.restaurantsService
        .deleteById(restaurant._id.toString())
        .catch(() => undefined);
      throw err;
    }

    // Set owner on restaurant
    await this.restaurantsService.setOwner(
      restaurant._id.toString(),
      user._id.toString(),
    );

    const token = this.signToken(user);
    return { token, user };
  }

  async login(input: LoginInput) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user);
    return { token, user };
  }

  async addStaff(input: AddStaffInput, adminUser: any) {
    if (!adminUser.restaurantId) {
      throw new NotFoundException('No restaurant associated with your account');
    }

    const existing = await this.usersService.findByEmail(input.email);
    if (existing) throw new ConflictException('Email already registered');

    const staff = await this.usersService.create({
      name: input.name,
      email: input.email,
      password: input.password,
      role: UserRole.STAFF,
      restaurantId: adminUser.restaurantId.toString(),
    });

    return staff;
  }

  private signToken(user: any): string {
    return this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId?.toString(),
    });
  }
}
