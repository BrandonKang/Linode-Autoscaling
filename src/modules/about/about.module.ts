import { Module } from '@nestjs/common'
import { AboutController } from './about.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [
  ],
  controllers: [
    AboutController,
    HealthController
  ],
  providers: [
    
  ],
})
export class AboutModule {}
