import { Strategy } from 'passport-local';
import { PassportStrategy, AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

/**
 * AuthGuard('oshosh') 에서 oshosh 는 LocalStrategy 의 이름
 */
export class LocalAuthGuard extends AuthGuard('oshosh') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'oshosh') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  /**
   * localStrategy
   *
   * json body로 전달해야함 { username: string, password: string } LocalStrategy 정책상 정해져있음
   *  => usernameField 변경 가능
   * validate: username, password를 받아서 유저를 검증하고 유저 정보를 반환한다.
   *
   * return -> Request()
   */
  async validate(email: string, password: string) {
    const user = await this.authService.authenticate(email, password);
    return user;
  }
}
