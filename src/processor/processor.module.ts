import { Module } from '@nestjs/common';
import { ProcessorService } from './processor.service';

@Module({
  imports: [],
  providers: [ProcessorService],
  exports: [ProcessorService],
  controllers: [],
})
export class ProcessorModule {}
