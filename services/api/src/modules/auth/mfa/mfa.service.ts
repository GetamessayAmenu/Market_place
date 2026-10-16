import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { SecurityEventsService } from '../../security-events/security-events.service';
import {
  generateOtpAuthUri,
  generateRecoveryCodes,
  generateTotpSecret,
  verifyTotp,
} from '../utils/mfa.util';
import { verifyPassword } from '../utils/password.util';

const STEP_UP_PREFIX = 'mp:stepup:';
const STEP_UP_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly securityEventsService: SecurityEventsService,
  ) {}

  /**
   * Generates a new TOTP secret and recovery codes for admin MFA setup.
   */
  async generateMfaSetup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = generateTotpSecret(20);
    const recoveryCodes = generateRecoveryCodes(8);
    const otpAuthUri = generateOtpAuthUri(secret, user.email, 'HabeshaMarketplace');

    await this.prisma.adminProfile.upsert({
      where: { userId },
      update: {
        mfaSecret: secret,
        mfaRecoveryCodes: recoveryCodes,
      },
      create: {
        userId,
        mfaSecret: secret,
        mfaRecoveryCodes: recoveryCodes,
        mfaEnabled: false,
        mfaEnforced: user.roleId !== undefined,
      },
    });

    return {
      secret,
      otpAuthUri,
      recoveryCodes,
    };
  }

  /**
   * Confirms TOTP setup by verifying the first code, activating MFA.
   */
  async enableMfa(userId: string, code: string, ipAddress?: string, userAgent?: string) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.mfaSecret) {
      throw new BadRequestException('MFA setup has not been initiated.');
    }

    const isValid = verifyTotp(code, profile.mfaSecret);
    if (!isValid) {
      await this.securityEventsService.recordEvent({
        eventType: 'MFA_FAILED',
        severity: 'WARNING',
        actorId: userId,
        targetUserId: userId,
        ipAddress,
        userAgent,
        details: { action: 'enable_mfa_verification_failed' },
        status: 'FAILURE',
      });
      throw new BadRequestException('Invalid verification code.');
    }

    await this.prisma.adminProfile.update({
      where: { userId },
      data: { mfaEnabled: true },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'MFA_ENABLED',
      severity: 'INFO',
      actorId: userId,
      targetUserId: userId,
      ipAddress,
      userAgent,
      details: { message: 'MFA successfully enabled.' },
      status: 'SUCCESS',
    });

    return { success: true, message: 'Two-factor authentication enabled successfully.' };
  }

  /**
   * Verifies an MFA token or recovery code during privileged login or step-up authentication.
   */
  async verifyMfa(
    userId: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.mfaSecret) {
      // If profile does not require MFA, pass
      return true;
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Check TOTP 6-digit token
    if (cleanCode.length === 6 && /^\d+$/.test(cleanCode)) {
      const isValid = verifyTotp(cleanCode, profile.mfaSecret);
      if (isValid) {
        return true;
      }
    }

    // 2. Check recovery code (format RC-XXXX-XXXX)
    if (cleanCode.startsWith('RC-') && profile.mfaRecoveryCodes.includes(cleanCode)) {
      // Burn the recovery code so it can only be used once
      const updatedCodes = profile.mfaRecoveryCodes.filter((c) => c !== cleanCode);
      await this.prisma.adminProfile.update({
        where: { userId },
        data: { mfaRecoveryCodes: updatedCodes },
      });

      await this.securityEventsService.recordEvent({
        eventType: 'MFA_RECOVERY_CODE_USED',
        severity: 'WARNING',
        actorId: userId,
        targetUserId: userId,
        ipAddress,
        userAgent,
        details: { remainingRecoveryCodes: updatedCodes.length },
        status: 'SUCCESS',
      });

      return true;
    }

    // Invalid code
    await this.securityEventsService.recordEvent({
      eventType: 'MFA_FAILED',
      severity: 'WARNING',
      actorId: userId,
      targetUserId: userId,
      ipAddress,
      userAgent,
      details: { attempt: 'invalid_mfa_code' },
      status: 'FAILURE',
    });

    return false;
  }

  /**
   * Disables MFA for an admin (requires password confirmation).
   */
  async disableMfa(
    userId: string,
    currentPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, adminProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role.slug === 'super_admin') {
      throw new BadRequestException('MFA cannot be disabled for Super Admin accounts.');
    }

    const validPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Current password incorrect.');
    }

    await this.prisma.adminProfile.update({
      where: { userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaRecoveryCodes: [],
      },
    });

    await this.securityEventsService.recordEvent({
      eventType: 'MFA_DISABLED',
      severity: 'WARNING',
      actorId: userId,
      targetUserId: userId,
      ipAddress,
      userAgent,
      details: { message: 'MFA disabled by user.' },
      status: 'SUCCESS',
    });

    return { success: true };
  }

  /**
   * Creates a 5-minute step-up authentication verification token for extremely sensitive actions.
   */
  async createStepUpToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.setex(`${STEP_UP_PREFIX}${token}`, STEP_UP_TTL_SECONDS, userId);
    return token;
  }

  /**
   * Verifies that the step-up token is valid and belongs to the active user.
   */
  async verifyStepUpToken(userId: string, stepUpToken: string): Promise<boolean> {
    if (!stepUpToken) return false;
    const storedUserId = await this.redis.get(`${STEP_UP_PREFIX}${stepUpToken}`);
    return storedUserId === userId;
  }
}
