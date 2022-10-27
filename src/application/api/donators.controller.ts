import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetDonators } from '@/domain/use-cases/get-donators';
import { GetDonatorsDto } from './donators.dto';

@Controller('api/v1/donators')
@UsePipes(new ValidationPipe({ transform: true }))
export class DonatorsController {
  public constructor(private getDonators: GetDonators) {}

  @Get()
  public async getAll(@Query() dto: GetDonatorsDto) {
    return this.getDonators
      .setLastMonths(dto.months, dto.date)
      .setMinDonationRatio(dto.ratio)
      .execute();
  }
}
