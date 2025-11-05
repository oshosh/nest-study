import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { envVariables } from 'src/common/const/env.const';
import { Role } from 'src/user/entities/user.entity';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Bearer $token
    // Basic $token
    const authHeader = req.headers['authorization'] as string;
    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    try {
      // jwt io에서도 확인했지만 refresh 토큰인지 access 토큰인지 확인하기 위해 decode를 사용
      const decodedPayload: { sub: number; role: Role; type: string } =
        await this.jwtService.decode(token);

      if (
        decodedPayload.type !== 'refresh' &&
        decodedPayload.type !== 'access'
      ) {
        throw new UnauthorizedException('잘못된 토큰 타입입니다.');
      }

      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariables.refreshTokenSecret
          : envVariables.accessTokenSecret;

      // payload + 검증 = verifyAsync
      const payload: { sub: number; role: Role; type: string } =
        await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>(secretKey),
        });

      req.user = payload;
      next();
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        // 리프레시 토큰이 사라지거나 만료인 경우
        throw new UnauthorizedException('토큰이 만료되었습니다.');
      }
    }
  }

  validateBearerToken(rawToken: string) {
    const bearerSplit = rawToken.split(' ');
    if (bearerSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [bearer, token] = bearerSplit;
    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    return token;
  }
}
