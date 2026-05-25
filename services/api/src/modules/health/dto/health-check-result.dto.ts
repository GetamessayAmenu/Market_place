export type DependencyStatus = 'up' | 'down';

export interface HealthCheckResultDto {
  readonly status: 'ok' | 'degraded';
  readonly checks: {
    readonly database: DependencyStatus;
    readonly redis: DependencyStatus;
  };
  readonly timestamp: string;
}
