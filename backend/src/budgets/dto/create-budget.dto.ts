import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateBudgetDto {
  @IsString() @MinLength(1) title: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @IsPositive() limit: number;
  @IsString() categoryId: string;
}
