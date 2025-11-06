import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의되지 않은 속성은 제거
      forbidNonWhitelisted: true, // 정의되지 않은 속성이 있으면 에러 발생
      transformOptions: {
        // 명시적인 타입 변환을 허용 url에서 온 값을 자동으로 타입 변환
        enableImplicitConversion: true,
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
