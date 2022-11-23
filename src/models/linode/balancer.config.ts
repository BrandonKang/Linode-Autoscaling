import { ILinode } from "./node"

export interface IConfigStatus {
    up: number
    down: number
}

export interface IBalancerConfig {
    id: number
    port: number
    protocol: string
    algorithm: string
    stickiness: string
    check: string
    check_interval: number
    check_timeout: number
    check_attempts: number
    check_path: string
    check_body: string
    check_passive: true,
    proxy_protocol: string
    cipher_suite: string
    nodebalancer_id: number
    ssl_commonname: string
    ssl_fingerprint: string
    ssl_cert: string
    ssl_key: string
    nodes_status: IConfigStatus
    nodes: ILinode[]
}