import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class UpdateProgressDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  blueprintId: string;

  @IsString()
  @IsNotEmpty()
  stepId: string;

  @IsEnum(['To_Do', 'In_Progress', 'Completed', 'Comment'])
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
}
