import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token-middleware';
import { envVariables } from './common/const/env.const';
import { ResponseTimeInterceptor } from './common/interceptor/response-time-interceptor';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entity/director.entity';
import { Genre } from './genre/entity/genre.entity';
import { GenreModule } from './genre/genre.module';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { Movie } from './movie/entity/movie.entity';
import { MovieModule } from './movie/movie.module';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          type: configService.get<'postgres'>(envVariables.dbType),
          host: configService.get<string>(envVariables.dbHost),
          port: configService.get<number>(envVariables.dbPort),
          username: configService.get<string>(envVariables.dbUsername),
          password: configService.get<string>(envVariables.dbPassword),
          database: configService.get<string>(envVariables.dbDatabase),
          entities: [Movie, MovieDetail, Director, Genre, User],
          synchronize: true, // 개발 환경에서만 true
        };
      },
      inject: [ConfigService],
    }),
    MovieModule,
    DirectorModule,
    GenreModule,
    UserModule,
    AuthModule,
  ],
  providers: [
    // 순서가 중요하다... guard는 위에서 부터 순차적으로 실행된다.
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // 전역 가드 설정
    },
    {
      provide: APP_GUARD,
      useClass: RBACGuard, // 전역 가드 설정
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor, // 전역 인터셉터 설정
    },
  ],
})
export class AppModule implements NestModule {
  // 모든 route에 대해 BearerTokenMiddleware를 적용 하지만 exclude 옵션을 사용하여 제외
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleware)
      .exclude(
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
