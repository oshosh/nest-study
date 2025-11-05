import { Controller, Get, Headers, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UseGuards } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('register')
  // authorization: Basic $token
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }

  // https://www.jwt.io/ 에서 토큰 생성 가능
  @Public()
  @Post('login')
  // authorization: Basic $token
  loginUser(@Headers('authorization') token: string) {
    return this.authService.login(token);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Request() req: Request & { user: User }) {
    return {
      refreshToken: await this.authService.issueToken(req.user, true),
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  private(@Request() req: Request & { user: User }) {
    return req.user;
  }

  // access token 갱신
  @Post('token/access')
  async rotateAccessToken(@Request() req: Request & { user: User }) {
    return {
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }
}
