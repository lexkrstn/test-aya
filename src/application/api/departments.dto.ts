import { IsInt, Min, IsDate, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDepartmentsDto {
  @Min(1)
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  months = 12;

  @Min(0)
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  employees = 3;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  date = new Date();
}
