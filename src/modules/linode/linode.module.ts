import { HttpModule } from "@nestjs/axios"
import { Module } from "@nestjs/common"
import { LinodeBalancerService } from "./balancer.service"
import { LinodeAPIClient } from "./api.linode.client"
import { LinodeService } from "./linode.service"

@Module({
    imports: [
        HttpModule.register({
            timeout: 30 * 60 * 60 * 1000,
            maxRedirects: 5,
        })
    ],
    providers: [
        LinodeAPIClient,
        LinodeService,
        LinodeBalancerService,
    ],
    exports: [
        LinodeService,
        LinodeBalancerService
    ]
})

export class LinodeModule { }
