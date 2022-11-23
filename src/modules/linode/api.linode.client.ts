import { HttpService } from "@nestjs/axios"
import { forwardRef, Inject, Injectable } from "@nestjs/common"
import { RestClient } from "src/common/rest.client"

const FIXED_LINODE_PERSONAL_ACCESS_TOKEN = '[REDACTED]'
const FIXED_LINODE_API_BASE_URL = 'https://api.linode.com/v4/'

@Injectable()
export class LinodeAPIClient extends RestClient {
    constructor(
        @Inject(forwardRef(() => HttpService))
        private readonly _httpService: HttpService
    ) {
        super(_httpService)
        this.baseUrl =  process.env.LINODE_API_BASE_URL || FIXED_LINODE_API_BASE_URL
        this.token = process.env.LINODE_PERSONAL_ACCESS_TOKEN || FIXED_LINODE_PERSONAL_ACCESS_TOKEN
    }
}
