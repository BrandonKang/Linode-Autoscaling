import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
  constructor() { }

  @Get('/api/health/check')
  async healthCheck() {
      console.log("Health checking -> still survive")
      return "I'm fine, don't kill me please!"
  }
}