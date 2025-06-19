import { Module } from '@nestjs/common';
import { ProcessorService } from './processor.service';
import { AGMMRCalculator } from './core/calculator';

@Module({
  imports: [],
  providers: [AGMMRCalculator, ProcessorService],
  exports: [ProcessorService],
  controllers: [],
})
export class ProcessorModule {}
