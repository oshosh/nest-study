import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [, token] = basicSplit;
    // 토큰 디코딩으로 이메일과 비밀번호로 나눈다.
    const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
    const tokenSplit = decodedToken.split(':');
    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
    }
    const [email, password] = tokenSplit;
    return { email, password };
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    const rounds = this.configService.get<number>('HASH_ROUNDS');
    if (!rounds) {
      throw new BadRequestException('복잡도 설정이 되어 있지 않습니다.');
    }
    const hashedPassword = await bcrypt.hash(password, rounds);
    await this.userRepository.save({ email, password: hashedPassword });

    return await this.userRepository.findOne({ where: { email } });
  }
}
