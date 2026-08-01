import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class AnalyticsPeriodInput {
  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  // IANA zone of the viewer (e.g. "Asia/Seoul") so daily grouping matches
  // their local midnight instead of UTC. Invalid values fall back to UTC.
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
