import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Employee } from './Employee';

@Entity()
export class Donation {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column('date')
  date: Date;

  @Column('money')
  amount: number;

  @ManyToOne(() => Employee, (employee) => employee.donations)
  employee: Employee;

  @Column({ nullable: false })
  employeeId: number;
}
