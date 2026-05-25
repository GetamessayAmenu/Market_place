export interface SessionDeviceInfo {
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly deviceLabel?: string;
}

export interface SessionRecord {
  readonly sessionId: string;
  readonly userId: string;
  readonly refreshTokenHash: string;
  readonly createdAt: string;
  readonly lastActiveAt: string;
  readonly rotatedAt?: string;
  readonly device: SessionDeviceInfo;
  readonly suspicious?: boolean;
}
