import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RATE_LIMIT_AUTH_PREFIX } from './auth.constants';
import { AuthService } from './auth.service';
import type { AuthResponseDto, MeResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { SessionInvalidException } from './exceptions/auth.exceptions';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { COOKIE_ACCESS_TOKEN } from './auth.constants';
import { extractRefreshToken } from './utils/cookie.util';
import type { SessionRecord } from '../sessions/interfaces/session-record.interface';

@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @RateLimit({ limit: 10, windowMs: 60_000, keyPrefix: RATE_LIMIT_AUTH_PREFIX })
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.register(dto, this.requestContext(req), res);
  }

  @Public()
  @RateLimit({ limit: 20, windowMs: 60_000, keyPrefix: RATE_LIMIT_AUTH_PREFIX })
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.login(dto, this.requestContext(req), res);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @RateLimit({ limit: 30, windowMs: 60_000, keyPrefix: RATE_LIMIT_AUTH_PREFIX })
  @Post('refresh')
  refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request & { user: SessionRecord },
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = extractRefreshToken(req.cookies ?? {});
    if (!refreshToken) {
      throw new SessionInvalidException('Refresh token missing');
    }
    const accessToken =
      dto.accessToken ??
      (typeof req.cookies?.[COOKIE_ACCESS_TOKEN] === 'string'
        ? req.cookies[COOKIE_ACCESS_TOKEN]
        : undefined);

    return this.authService.refresh(
      req.user,
      refreshToken,
      this.requestContext(req),
      res,
      accessToken,
    );
  }

  @Post('logout')
  logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ readonly success: true }> {
    const accessToken = this.extractAccessToken(req);
    return this.authService.logout(user, res, accessToken);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    const profile = await this.authService.getMe(user.id);
    return { user: profile };
  }

  private requestContext(req: Request): {
    ipAddress?: string;
    userAgent?: string;
  } {
    const ctx: { ipAddress?: string; userAgent?: string } = {};
    if (req.ip) {
      ctx.ipAddress = req.ip;
    }
    const ua = req.get('user-agent');
    if (ua) {
      ctx.userAgent = ua;
    }
    return ctx;
  }

  private extractAccessToken(req: Request): string | undefined {
    const header = req.get('authorization');
    if (header?.startsWith('Bearer ')) {
      return header.slice(7);
    }
    const cookie = req.cookies?.[COOKIE_ACCESS_TOKEN];
    return typeof cookie === 'string' ? cookie : undefined;
  }
}
