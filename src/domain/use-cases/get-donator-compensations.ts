import { Inject, Injectable, Scope } from '@nestjs/common';
import { IAccountingGateway } from '@/domain/interfaces/accounting.gateway';

@Injectable({ scope: Scope.REQUEST })
export class GetDonatorCompensations {
  private from: Date;
  private to: Date;
  private minSum = 100;
  private pool = 10_000;

  public constructor(
    @Inject(IAccountingGateway) private accountingGateway: IAccountingGateway,
  ) {
    this.setLastMonths(12);
  }

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

  public setMinimumDonationSum(value: number) {
    this.minSum = value;
    return this;
  }

  public setCompensationPool(value: number) {
    this.pool = value;
    return this;
  }

  public execute() {
    return this.accountingGateway.getDonatorCompensations({
      pool: this.pool,
      minSum: this.minSum,
      from: this.from,
      to: this.to,
    });
  }
}
