import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { groupBy } from 'lodash';
import { Repository } from 'typeorm';
import { Employee } from '@/domain/entities/Employee';
import {
  GetDonatorsRequest,
  GetDonatorsResponse,
  GetByHighestLastSalaryRequest,
  GetByHighestLastSalaryResponse,
  GetByLargestSalaryIncreaseReequest,
  GetByLargestSalaryIncreaseResponse,
  IEmployeesGateway,
} from '@/domain/interfaces/employees.gateway';
import { formatIsoDate } from '@/infrastructure/helpers/date';

@Injectable()
export class EmployeesGateway implements IEmployeesGateway {
  public constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  /**
   * Finds employees who donated more than `minDonationRatio` of their average
   * monthly salary to charity in the [`from`, `to`] months and sorts by average
   * annual salary.
   */
  public async getDonators({
    from,
    to,
    minDonationRatio,
  }: GetDonatorsRequest): Promise<GetDonatorsResponse> {
    const rows = await this.employeeRepo.query(
      `
        select e1.*, e2."avgYearSalary"
        from (
          select distinct e.*
            , avg(s.amount::numeric) over(partition by e.id, d.id) as "avgSalary"
            , sum(d.amount::numeric) over(partition by e.id, s.id) as "donationSum"
          from employee e
          join salary s on s."employeeId" = e.id
          join donation d on d."employeeId" = e.id
          where
            s."date" between $1 and $2
            and d."date" between $1 and $2
        ) as e1
        join (
          select distinct e.id
            , sum(s.amount::numeric) over(
              partition by e.id, extract(year from s."date")
            ) as "avgYearSalary"
          from employee e
          join salary s on s."employeeId" = e.id
        ) as e2
        on e1.id = e2.id
        where e1."donationSum" > $3 * e1."avgSalary"
        order by "avgYearSalary" asc
      `,
      [formatIsoDate(from), formatIsoDate(to), minDonationRatio],
    );
    return rows.map((r): GetDonatorsResponse[number] => ({
      employee: this.employeeRepo.create(r as object),
      ratio: parseFloat(r.donationSum) / parseFloat(r.avgSalary),
      avgSalary: parseFloat(r.avgSalary),
      donationSum: parseFloat(r.donationSum),
      avgYearSalary: parseFloat(r.avgYearSalary),
    }));
  }

  public async getByLargestSalaryIncrease({
    from,
    to,
    maxEmployees,
  }: GetByLargestSalaryIncreaseReequest): Promise<GetByLargestSalaryIncreaseResponse> {
    const dateFrom = formatIsoDate(from);
    const dateTo = formatIsoDate(to);
    const rows = await this.employeeRepo.query(
      `
        select * from (
          select e.*
            , i.increase
            , row_number() over(partition by e."departmentId" order by i."increase" desc)
          from (
            select distinct s."employeeId"
              , 100::real * (last_value(s."amount"::numeric::real) over(
                partition by s."employeeId"
                order by s."date"
                range between unbounded preceding and unbounded following
              ) / first_value(s."amount"::numeric::real) over(
                partition by s."employeeId"
                order by s."date"
                range between unbounded preceding and unbounded following)
              ) as "increase"
            from salary s
            where s."date" between $1::date and $2::date
          ) as i
          join employee e on e.id = i."employeeId"
        ) as g
        where g."row_number" <= $3
        order by g."increase" desc;
      `,
      [dateFrom, dateTo, maxEmployees],
    );

    if (rows.length == 0) {
      return {};
    }
    const employeeWraps = rows.map((row: Record<any, any>) => ({
      employee: this.employeeRepo.create(row),
      salaryIncrease: row.increase as number,
    }));

    return groupBy(employeeWraps, (wrap) => wrap.employee.departmentId);
  }

  public async getByHighestLastSalary({
    byDate,
    maxEmployees,
  }: GetByHighestLastSalaryRequest): Promise<GetByHighestLastSalaryResponse> {
    const rows: Record<string, any>[] = await this.employeeRepo.query(
      `
        select ex.* from (
          select e.*
            , i."lastSalary"
            , row_number() over(
              partition by e."departmentId"
              order by i."lastSalary" desc
            ) as "row"
          from (
            select distinct s."employeeId"
              , last_value(s."amount"::numeric::real) over(
                partition by s."employeeId"
                order by s."date"
                range between unbounded preceding and unbounded following
              ) as "lastSalary"
            from salary s
            where s."date" <= $1
          ) as i
          join employee e on e.id = i."employeeId"
        ) as ex
        where ex."row" <= $2
      `,
      [formatIsoDate(byDate), maxEmployees],
    );

    if (rows.length == 0) {
      return {};
    }
    const employeeWraps = rows.map((row) => ({
      employee: this.employeeRepo.create(row),
      lastSalary: row.lastSalary as number,
    }));

    return groupBy(employeeWraps, (wrap) => wrap.employee.departmentId);
  }
}
