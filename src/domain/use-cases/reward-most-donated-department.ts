import { Inject, Injectable, Scope } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Employee } from '@/domain/entities/Employee';
import { IAccountingGateway } from '@/domain/interfaces/accounting.gateway';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable({ scope: Scope.REQUEST })
export class RewardMostDonatedDepartment {
  private from: Date = new Date(0);
  private to: Date = new Date();
  private amount = 100;

  public constructor(
    @Inject(IAccountingGateway)
    private accountingGateway: IAccountingGateway,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  public setDateRange(from: Date, to: Date) {
    this.from = from;
    this.to = to;
    return this;
  }

  public setLastMonths(n: number, to = new Date()) {
    const from = new Date(to);
    from.setMonth(from.getMonth() - n);
    return this.setDateRange(from, to);
  }

  public setRewardAmount(value: number) {
    this.amount = value;
    return this;
  }

  public async execute() {
    const { department } =
      await this.accountingGateway.getMostAvgDonatedDepartment(
        this.from,
        this.to,
      );
    if (!department) {
      return;
    }
    const bonuses = await this.accountingGateway.rewardDepartmentEmployees(
      department.id,
      this.amount,
    );
    const employees = await this.employeeRepo.find({
      where: {
        departmentId: department.id,
      },
    });
    return {
      department,
      employees: employees.map((employee) => ({
        employee,
        bonus: bonuses.find((bonus) => bonus.employeeId === employee.id),
      })),
    };
  }
}
