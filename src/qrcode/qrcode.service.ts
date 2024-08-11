import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as qrcode from 'qrcode';
import { JwtService } from '@nestjs/jwt';

export interface QrCodeInfo {
  status: 'noscan' | 'scan-wait-confirm' | 'scan-confirm' | 'scan-cancel' | 'expired';
  userInfo?: {
    userId: number;
  };
  token?: string;  // 添加这个可选的 token 字段
}

@Injectable()
export class QrCodeService {
  private readonly users = [
    { id: 1, username: 'admin', password: 'admin' },
    { id: 2, username: 'user', password: 'user' },
  ];

  private readonly map = new Map<string, QrCodeInfo>();

  constructor(private readonly jwtService: JwtService) {}

  async generateQrCode(baseURL: string): Promise<{ qrcode_id: string; img: string }> {
    const uuid = randomUUID();
    const dataUrl = await qrcode.toDataURL(`http://${baseURL}:3000/pages/confirm.html?id=${uuid}`);
    this.map.set(`qrcode_${uuid}`, { status: 'noscan' });
    return { qrcode_id: uuid, img: dataUrl };
  }

  async getQrCodeStatus(id: string): Promise<QrCodeInfo> {
    const info = this.map.get(`qrcode_${id}`);
    if (!info) {
      return { status: 'expired' };
    }
    if (info.status === 'scan-confirm' && info.userInfo) {
      return {
        ...info,
        token: await this.jwtService.sign({ userId: info.userInfo.userId }),
      };
    }
    return info;
  }

  scanQrCode(id: string): string {
    const info = this.map.get(`qrcode_${id}`);
    if (!info) {
      throw new BadRequestException('二维码已过期');
    }
    info.status = 'scan-wait-confirm';
    return 'success';
  }

  async confirmQrCode(id: string, auth: string): Promise<string> {
    let user;
    try {
      const [, token] = auth.split(' ');
      const userId = await this.jwtService.verify(token);
      user = this.users.find((item) => item.id == userId.userId);
    } catch (e) {
      throw new UnauthorizedException('token 过期，请重新登录');
    }
    const info = this.map.get(`qrcode_${id}`);
    if (!info) {
      throw new BadRequestException('二维码已过期');
    }
    if (info.status !== 'scan-wait-confirm') {
      throw new BadRequestException('状态不正确');
    }
    info.status = 'scan-confirm';
    info.userInfo = user;
    return 'success';
  }

  cancelQrCode(id: string): string {
    const info = this.map.get(`qrcode_${id}`);
    if (!info) {
      throw new BadRequestException('二维码已过期');
    }
    if (info.status !== 'scan-wait-confirm') {
      throw new BadRequestException('状态不正确');
    }
    info.status = 'scan-cancel';
    return 'success';
  }
}