import { Department } from '@/domain/entities/Department';
import { Bonus } from '../entities/bonus';
import { Employee } from '../entities/Employee';

export type GetDonatorCompensationsRequest = {
  minSum: number;
  from: Date;
  to: Date;
  pool: number;
};

export type DonatorCompensation = {
  employee: Employee;
  compensation: number;
};

export type DepartmentWithAmount = {
  department: Department;
  amount: number;
};

export interface IAccountingGateway {
  getDonatorCompensations(
    req: GetDonatorCompensationsRequest,
  ): Promise<DonatorCompensation[]>;

  getMostAvgDonatedDepartment(
    from?: Date,
    to?: Date,
  ): Promise<DepartmentWithAmount>;

  rewardDepartmentEmployees(
    departmentId: number,
    amount: number,
  ): Promise<Bonus[]>;
}

export const IAccountingGateway = Symbol('IAccountingGateway');
