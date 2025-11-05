import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Role, User } from 'src/user/entities/user.entity';
import { Reflector } from '@nestjs/core';
import { RBAC } from '../decorator/rbac.decorator';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.get<Role>(RBAC, context.getHandler());

    // Role enum에 해당되는 값이 데코레이터가 들어가있는지 확인
    if (!Object.values(Role).includes(role)) {
      return true;
    }

    // 요청에서 user 객체가 존재하는지 확인
    const request: Request & { user: User & { type: string } } = context
      .switchToHttp()
      .getRequest();

    // rbac 특성한 user의 guard로 부터 통과되어야 한 조건으로 판단하기 위해 user 객체를 가져온다.
    const user = request.user;

    if (!user) {
      return false;
    }

    // 예를 들어 admin이 0번일때 기존 롤 설정에 따라 admin은 자기 자신인 0이거나 작은 경우 통과한다.
    return user.role <= role;
  }
}
