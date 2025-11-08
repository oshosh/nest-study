import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, mergeMap, Observable } from 'rxjs';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { queryRunner: QueryRunner } & Response>();
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    req.queryRunner = qr;

    const transaction = next.handle().pipe(
      mergeMap(async (response: unknown) => {
        await qr.commitTransaction();
        await qr.release();
        return response;
      }),
      catchError(async (error) => {
        await qr.rollbackTransaction();
        await qr.release();
        throw error;
      }),
    );

    return transaction;
  }
}
