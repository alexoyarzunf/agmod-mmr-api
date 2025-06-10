import { Module } from '@nestjs/common';
import { ProcessorService } from './processor.service';
import { ProcessorController } from './processor.controller';

@Module({
  imports: [],
  providers: [ProcessorService],
  exports: [ProcessorService],
  controllers: [ProcessorController],
})
export class ProcessorModule {}
