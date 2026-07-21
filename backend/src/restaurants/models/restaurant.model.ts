import { Field, ID, Int, ObjectType, InputType } from '@nestjs/graphql';
import {
  IsBoolean, IsIP, IsInt, IsOptional, IsString, Max, MaxLength, Min,
  MinLength, ValidateIf,
} from 'class-validator';
import { RestaurantStatus } from '../../common/enums';

@ObjectType()
export class RestaurantModel {
  @Field(() => ID)
  _id: any;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => ID, { nullable: true })
  ownerId?: any;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field()
  currency: string;

  @Field({ nullable: true })
  telegramChatId?: string;

  @Field()
  printerEnabled: boolean;

  @Field({ nullable: true })
  printerIp?: string;

  @Field()
  printerPort: number;

  @Field()
  isActive: boolean;

  @Field(() => RestaurantStatus)
  status: RestaurantStatus;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field()
  createdAt: Date;
}

@InputType()
export class UpdateRestaurantInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(2000)
  logo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  telegramChatId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  printerEnabled?: boolean;

  // Empty string clears the setting; otherwise must be a valid IPv4/IPv6.
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !!o.printerIp)
  @IsIP(undefined, { message: 'printerIp must be a valid IP address' })
  printerIp?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  printerPort?: number;
}
