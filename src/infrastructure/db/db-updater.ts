import { Repository } from 'typeorm';
import { Employee } from '@/domain/entities/Employee';
import { Department } from '@/domain/entities/Department';
import { Donation } from '@/domain/entities/Donation';
import { Salary } from '@/domain/entities/Salary';
import { RecordParser } from '@/infrastructure/object-file/record-parser';
import { ObjectFileParser } from '@/infrastructure/object-file/object-file-parser';
import {
  EmployeeRecord,
  RateRecord,
} from '@/infrastructure/object-file/records';

interface UnprocessedDonation {
  entity: Donation;
  sign: string;
}

export class DbUpdater {
  /**
   * The tables whose sequence must be recalculated after db updating is done.
   */
  private seqTables: string[] = [];
  /**
   * A donation is added here if there is no suitable rate loaded yet when
   * the donation record comes.
   */
  private unprocessedDonations: UnprocessedDonation[] = [];
  /**
   * Loaded rates. Partially, not all at a time.
   */
  private rates: RateRecord[] = [];

  public constructor(
    private employeeRepo: Repository<Employee>,
    private departmentRepo: Repository<Department>,
    private donationRepo: Repository<Donation>,
    private salaryRepo: Repository<Salary>,
  ) {
    this.seqTables = [
      this.departmentRepo.metadata.tableName,
      this.employeeRepo.metadata.tableName,
      this.donationRepo.metadata.tableName,
      this.salaryRepo.metadata.tableName,
    ];
  }

  public async updateFromFile(filePath: string) {
    const recordParser = new RecordParser(
      this.consumeEmployee.bind(this),
      this.consumeRate.bind(this),
    );
    await ObjectFileParser.fromPath(filePath, recordParser).parse();

    await this.updateSequences();

    if (this.unprocessedDonations.length > 0) {
      const {
        entity: { date },
        sign,
      } = this.unprocessedDonations[0];
      throw new Error(`No conversion rate for ${sign} on ${date}`);
    }
  }

  private consumeEmployee = async (employeeRec: EmployeeRecord) => {
    await this.departmentRepo.upsert(employeeRec.department, ['id']);

    await this.employeeRepo.upsert(employeeRec, ['id']);
    const employeeEnt = await this.employeeRepo.findOneBy({
      id: employeeRec.id,
    });

    const salaryEnts = employeeRec.salaries.map((salaryRec) => {
      const salaryEnt = this.salaryRepo.create(salaryRec);
      salaryEnt.employee = employeeEnt;
      return salaryEnt;
    });
    await this.salaryRepo.upsert(salaryEnts, ['id']);

    this.unprocessedDonations = [
      ...this.unprocessedDonations,
      ...employeeRec.donations.map((d) => {
        const entity = this.donationRepo.create(d);
        entity.employee = employeeEnt;
        return {
          entity,
          sign: d.sign,
        };
      }),
    ];

    await this.processDonationsHavingRates();
  };

  private async processDonationsHavingRates() {
    const bundles = this.unprocessedDonations.map((d) => ({
      donation: d,
      rate: this.rates.find(
        (r) =>
          r.date.getTime() === d.entity.date.getTime() && r.sign === d.sign,
      ),
    }));

    const donations = bundles
      .filter(({ donation, rate }) => donation.sign === 'USD' || !!rate)
      .map(({ donation, rate }) => {
        if (rate) {
          donation.entity.amount *= rate.value;
        }
        return donation.entity;
      });
    if (donations.length > 0) {
      this.unprocessedDonations = bundles
        .filter(({ donation, rate }) => donation.sign !== 'USD' && !rate)
        .map(({ donation }) => donation);

      await this.donationRepo.upsert(donations, ['id']);
    }
  }

  private consumeRate = (rate: RateRecord) => {
    this.rates.push(rate);
    return this.processDonationsHavingRates();
  };

  private updateSequences() {
    const promises: Promise<void>[] = [];
    for (const table of this.seqTables) {
      promises.push(
        this.departmentRepo.query(`SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        COALESCE((SELECT MAX(id) FROM ${table}), 1)
      );`),
      );
    }
    return Promise.all(promises);
  }
}
