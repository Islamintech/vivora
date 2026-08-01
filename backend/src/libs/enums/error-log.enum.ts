import { registerEnumType } from '@nestjs/graphql';

export enum ErrorLogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
}
registerEnumType(ErrorLogLevel, { name: 'ErrorLogLevel' });
