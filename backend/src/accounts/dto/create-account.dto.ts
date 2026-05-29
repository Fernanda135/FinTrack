import { IsEnum, IsHexColor, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString() @MinLength(1) label: string;
  @IsEnum(AccountType) type: AccountType;
  @IsNumber() @Min(0) balance: number;
  @IsOptional() @IsHexColor() color?: string;
}
