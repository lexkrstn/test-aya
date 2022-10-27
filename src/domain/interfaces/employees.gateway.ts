import { Employee } from '../entities/Employee';

export type GetDonatorsRequest = {
  from: Date;
  to: Date;
  minDonationRatio: number;
};

export type GetDonatorsResponse = {
  employee: Employee;
  ratio: number;
  avgSalary: number;
  donationSum: number;
  avgYearSalary: number;
}[];

export type GetByLargestSalaryIncreaseReequest = {
  from: Date;
  to: Date;
  maxEmployees: number;
};

export type GetByLargestSalaryIncreaseResponse = {
  [departmentId: number]: {
    employee: Employee;
    salaryIncrease: number;
  }[];
};

export type GetByHighestLastSalaryRequest = {
  byDate: Date;
  maxEmployees: number;
};

export type GetByHighestLastSalaryResponse = {
  [departmentId: number]: {
    employee: Employee;
    lastSalary: number;
  }[];
};

export interface IEmployeesGateway {
  getDonators(req: GetDonatorsRequest): Promise<GetDonatorsResponse>;

  getByLargestSalaryIncrease(
    req: GetByLargestSalaryIncreaseReequest,
  ): Promise<GetByLargestSalaryIncreaseResponse>;

  getByHighestLastSalary(
    req: GetByHighestLastSalaryRequest,
  ): Promise<GetByHighestLastSalaryResponse>;
}

export const IEmployeesGateway = Symbol('IEmployeesGateway');
