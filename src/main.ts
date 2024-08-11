// 导入 NestFactory 以创建 Nest 应用
import { NestFactory } from '@nestjs/core';
// 导入应用模块
import { AppModule } from './app.module';
// 导入 Fastify 适配器和 NestFastifyApplication 类型
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

// 定义异步引导函数
async function bootstrap() {
  // 创建 NestFastifyApplication 实例
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  // 启用跨域请求
  app.enableCors();
  // 挂载静态资源
  app.useStaticAssets({
    // 设置静态资源根目录
    root: process.cwd() + '/static',
    // 设置静态资源的 URL 前缀
    prefix: '/pages/',
  });
  // 监听指定端口和地址
  await app.listen(3000, '0.0.0.0');
}

// 调用引导函数
bootstrap();