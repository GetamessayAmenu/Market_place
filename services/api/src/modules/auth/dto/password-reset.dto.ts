import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;
}

export class ResetPasswordDto {
  @IsString()
  readonly token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  readonly newPassword!: string;
}
