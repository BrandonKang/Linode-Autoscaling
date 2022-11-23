import { Controller, Get } from '@nestjs/common'

@Controller()
export class AboutController {
  constructor() { }

  @Get('/api/about')
  async about() {
      return "I am linode autoscale service"
  }
}