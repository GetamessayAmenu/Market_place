import { createHash, randomBytes } from 'node:crypto';

import type { AuthUser } from '@marketplace/types';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ApiConfigService } from '../../infrastructure/config/api-config.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { RolesService } from '../roles/roles.service';
import type {
  SessionDeviceInfo,
  SessionRecord,
} from '../sessions/interfaces/session-record.interface';
import { SessionsService } from '../sessions/sessions.service';
import type { UserWithRole } from '../users/users.repository';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';

import { DEFAULT_REGISTER_ROLE, PASSWORD_RESET_REDIS_PREFIX, PASSWORD_RESET_TOKEN_TTL_SECONDS } from './auth.constants';
import { AuthRepository } from './auth.repository';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import type { RegisterDto } from './dto/register.dto';
import {
  AccountBannedException,
  AccountSuspendedException,
  EmailAlreadyRegisteredException,
  InvalidCredentialsException,
  PhoneAlreadyRegisteredException,
  SessionInvalidException,
} from './exceptions/auth.exceptions';
import { TokenService } from './token.service';
import {
  clearAuthCookies,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from './utils/cookie.util';
import { hashPassword, verifyPassword } from './utils/password.util';
import { parseDurationToMs } from './utils/token.util';
import { VerificationService } from './verification/verification.service';

export interface RequestContext {
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly sessionsService: SessionsService,
    private readonly tokenService: TokenService,
    private readonly verificationService: VerificationService,
    private readonly config: ApiConfigService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto, ctx: RequestContext, res: Response): Promise<AuthResponseDto> {
    if (await this.authRepository.emailExists(dto.email)) {
      throw new EmailAlreadyRegisteredException();
    }

    if (dto.phone && (await this.authRepository.phoneExists(dto.phone))) {
      throw new PhoneAlreadyRegisteredException();
    }

    const roleSlug = dto.userType || DEFAULT_REGISTER_ROLE;
    const roleId = await this.rolesService.getRoleIdBySlug(roleSlug);
    const passwordHash = await hashPassword(dto.password);

    const user = await this.authRepository.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      roleId,
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
    });

    const verification = await this.verificationService.createEmailVerification(user.id);

    return this.issueAuthResponse(user, ctx, res, {
      emailToken: verification.token,
    });
  }

  async login(dto: LoginDto, ctx: RequestContext, res: Response): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    this.assertAccountActive(user.status);

    const valid = await verifyPassword(dto.password, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsException();
    }

    await this.usersRepository.updateLastLogin(user.id);

    return this.issueAuthResponse(user, ctx, res);
  }

  async refresh(
    session: SessionRecord,
    refreshToken: string,
    _ctx: RequestContext,
    res: Response,
    accessTokenToRevoke?: string,
  ): Promise<AuthResponseDto> {
    if (accessTokenToRevoke) {
      try {
        const payload = this.tokenService.verifyAccessToken(accessTokenToRevoke);
        await this.sessionsService.blacklistAccessToken(payload.jti);
      } catch {
        // ignore invalid access token on refresh
      }
    }

    const rotated = await this.sessionsService.rotateRefreshToken(session, refreshToken);
    const user = await this.usersRepository.findActiveById(session.userId);
    if (!user) {
      throw new SessionInvalidException();
    }

    this.assertAccountActive(user.status);

    const signed = this.tokenService.signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.slug as AuthUser['role'],
      sessionId: session.sessionId,
    });

    this.setAuthCookies(res, signed.accessToken, rotated.refreshToken);

    return {
      user: this.usersService.toAuthUser(user),
      tokens: {
        accessToken: signed.accessToken,
        expiresIn: signed.expiresIn,
      },
    };
  }

  async logout(
    user: AuthenticatedUser,
    res: Response,
    accessToken?: string,
  ): Promise<{ readonly success: true }> {
    const session = await this.sessionsService.assertSessionActive(user.sessionId);
    await this.sessionsService.invalidateSession(session);

    if (accessToken) {
      try {
        const payload = this.tokenService.verifyAccessToken(accessToken);
        await this.sessionsService.blacklistAccessToken(payload.jti);
      } catch {
        // ignore
      }
    }

    clearAuthCookies(res, this.cookieOptions());
    return { success: true };
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.usersRepository.findActiveById(userId);
    if (!user) {
      throw new InvalidCredentialsException('User not found');
    }
    return this.usersService.toAuthUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ readonly success: true }> {
    const user = await this.usersRepository.findActiveById(userId);
    if (!user) {
      throw new InvalidCredentialsException('User not found');
    }

    const valid = await verifyPassword(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsException('Current password is incorrect');
    }

    const newHash = await hashPassword(dto.newPassword);
    await this.authRepository.updatePassword(userId, newHash);

    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ readonly success: true }> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      // Always return success to prevent email enumeration
      return { success: true };
    }

    const token = randomBytes(32).toString('base64url');
    const hash = createHash('sha256').update(token).digest('hex');
    const payload = JSON.stringify({ userId: user.id, email: user.email });

    await this.redis.setex(
      `${PASSWORD_RESET_REDIS_PREFIX}${hash}`,
      PASSWORD_RESET_TOKEN_TTL_SECONDS,
      payload,
    );

    // In production, send the token via email.
    // In development, the token is returned for testing.
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ readonly success: true }> {
    const hash = createHash('sha256').update(dto.token).digest('hex');
    const key = `${PASSWORD_RESET_REDIS_PREFIX}${hash}`;
    const raw = await this.redis.get(key);

    if (!raw) {
      throw new InvalidCredentialsException('Invalid or expired reset token');
    }

    const payload = JSON.parse(raw) as { userId: string; email: string };
    await this.redis.del(key);

    const newHash = await hashPassword(dto.newPassword);
    await this.authRepository.updatePassword(payload.userId, newHash);

    return { success: true };
  }

  private async issueAuthResponse(
    user: UserWithRole,
    ctx: RequestContext,
    res: Response,
    verification?: { emailToken?: string },
  ): Promise<AuthResponseDto> {
    const device: SessionDeviceInfo = {
      ...(ctx.ipAddress !== undefined ? { ipAddress: ctx.ipAddress } : {}),
      ...(ctx.userAgent !== undefined ? { userAgent: ctx.userAgent } : {}),
    };

    const session = await this.sessionsService.createSession({
      userId: user.id,
      device,
    });

    const signed = this.tokenService.signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.slug as AuthUser['role'],
      sessionId: session.sessionId,
    });

    this.setAuthCookies(res, signed.accessToken, session.refreshToken);

    const base: AuthResponseDto = {
      user: this.usersService.toAuthUser(user),
      tokens: {
        accessToken: signed.accessToken,
        expiresIn: signed.expiresIn,
      },
    };

    if (verification?.emailToken && this.config.nodeEnv === 'development') {
      return { ...base, verification: { emailToken: verification.emailToken } };
    }

    return base;
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const security = this.cookieOptions();
    setAccessTokenCookie(res, accessToken, parseDurationToMs(this.config.jwtAccessExpiresIn), security);
    setRefreshTokenCookie(
      res,
      refreshToken,
      parseDurationToMs(this.config.jwtRefreshExpiresIn),
      security,
    );
  }

  private cookieOptions() {
    return {
      secure: this.config.cookieSecure,
      sameSite: this.config.cookieSameSite,
    };
  }

  private assertAccountActive(status: string): void {
    if (status === 'suspended') {
      throw new AccountSuspendedException();
    }
    if (status === 'banned') {
      throw new AccountBannedException();
    }
  }
}
