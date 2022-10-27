export interface DepartmentRecord {
  id: number;
  name: string;
}

export interface DonationRecord {
  id: number;
  date: Date;
  amount: number;
  sign: string;
}

export interface SalaryRecord {
  id: number;
  amount: number;
  date: Date;
}

export interface EmployeeRecord {
  id: number;
  name: string;
  surname: string;
  department: DepartmentRecord;
  salaries: SalaryRecord[];
  donations: DonationRecord[];
}

export interface RateRecord {
  date: Date;
  sign: string;
  value: number;
}
