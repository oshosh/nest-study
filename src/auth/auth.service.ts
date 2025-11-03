import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariables } from 'src/common/const/env.const';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  parseBasicToken(rawToken: string) {
    // 1) 토큰을 ' ' 기준으로 나눈다.
    // ['Basic', '$token']
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [basic, token] = basicSplit;
    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    // 2) 토큰 디코딩으로 이메일과 비밀번호로 나눈다.
    const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
    // 3) 'email:password' 형식으로 나눈다.
    const tokenSplit = decodedToken.split(':');
    // 4) 이메일과 비밀번호가 2개가 아니면 에러를 던진다.
    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [email, password] = tokenSplit;
    return { email, password };
  }

  async parseBearerToken(rawToken: string, isRefresh: boolean) {
    // 1) 토큰을 ' ' 기준으로 나눈다.
    // ['Bearer', '$token']
    const bearerSplit = rawToken.split(' ');
    if (bearerSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [bearer, token] = bearerSplit;
    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }

    try {
      // payload + 검증 = verifyAsync
      const payload: { sub: number; role: Role; type: string } =
        await this.jwtService.verifyAsync(token, {
          // access token 검증시 사용하는 시크릿 키로 디코딩
          secret: this.configService.get<string>(
            envVariables.refreshTokenSecret,
          ),
        });

      if (isRefresh) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('리프레시 토큰이 아닙니다.');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('액세스 토큰이 아닙니다.');
        }
      }
      return payload;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        // 리프레시 토큰이 사라지거나 만료인 경우
        throw new UnauthorizedException('토큰이 만료되었습니다.');
      }
    }
  }

  //https://www.base64encode.org/ 에서 토큰 생성 가능
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    const rounds = this.configService.get<number>(envVariables.hashRounds);
    if (!rounds) {
      throw new BadRequestException('복잡도 설정이 되어 있지 않습니다.');
    }
    const hashedPassword = await bcrypt.hash(password, rounds);
    await this.userRepository.save({ email, password: hashedPassword });

    return await this.userRepository.findOne({ where: { email } });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // 존재하지 않는 이메일입니다.
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // 비밀번호가 일치하지 않습니다.
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    return user;
  }

  async issueToken(user: { id: number; role: Role }, isRefresh: boolean) {
    const secret = isRefresh
      ? this.configService.get<string>(envVariables.refreshTokenSecret)
      : this.configService.get<string>(envVariables.accessTokenSecret);
    const expiresIn = isRefresh ? '24h' : '300s';
    const type = isRefresh ? 'refresh' : 'access';

    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type,
      },
      {
        secret,
        expiresIn,
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);
    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}
