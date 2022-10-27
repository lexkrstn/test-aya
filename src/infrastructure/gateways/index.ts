import { IAccountingGateway } from '@/domain/interfaces/accounting.gateway';
import { IDepartmentsGateway } from '@/domain/interfaces/departments.gateway';
import { IEmployeesGateway } from '@/domain/interfaces/employees.gateway';
import { AccountingGateway } from './accounting.gateway';
import { DepartmentsGateway } from './departments.gateway';
import { EmployeesGateway } from './employees.gateway';

export const PROVIDERS = [
  {
    provide: IAccountingGateway,
    useClass: AccountingGateway,
  },
  {
    provide: IDepartmentsGateway,
    useClass: DepartmentsGateway,
  },
  {
    provide: IEmployeesGateway,
    useClass: EmployeesGateway,
  },
];
