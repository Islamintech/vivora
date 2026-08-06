import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsOptional, MaxLength } from 'class-validator';

/**
 * Reported by the customer's browser, so every field is untrusted input from
 * the open internet. Lengths are capped here rather than trusting the client
 * to be reasonable, and nothing in here is ever rendered as HTML.
 */
@InputType()
export class ReportClientErrorInput {
  // Kept as a small closed set - a free-form "kind" would let a caller invent
  // categories and fragment the alerts.
  @Field()
  @IsIn(['IMAGE'])
  kind: string;

  /** The asset that failed to load. */
  @Field()
  @MaxLength(500)
  url: string;

  /** Which restaurant's menu the guest was looking at. */
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(80)
  restaurantSlug?: string;

  /** The page it happened on, for reproducing it. */
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(300)
  page?: string;
}
