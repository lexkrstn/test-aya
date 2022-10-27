import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '@/domain/entities/Department';
import {
  IDepartmentsGateway,
  GetSortedByMaxMinYearSalaryDiff,
} from '@/domain/interfaces/departments.gateway';

@Injectable()
export class DepartmentsGateway implements IDepartmentsGateway {
  public constructor(
    @InjectRepository(Department)
    private departmentsRepo: Repository<Department>,
  ) {}

  /**
   * Returns departments in order of decreasing difference between maximum
   * and minimum average year salary.
   */
  public async getSortedByMaxMinYearSalaryDiff(): Promise<GetSortedByMaxMinYearSalaryDiff> {
    const rows: Record<string, any>[] = await this.departmentsRepo.query(`
      select d.*
        , min(ex."avgYearSalary") as "minAvgSalary"
        , max(ex."avgYearSalary") as "maxAvgSalary"
        , max(ex."avgYearSalary") - min(ex."avgYearSalary") as "maxMinSalaryDiff"
      from (
        select distinct e.*
        , sum(s.amount::numeric) over(
          partition by e.id, extract(year from s."date")
        ) as "avgYearSalary"
        from employee e
        join salary s on s."employeeId" = e.id
      ) as ex
      join department d on d.id = ex."departmentId"
      group by d.id
      order by max(ex."avgYearSalary") - min(ex."avgYearSalary") desc;
    `);
    return rows.map((row): GetSortedByMaxMinYearSalaryDiff[number] => ({
      department: this.departmentsRepo.create(row as object),
      minYearSalary: row.minAvgSalary,
      maxYearSalary: row.maxAvgSalary,
      maxMinYearSalaryDiff: row.maxMinSalaryDiff,
    }));
  }
}
