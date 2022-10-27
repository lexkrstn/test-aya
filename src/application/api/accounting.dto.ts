import { IsInt, Min, IsDate, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetCompensationsDto {
  @Min(1)
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  pool = 10_000;

  @Min(1)
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  minSum = 100;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  to = new Date();

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  from = new Date(0);
}

export class RewardDepartmentDto {
  @Min(1)
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  amount = 100;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  to = new Date();

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  from = new Date(0);
}
