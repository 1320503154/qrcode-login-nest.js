import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as qrcode from 'qrcode';
import { JwtService } from '@nestjs/jwt';

export interface QrCodeInfo {
    status: 'noscan' | 'scan-wait-confirm' | 'scan-confirm' | 'scan-cancel' | 'expired';
    userInfo?: {
      userId: number;
    };
  }
  
  @Injectable()
  export class QrCodeService {
    private readonly map = new Map<string, QrCodeInfo>();
  
    async generateQrCode(baseURL: string): Promise<{ qrcode_id: string; img: string }> {
      const uuid = randomUUID();
      const dataUrl = await qrcode.toDataURL(`http://${baseURL}:3000/pages/confirm.html?id=${uuid}`);
      this.map.set(`qrcode_${uuid}`, { status: 'noscan' });
      return { qrcode_id: uuid, img: dataUrl };
    }
  
    getQrCodeStatus(id: string): QrCodeInfo | { status: 'expired' } {
      const info = this.map.get(`qrcode_${id}`);
      return info || { status: 'expired' };
    }
  
    scanQrCode(id: string): string {
      const info = this.map.get(`qrcode_${id}`);
      if (!info) {
        throw new BadRequestException('二维码已过期');
      }
      info.status = 'scan-wait-confirm';
      return 'success';
    }
  
    confirmQrCode(id: string): string {
      const info = this.map.get(`qrcode_${id}`);
      if (!info) {
        throw new BadRequestException('二维码已过期');
      }
      if (info.status !== 'scan-wait-confirm') {
        throw new BadRequestException('状态不正确');
      }
      info.status = 'scan-confirm';
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