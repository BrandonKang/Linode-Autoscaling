import { forwardRef, Module } from "@nestjs/common"
import { LinodeModule } from "../linode/linode.module";
import { ScaleController } from "./scale.controller";
import { ScaleService } from "./scale.service";

@Module({
    imports: [
        forwardRef(() => LinodeModule),
    ],
    providers: [
        ScaleController,
        ScaleService
    ],
    exports: [
        ScaleService
    ]
})
export class ScaleModule { }
