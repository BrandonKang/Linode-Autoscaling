import { IBalancerConfig } from "./balancer.config";
import { IBalancerTransfer } from "./balancer.transfer";

export interface IBalancer {
    id: number
    label: string
    region: string
    hostname: string
    ipv4: string
    ipv6: string
    created: string
    updated: string
    client_conn_throttle: number
    tags: string[]
    transfer: IBalancerTransfer
    configs: IBalancerConfig[]
}