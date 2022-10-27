import { IsInt, IsNumber, Min, IsDate, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDonatorsDto {
  @Min(1)
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  months = 6;

  @Min(0)
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  ratio = 0.1;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  date = new Date();
}
