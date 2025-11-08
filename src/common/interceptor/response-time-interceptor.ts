import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();

    const reqTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const respTime = Date.now();
        const diff = respTime - reqTime;
        console.log(`[${req.method}] ${req.url}] ${diff}ms`);
        // if (diff > 1000) {
        //   console.log(`!!!TIME OUT!!! [${req.method}] ${req.url}] ${diff}ms`);

        //   throw new InternalServerErrorException(
        //     '시간이 너무 오래 걸렸습니다!',
        //   );
        // } else {
        //   console.log(`[${req.method}] ${req.url}] ${diff}ms`);
        // }
      }),
    );
  }
}
