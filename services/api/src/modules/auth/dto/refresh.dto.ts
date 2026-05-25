import { IsOptional, IsString } from 'class-validator';

/** Optional body field when clients send access token for blacklisting on refresh. */
export class RefreshDto {
  @IsOptional()
  @IsString()
  accessToken?: string;
}
