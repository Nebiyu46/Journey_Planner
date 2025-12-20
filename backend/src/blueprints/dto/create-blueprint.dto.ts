import { IsString, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StepDto } from './step.dto';

export class CreateBlueprintDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  institution: string;

  @IsString()
  @IsNotEmpty()
  targetAudience: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepDto)
  rootSteps: StepDto[];
}
