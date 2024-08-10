import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  //挂载静态资源
  app.useStaticAssets({
    root: process.cwd() + '/static',
    prefix: '/pages/',
  });
  await app.listen(3000, '0.0.0.0');
}
bootstrap();