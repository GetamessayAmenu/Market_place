import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCallbackRequestDto {
  @IsUUID()
  @IsNotEmpty()
  listingId!: string;

  @IsUUID()
  @IsNotEmpty()
  sellerId!: string;

  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  name!: string;

  @IsNotEmpty()
  @MaxLength(20)
  @IsString()
  phone!: string;

  @IsOptional()
  @MaxLength(100)
  @IsString()
  preferredTime?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
