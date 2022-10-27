import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetDepartments } from '@/domain/use-cases/get-departments';
import { GetDepartmentsDto } from './departments.dto';

@Controller('api/v1/departments')
@UsePipes(new ValidationPipe({ transform: true }))
export class DepartmentsController {
  public constructor(private getDepartments: GetDepartments) {}

  @Get()
  public async getAll(@Query() dto: GetDepartmentsDto) {
    return this.getDepartments
      .setLastMonths(dto.months, dto.date)
      .setMaxEmployees(dto.employees)
      .execute();
  }
}
