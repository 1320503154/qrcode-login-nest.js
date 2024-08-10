import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  private readonly users = [
    { id: 1, username: 'admin', password: 'admin' },
    { id: 2, username: 'user', password: 'user' },
  ];

  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string): Promise<{ token: string }> {
    const user = this.users.find((item) => item.username === username);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    if (user.password !== password) {
      throw new UnauthorizedException('密码错误');
    }
    return {
      token: await this.jwtService.sign({ userId: user.id }),
    };
  }

  getUserInfo(token: string): { id: number; username: string; password: string } {
    try {
      const info = this.jwtService.verify(token);
      const user = this.users.find((item) => item.id == info.userId);
      if (!user) {
        throw new UnauthorizedException('无效的用户');
      }
      return user;
    } catch (e) {
      throw new UnauthorizedException('token 过期，请重新登录');
    }
  }
}