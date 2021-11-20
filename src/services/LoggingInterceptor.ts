import {Injectable, NestInterceptor, ExecutionContext, CallHandler} from '@nestjs/common';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {Request} from 'express';
import * as crypto from 'crypto';
import Logger from '../Logger';

const logger = Logger.getLogger('RequestLogger');
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (['http', 'graphql'].indexOf(context.getType() as string) === -1) {
            return next.handle();
        }
        const buf = Buffer.alloc(6);
        crypto.randomFillSync(buf);
        const requestId = buf.toString('hex');
        const request: Request =
            (context.getType() as string) === 'graphql'
                ? context.getArgs()[2]?.req
                : context.switchToHttp().getRequest();
        if (logger.isTraceEnabled()) {
            logger.trace('%s - %s(%s)(%j)', requestId, request.method, request._parsedUrl.pathname, {
                query: request.query,
                params: request.params,
                body: request.body,
            });
        } else {
            logger.info('%s - %s(%s)', requestId, request.method, request._parsedUrl.pathname);
        }

        const now = Date.now();
        return next
            .handle()
            .pipe(
                tap(() =>
                    logger.info(
                        '%s - %s(%s) time execute %sms',
                        requestId,
                        request.method,
                        request._parsedUrl.pathname,
                        Date.now() - now,
                    ),
                ),
            );
    }
}
