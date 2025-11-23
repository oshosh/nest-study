import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // query failed error는 typeorm에서 제공하는 예외 클래스이므로 getStatus 메서드를 사용할 수 없다.
    const status = 400; // 클라이언트 에러기 때문에

    let message = '데이터베이스 오류가 발생했습니다.';

    // 예를 들어 service에서 중복된 키를 체크 해주는 것을 작성하지 않았을때 해당 오류를 체크해서 처리해줄 수 있다.
    // example: throw new NotFoundException('장르가 이미 존재합니다.')
    if (exception.message.includes('중복된 키 값이')) {
      // DB 로케일이 한글로 설정되어 있어서 오류 메시지가 한글로 나온다. includes 메서드를 사용하여 체크해준다.
      message = '이미 존재하는 데이터입니다. 중복된 데이터를 입력하지 마세요.';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
