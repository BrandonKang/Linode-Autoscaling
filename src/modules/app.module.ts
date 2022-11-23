import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AboutModule } from './about/about.module'
import { LinodeModule } from './linode/linode.module'
import { ScaleModule } from './scale/scale.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AboutModule,
    LinodeModule,
    ScaleModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
