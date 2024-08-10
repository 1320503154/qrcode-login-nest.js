import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';

import { QrCodeService } from './qrcode/qrcode.service';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'LHGsecretKey',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, QrCodeService, AuthService],
})
export class AppModule {}
