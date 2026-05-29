import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString() @MinLength(1) label: string;
  @IsString() @MinLength(1) value: string;
  @IsOptional() @IsBoolean() isIncome?: boolean;
}
