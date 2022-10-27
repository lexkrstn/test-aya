import { CompositeObject } from './composite-object';
import { ObjectParseHandler } from './object-parse-handler';
import {
  DepartmentRecord,
  DonationRecord,
  EmployeeRecord,
  RateRecord,
  SalaryRecord,
} from './records';

export type EmployeeConsumerFn = (employee: EmployeeRecord) => Promise<void>;
export type RateConsumerFn = (rate: RateRecord) => Promise<void>;

export class RecordParser implements ObjectParseHandler {
  public constructor(
    protected consumeEmployee?: EmployeeConsumerFn,
    protected consumeRate?: RateConsumerFn,
  ) {}

  public async handleObjectParse(
    parent: CompositeObject,
    child: CompositeObject,
  ) {
    switch (child.name) {
      case 'Employee':
        if (this.consumeEmployee) {
          await this.consumeEmployee(this.parseEmployee(child));
        }
        break;
      case 'Rate':
        if (this.consumeRate) {
          await this.consumeRate(this.parseRate(child));
        }
        break;
      case 'Department':
      case 'Salary':
      case 'Donation':
      case 'Statement':
        // Add the child to its parent so as not to loose it.
        // We'll parse it further as a compound part of its aggregator.
        parent.children.push(child);
        break;
      default:
      // do nothing
    }
  }

  protected parseEmployee(object: CompositeObject) {
    const employee: EmployeeRecord = {
      id: parseInt(object.attributes.get('id'), 10),
      name: object.attributes.get('name'),
      surname: object.attributes.get('surname'),
      donations: [],
      salaries: [],
      department: null,
    };
    for (const child of object.children) {
      if (child.name === 'Department') {
        employee.department = this.parseDepartment(child);
      } else if (child.name === 'Salary') {
        employee.salaries = this.parseSalaries(child);
      } else if (child.name === 'Donation') {
        employee.donations.push(this.parseDonation(child));
      }
    }
    return employee;
  }

  protected parseDepartment(object: CompositeObject) {
    const id = parseInt(object.attributes.get('id'), 10);
    const department: DepartmentRecord = {
      id: id,
      name: object.attributes.get('name'),
    };
    return department;
  }

  protected parseDonation(object: CompositeObject) {
    const amount = object.attributes.get('amount').split(/\s+/);
    if (amount.length != 2) {
      throw new Error('Donation has malformed amount field');
    }
    const donation: DonationRecord = {
      id: parseInt(object.attributes.get('id'), 10),
      date: this.parseDate(object.attributes.get('date')),
      amount: parseFloat(amount[0]),
      sign: amount[1],
    };
    return donation;
  }

  protected parseSalaries(parent: CompositeObject) {
    return parent.children.map((object) => {
      if (object.name !== 'Statement') {
        throw new Error('Salary must contain only Statement objects');
      }
      const salary: SalaryRecord = {
        id: parseInt(object.attributes.get('id'), 10),
        date: this.parseDate(object.attributes.get('date')),
        amount: parseFloat(object.attributes.get('amount')),
      };
      return salary;
    });
  }

  protected parseRate(object: CompositeObject) {
    const rate: RateRecord = {
      date: this.parseDate(object.attributes.get('date')),
      sign: object.attributes.get('sign'),
      value: parseFloat(object.attributes.get('value')),
    };
    if (!rate.date || !rate.sign || isNaN(rate.value)) {
      throw new Error('Invalid rate format');
    }
    return rate;
  }

  protected parseDate(str: string) {
    return new Date(str);
  }
}
