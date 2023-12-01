import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
// import { setupSwagger } from './setup-swagger';

const SERVER_PORT = process.env.SERVER_PORT || 7071;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // setupSwagger(app);
  await app.listen(SERVER_PORT, '0.0.0.0');
  const serverUrl = await app.getUrl();
  Logger.log(`api服务已经启动,请访问: ${serverUrl}`);
}
bootstrap();
