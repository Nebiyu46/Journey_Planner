import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  blueprintId: string;

  @IsString()
  @IsNotEmpty()
  stepId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsEnum(['To_Do', 'In_Progress', 'Completed'])
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  userRating?: number;

  @IsString()
  @IsOptional()
  userFeedback?: string;

  @IsString()
  @IsOptional()
  personalComment?: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsBoolean()
  @IsOptional()
  hasFeedback?: boolean;
}
