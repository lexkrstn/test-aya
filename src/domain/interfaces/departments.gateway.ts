import { Department } from '../entities/Department';

export type GetSortedByMaxMinYearSalaryDiff = {
  department: Department;
  minYearSalary: number;
  maxYearSalary: number;
  maxMinYearSalaryDiff: number;
}[];

export interface IDepartmentsGateway {
  getSortedByMaxMinYearSalaryDiff(): Promise<GetSortedByMaxMinYearSalaryDiff>;
}

export const IDepartmentsGateway = Symbol('IDepartmentsGateway');
