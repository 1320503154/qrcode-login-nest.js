import { Headers, Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { QrCodeService } from './qrcode/qrcode.service';
import { AuthService } from './auth/auth.service';
// noscan 未扫描
// scan-wait-confirm -已扫描，等待用户确认
// scan-confirm 已扫描，用户同意授权
// scan-cancel 已扫描，用户取消授权
// expired 已过期
@Controller()
export class AppController {
  constructor(
    private readonly qrCodeService: QrCodeService,
    private readonly authService: AuthService,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('qrcode/generate')
  async generate() {
    const baseURL = '192.168.10.207';
    return this.qrCodeService.generateQrCode(baseURL);
  }

  @Get('qrcode/check')
  async check(@Query('id') id: string) {
    return this.qrCodeService.getQrCodeStatus(id);
  }

  @Get('qrcode/scan')
  async scan(@Query('id') id: string) {
    return this.qrCodeService.scanQrCode(id);
  }

  @Get('qrcode/confirm')
  async confirm(@Query('id') id: string,@Headers('Authorization') auth: string) {
    return this.qrCodeService.confirmQrCode(id,auth);
  }

  @Get('qrcode/cancel')
  async cancel(@Query('id') id: string) {
    return this.qrCodeService.cancelQrCode(id);
  }

  @Get('login')
  async login(@Query('username') username: string, @Query('password') password: string) {
    return this.authService.login(username, password);
  }

  @Get('userInfo')
  async userInfo(@Headers('Authorization') auth: string) {
    const [, token] = auth.split(' ');
    return this.authService.getUserInfo(token);
  }
}