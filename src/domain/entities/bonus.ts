import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Employee } from './Employee';

@Entity()
export class Bonus {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column('money')
  amount: number;

  @Column('date')
  date: Date;

  @ManyToOne(() => Employee, (employee) => employee.salaries)
  employee: Employee;

  @Column({ nullable: false })
  employeeId: number;
}
