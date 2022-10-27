import * as fs from 'fs/promises';
import * as path from 'path';
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from '@/domain/entities/Employee';
import { Department } from '@/domain/entities/Department';
import { Donation } from '@/domain/entities/Donation';
import { Salary } from '@/domain/entities/Salary';
import { DbUpdater } from '@/infrastructure/db/db-updater';

const PATH = 'data/db';

@Injectable()
export class DbUpdateService {
  private logger = new Logger(DbUpdateService.name);

  public constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
    @InjectRepository(Donation)
    private donationRepo: Repository<Donation>,
    @InjectRepository(Salary)
    private salaryRepo: Repository<Salary>,
  ) {}

  public async updateFromDir(dirPath: string) {
    const promises: Promise<void>[] = [];
    for (const fileName of await fs.readdir(dirPath)) {
      promises.push(this.updateFromFile(path.join(dirPath, fileName)));
    }
    return Promise.all(promises);
  }

  public async updateFromFile(filePath: string) {
    const updater = new DbUpdater(
      this.employeeRepo,
      this.departmentRepo,
      this.donationRepo,
      this.salaryRepo,
    );
    await updater.updateFromFile(filePath);
    this.logger.debug(`Updated db from ${filePath}`);
  }

  public async onApplicationBootstrap() {
    await this.updateFromDir(PATH);
    this.logger.log(`Updated db from ${PATH}`);
    await this.logSizesOfRepos();
  }

  private async logSizesOfRepos() {
    const departmentCount = await this.departmentRepo.count();
    this.logger.log(`\tDepartments: ${departmentCount}`);
    const employeeCount = await this.employeeRepo.count();
    this.logger.log(`\tEmployees: ${employeeCount}`);
    const donationCount = await this.donationRepo.count();
    this.logger.log(`\tDonations: ${donationCount}`);
    const salaryCount = await this.salaryRepo.count();
    this.logger.log(`\tSalaries: ${salaryCount}`);
  }
}
