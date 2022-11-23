import { INodeAlert } from "./node.alert"
import { INodeBackup } from "./node.backups"
import { INodeSpecs } from "./node.specs"
import { INodeStats } from "./node.stats"

export interface ILinode {
    id: number
    address: string
    label: string
    status: string
    weight: number
    mode: string
    nodebalancer_id: number
    config_id: number
    config_node_id: number
    group: string
    created: string
    updated: string
    type: string
    ipv4: string[]
    ipv6: string
    image: string
    region: string
    specs: INodeSpecs
    alerts: INodeAlert
    backups: INodeBackup
    hypervisor: string
    watchdog_enabled: boolean
    tags: string[]
    host_uuid: string
    stats: INodeStats
}