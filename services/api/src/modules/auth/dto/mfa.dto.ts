import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class EnableMfaDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Verification code must be 6 digits' })
  code!: string;
}

export class DisableMfaDto {
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class VerifyMfaLoginDto {
  @IsString()
  @IsNotEmpty()
  mfaTicket!: string;

  @IsString()
  @IsNotEmpty()
  mfaCode!: string;
}
