import { IsDateString, IsEnum, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsString() @MinLength(1) title: string;
  @IsNumber() @IsPositive() amount: number;
  @IsEnum(TransactionType) type: TransactionType;
  @IsString() accountId: string;
  @IsString() categoryId: string;
  @IsDateString() date: string;
}
