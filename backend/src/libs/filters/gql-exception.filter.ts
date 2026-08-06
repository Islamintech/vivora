import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter as NestGqlExceptionFilter } from '@nestjs/graphql';
import { ModuleRef } from '@nestjs/core';
import { GraphQLError } from 'graphql';
import { ErrorLogsService } from '../../components/error-logs/error-logs.service';
import { ErrorLogLevel } from '../enums/error-log.enum';

@Catch()
export class GqlExceptionFilter implements NestGqlExceptionFilter {
  private readonly logger = new Logger('GqlExceptionFilter');
  private errorLogs?: ErrorLogsService;

  constructor(private readonly moduleRef: ModuleRef) {}

  private getErrorLogs(): ErrorLogsService | undefined {
    if (!this.errorLogs) {
      try {
        this.errorLogs = this.moduleRef.get(ErrorLogsService, { strict: false });
      } catch {
        // Service unavailable (e.g. during bootstrap) — skip persistence
      }
    }
    return this.errorLogs;
  }

  catch(exception: unknown, host: ArgumentsHost): GraphQLError {
    if (exception instanceof GraphQLError) return exception;

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    let message =
      exception instanceof Error ? exception.message : 'Internal server error';

    // Surface class-validator details ("quantity must not be less than 1")
    // instead of the generic "Bad Request Exception" wrapper.
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === 'object' && resp !== null && 'message' in resp) {
        const respMessage = (resp as { message: string | string[] }).message;
        message = Array.isArray(respMessage)
          ? respMessage.join('; ')
          : respMessage;
      }
    }

    if (status === 429) {
      message = 'Too many requests - please wait a moment and try again.';
    }

    const stack = exception instanceof Error ? exception.stack : undefined;

    const code =
      status === 401
        ? 'UNAUTHENTICATED'
        : status === 403
          ? 'FORBIDDEN'
          : status === 400
            ? 'BAD_USER_INPUT'
            : status === 404
              ? 'NOT_FOUND'
              : status === 429
                ? 'TOO_MANY_REQUESTS'
                : 'INTERNAL_SERVER_ERROR';

    let context = 'GraphQL';
    let restaurantId: string | undefined;
    let authenticated = false;
    try {
      const gqlHost = GqlArgumentsHost.create(host);
      const info: any = gqlHost.getInfo();
      const ctx: any = gqlHost.getContext();
      if (info?.fieldName) {
        context = `${info.parentType?.name ?? 'GraphQL'}.${info.fieldName}`;
      }
      authenticated = !!ctx?.req?.user;
      restaurantId = ctx?.req?.user?.restaurantId?.toString();
    } catch {
      /* non-GraphQL context */
    }

    this.logger.error(`[${code}] ${context}: ${message}`, stack);

    if (status >= 500) {
      const svc = this.getErrorLogs();
      svc?.error(message, { context, stack, restaurantId, meta: { code } }).catch(() => {});
    } else if (status === 403 && authenticated) {
      // Only a signed-in user's 403 is worth keeping: it means someone reached
      // for data that is not theirs. An anonymous 403 is the public menu doing
      // its job - a closed restaurant, a suspended one, one still awaiting
      // approval - and logging those buries real incidents under routine
      // refusals, one row per scan.
      //
      // 401s stay console-only: a logged-out dashboard is expected, and a
      // client-side refetch loop can flood the DB with warn writes.
      const svc = this.getErrorLogs();
      svc?.warn(message, { context, restaurantId, meta: { code, status } }).catch(() => {});
    }

    return new GraphQLError(message, {
      extensions: {
        code,
        status,
        ...(process.env.NODE_ENV !== 'production' && stack ? { stacktrace: stack.split('\n') } : {}),
      },
    });
  }
}
