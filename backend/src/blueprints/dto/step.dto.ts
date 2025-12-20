import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StepDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(['To_Do', 'In_Progress', 'Completed', 'Comment'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsBoolean()
  @IsOptional()
  hasFeedback?: boolean;

  @IsNumber()
  @IsOptional()
  userRating?: number;

  @IsString()
  @IsOptional()
  userFeedback?: string;

  @IsString()
  @IsOptional()
  PersonalComment?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepDto)
  @IsOptional()
  children?: StepDto[];
}

