import { Inject, Injectable, Scope } from '@nestjs/common';
import { IEmployeesGateway } from '@/domain/interfaces/employees.gateway';

@Injectable({ scope: Scope.REQUEST })
export class GetDonators {
  private dateFrom: Date;
  private dateTo: Date;
  private minDonationRatio: number;

  public constructor(
    @Inject(IEmployeesGateway) private employeeGateway: IEmployeesGateway,
  ) {
    this.setMinDonationRatio(0.1);
    this.setLastMonths(6);
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

  public setMinDonationRatio(ratio: number) {
    this.minDonationRatio = ratio;
    return this;
  }

  public execute() {
    return this.employeeGateway.getDonators({
      minDonationRatio: this.minDonationRatio,
      from: this.dateFrom,
      to: this.dateTo,
    });
  }
}
