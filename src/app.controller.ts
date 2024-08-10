import { BadRequestException,Headers, Controller, Get, Inject, Query, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { randomUUID } from 'crypto';
import * as qrcode from 'qrcode';
import { JwtService } from '@nestjs/jwt';
// noscan 未扫描
// scan-wait-confirm -已扫描，等待用户确认
// scan-confirm 已扫描，用户同意授权
// scan-cancel 已扫描，用户取消授权
// expired 已过期
interface QrCodeInfo{
  status:'noscan'|'scan-wait-confirm'|'scan-confirm'|'scan-cancel'|'expired';
  userInfo?:{// 用户信息,是可选的
    userId:number;
  }
}

const map=new Map<string,QrCodeInfo>();

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('qrcode/generate')
  async generate() {
    const baseURL='192.168.10.207'
    const uuid = randomUUID();
    const dataUrl = await qrcode.toDataURL(`http://${baseURL}:3000/pages/confirm.html?id=${uuid}`)
    
    map.set(`qrcode_${uuid}`,{status:'noscan'});// 生成二维码时，将二维码信息存入map
    
    return {
      qrcode_id: uuid,
      img: dataUrl
    }
  }
  @Get('qrcode/check')//得到二维码的状态信息
  async check(@Query('id') id:string){
    const info=map.get(`qrcode_${id}`);
    if(info){
      return info;
    }else{
      return {
        status:'expired'
      }
    }
  }
  @Get('qrcode/scan')
  async scan(@Query('id') id:string){
    const info=map.get(`qrcode_${id}`);
    if(!info) {
      throw new BadRequestException('二维码已过期');
    }
    info.status = 'scan-wait-confirm';
    return 'success';
  }
  @Get('qrcode/confirm')
  async confirm(@Query('id') id:string){
    const info=map.get(`qrcode_${id}`);
    if(!info) {
      throw new BadRequestException('二维码已过期');
    }
    if(info.status!=='scan-wait-confirm'){
      throw new BadRequestException('状态不正确');
    }
    info.status='scan-confirm';
    return 'success';
  }
  @Get('qrcode/cancel')
  async cancel(@Query('id') id:string){
    const info=map.get(`qrcode_${id}`);
    if(!info) {
      throw new BadRequestException('二维码已过期');
    }
    if(info.status!=='scan-wait-confirm'){
      throw new BadRequestException('状态不正确');
    }
    info.status='scan-cancel';
    return 'success';
  }

  @Inject(JwtService)
  private jwtService: JwtService;

  private users=[
    {
      id:1,username:'admin',password:'admin'
    },
    {
      id:2,username:'user',password:'user'
    }
  ]
  @Get('login')
  async login(@Query('username') username:string,@Query('password') password:string){
    const user=this.users.find(item=>item.username===username);
    if(!user){
      throw new UnauthorizedException('用户不存在');
    }
    if(user.password!==password){
      throw new UnauthorizedException('密码错误');
    }
    return{
      token:await this.jwtService.sign({
        userId:user.id
      })
    }
  }
  @Get('userInfo')
  async userInfo(@Headers('Authorization') auth: string) {
      try{
        const [, token] = auth.split(' ');
        const info=this.jwtService.verify(token);
        const user = this.users.find(item => item.id == info.userId);
        return user;
      } catch(e) {
        throw new UnauthorizedException('token 过期，请重新登录');
      }
  }
  
}
