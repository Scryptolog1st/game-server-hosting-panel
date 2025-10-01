import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO } from './dto';
import { UseGuards, Get } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { CurrentUser as CU } from './current-user.decorator';

function parse<T>(schema: any, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new BadRequestException(r.error.flatten());
  return r.data as T;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }

  @Post('register')
  async register(@Body() body: unknown) {
    const dto = parse<{ email: string; password: string; orgName: string }>(RegisterDTO, body);
    return this.auth.register(dto.email, dto.password, dto.orgName);
  }

  @Post('login')
  async login(@Body() body: unknown) {
    const dto = parse<{ email: string; password: string }>(LoginDTO, body);
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    if (!body?.refresh) throw new BadRequestException('Missing refresh token');
    return this.auth.refresh(body.refresh);
  }

  // 👇 NEW: protected endpoint to verify the access token
  @Get('me')
  @UseGuards(JwtGuard)
  async me(@CU() user: { id: string; org: string } | null) {
    return { userId: user?.id, orgId: user?.org };
  }
}
