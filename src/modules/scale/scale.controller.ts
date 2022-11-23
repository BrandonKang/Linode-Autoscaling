import { Controller } from '@nestjs/common'
import { ScaleService } from './scale.service';

@Controller()
export class ScaleController {
  constructor(
    private readonly scaleService: ScaleService
  ) { }

}