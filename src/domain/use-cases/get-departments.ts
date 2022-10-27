import { Inject, Injectable, Scope } from '@nestjs/common';
import { IDepartmentsGateway } from '@/domain/interfaces/departments.gateway';
import { IEmployeesGateway } from '@/domain/interfaces/employees.gateway';

@Injectable({ scope: Scope.REQUEST })
export class GetDepartments {
  private maxEmployees = 3;
  private dateFrom: Date;
  private dateTo: Date;

  public constructor(
    @Inject(IDepartmentsGateway)
    private departmentsGateway: IDepartmentsGateway,
    @Inject(IEmployeesGateway)
    private employeesGateway: IEmployeesGateway,
  ) {
    this.setLastMonths(12);
  }

  public setMaxEmployees(count: number) {
    this.maxEmployees = count;
    return this;
  }

  public setDateRange(from: Date, to: Date) {
    this.dateFrom = from;
    this.dateTo = to;
    return this;
  }

  public setLastMonths(n: number, to = new Date()) {
    const from = new Date(to);
    from.setMonth(from.getMonth() - n);
    return this.setDateRange(from, to);
  }

  public async execute() {
    const departments =
      await this.departmentsGateway.getSortedByMaxMinYearSalaryDiff();
    const bySalaryIncrease =
      await this.employeesGateway.getByLargestSalaryIncrease({
        from: this.dateFrom,
        to: this.dateTo,
        maxEmployees: this.maxEmployees,
      });
    const byLastSalary = await this.employeesGateway.getByHighestLastSalary({
      byDate: this.dateTo,
      maxEmployees: this.maxEmployees,
    });
    return departments.map((departmentWrap) => ({
      ...departmentWrap,
      bySalaryIncrease: bySalaryIncrease[departmentWrap.department.id] ?? [],
      byLastSalary: byLastSalary[departmentWrap.department.id] ?? [],
    }));
  }
}
