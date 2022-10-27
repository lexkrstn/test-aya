import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Bonus } from './bonus';
import { Department } from './Department';
import { Donation } from './Donation';
import { Salary } from './Salary';

@Entity()
export class Employee {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  surname: string;

  @ManyToOne(() => Department, (department) => department.employees)
  department: Department;

  @Column({ nullable: false })
  departmentId: number;

  @OneToMany(() => Salary, (salary) => salary.employee)
  salaries: Salary[];

  @OneToMany(() => Donation, (donation) => donation.employee)
  donations: Donation[];

  @OneToMany(() => Bonus, (bonus) => bonus.employee)
  bonuses: Bonus[];
}
