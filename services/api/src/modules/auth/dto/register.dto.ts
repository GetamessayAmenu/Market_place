import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must include upper, lower, and a digit',
  })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^(\+251|0)(9|7)\d{8}$/, {
    message: 'Enter a valid Ethiopian phone number (e.g. 09XXXXXXXX or +2519XXXXXXXX)',
  })
  phone?: string;

  @IsOptional()
  @IsIn(['buyer', 'seller'])
  userType?: 'buyer' | 'seller';
}
