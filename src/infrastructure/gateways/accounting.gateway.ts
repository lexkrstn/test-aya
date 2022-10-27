import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IAccountingGateway,
  GetDonatorCompensationsRequest,
  DonatorCompensation,
} from '@/domain/interfaces/accounting.gateway';
import { Employee } from '@/domain/entities/Employee';
import { Department } from '@/domain/entities/Department';
import { Bonus } from '@/domain/entities/bonus';
import { formatIsoDate } from '@/infrastructure/helpers/date';

@Injectable()
export class AccountingGateway implements IAccountingGateway {
  public constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(Employee)
    private departmentRepo: Repository<Department>,
    @InjectRepository(Bonus)
    private bonusRepo: Repository<Bonus>,
  ) {}

  public async getDonatorCompensations({
    minSum,
    from,
    to,
    pool,
  }: GetDonatorCompensationsRequest) {
    const rows: Record<string, any>[] = await this.employeeRepo.query(
      `
        select e.*
          , $1 * (d.donations / td."totalDonations") as compensation
        from (
          select d."employeeId", sum(d.amount) as donations
          from donation d
          where d."date" between $2 and $3
          group by d."employeeId"
          having sum(d.amount) > $4::money
        ) as d
        cross join (
          select sum(amount) as "totalDonations"
          from donation d
          where d."date" between $2 and $3
        ) as td
        join employee e on e.id = d."employeeId";
      `,
      [pool, formatIsoDate(from), formatIsoDate(to), minSum],
    );

    return rows.map(
      (row): DonatorCompensation => ({
        employee: this.employeeRepo.create(row),
        compensation: Math.floor(row.compensation * 100) / 100,
      }),
    );
  }

  public async getMostAvgDonatedDepartment(
    from = new Date(0),
    to = new Date(),
  ) {
    const rows: Record<string, any>[] = await this.employeeRepo.query(
      `
        select dep.*, (sum(don.amount) / count(distinct e.id)) amount
        from department dep
        join employee e on e."departmentId" = dep.id
        join donation don on don."employeeId" = e.id
        where don."date" between $1 and $2
        group by dep.id
        order by amount desc
        limit 1
      `,
      [formatIsoDate(from), formatIsoDate(to)],
    );

    let department: Department | null = null;
    let amount = 0;
    if (rows.length > 0) {
      department = this.departmentRepo.create(rows[0]);
      amount = rows[0].amount;
    }
    return { department, amount };
  }

  public async rewardDepartmentEmployees(departmentId: number, amount: number) {
    const rows: Record<string, any>[] = await this.bonusRepo.query(
      `
        insert into bonus (amount, "date", "employeeId")
        select $1::money
          , date(now())
          , e.id
        from employee e
        where e."departmentId" = $2
        returning *;
      `,
      [amount, departmentId],
    );

    return rows.map((row) => this.bonusRepo.create(row));
  }
}
