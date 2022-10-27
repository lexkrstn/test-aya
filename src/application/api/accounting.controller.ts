import {
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetDonatorCompensations } from '@/domain/use-cases/get-donator-compensations';
import { RewardMostDonatedDepartment } from '@/domain/use-cases/reward-most-donated-department';
import { GetCompensationsDto, RewardDepartmentDto } from './accounting.dto';

@Controller('api/v1')
@UsePipes(new ValidationPipe({ transform: true }))
export class AccountingController {
  public constructor(
    private getDonatorCompensatins: GetDonatorCompensations,
    private rewardMostDonatedDepartment: RewardMostDonatedDepartment,
  ) {}

  @Get('donator-compensations')
  public async getDonatorCompensations(@Query() dto: GetCompensationsDto) {
    return this.getDonatorCompensatins
      .setDateRange(dto.from, dto.to)
      .setCompensationPool(dto.pool)
      .setMinimumDonationSum(dto.minSum)
      .execute();
  }

  @Post('department-rewards')
  public async rewardDepartment(@Query() dto: RewardDepartmentDto) {
    return this.rewardMostDonatedDepartment
      .setDateRange(dto.from, dto.to)
      .setRewardAmount(dto.amount)
      .execute();
  }
}
