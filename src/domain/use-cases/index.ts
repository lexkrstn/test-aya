import { GetDepartments } from './get-departments';
import { GetDonatorCompensations } from './get-donator-compensations';
import { GetDonators } from './get-donators';
import { RewardMostDonatedDepartment } from './reward-most-donated-department';

export const PROVIDERS = [
  GetDepartments,
  GetDonatorCompensations,
  GetDonators,
  RewardMostDonatedDepartment,
];
