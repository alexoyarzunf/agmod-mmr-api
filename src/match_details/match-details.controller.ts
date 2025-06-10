import { Body, Controller, Post } from '@nestjs/common';
import { MatchDetailsService } from './match-details.service';
import {
  CreateMatchDetailDto,
  MatchDetailResponseDto,
} from './dto/create-match-detail.dto';

@Controller('match-details')
export class MatchDetailsController {
  constructor(private readonly matchDetailsService: MatchDetailsService) {}

  @Post()
  async createMatchDetails(
    @Body() createMatchDetailsDto: CreateMatchDetailDto[],
  ): Promise<MatchDetailResponseDto> {
    return await this.matchDetailsService.createMatchDetails(
      createMatchDetailsDto,
    );
  }

  @Post('reprocess-all')
  async reprocessMatchDetails(): Promise<MatchDetailResponseDto> {
    return await this.matchDetailsService.reprocessMatchDetails();
  }
}
