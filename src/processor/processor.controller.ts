import { Controller, Post } from '@nestjs/common';
import { ProcessorService } from './processor.service';
import { ProcessMatchesResponseDto } from './dto/process-matches.dto';

@Controller('processor')
export class ProcessorController {
  constructor(private readonly processorService: ProcessorService) {}

  /*@Post('process-all-matches')
  async processAllMatches(): Promise<ProcessMatchesResponseDto> {
    return await this.processorService.processAllMatches();
  }*/
}
