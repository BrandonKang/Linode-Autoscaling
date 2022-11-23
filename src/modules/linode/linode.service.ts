import { forwardRef, Inject, Injectable } from "@nestjs/common"
import { delay } from "src/common/helper"
import { ILinode } from "src/models/linode/node"
import { INodeIpAddress } from "src/models/linode/node.ip"
import { LinodeAPIClient } from "src/modules/linode/api.linode.client"

@Injectable()
export class LinodeService {
    constructor(
        @Inject(forwardRef(() => LinodeAPIClient))
        private readonly apiClient: LinodeAPIClient
    ) { }

    public list = async (): Promise<ILinode[]> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'get',
            url: "linode/instances"
        })

        if (error) {
            console.log(`[LinodeService] get node list has error: `, error)
            return []
        }

        if (!data || !data.data || data.data.length === 0) {
            console.log('[LinodeService] get node list has empty data')
            return []
        }

        return data.data
    }

    public stats = async (linodeId: number) => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'get',
            url: `linode/instances/${linodeId}/stats`
        })

        if (error) {
            console.log(`[LinodeService] get stats for ${linodeId} has error: `, JSON.stringify(error))
            return {}
        }

        if (!data || !data.data || data.data.length === 0) {
            console.log(`[LinodeService] get stats for ${linodeId} has empty data`)
            return {}
        }

        return data.data
    }

    public create = async (
        node: ILinode
    ): Promise<ILinode> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'post',
            url: `linode/instances`,
            data: {
                image: "private/17947262",
                root_pass: "vinsmart",
                booted: true,
                private_ip: true,
                region: node.region,
                type: node.type,
                label: `autoscale_node_clone_${node.id}_${(new Date()).getTime()}`,
                group: node.group,
                backups_enabled: false
            }
        })

        if (error) {
            console.log(`[LinodeService] create node instance has error: `, JSON.stringify(error))
            return null
        }

        console.log(`[LinodeService] Waiting for 2 minues for creating node: ${data.id}`)
        await delay(2 * 60 * 1000)

        //Checking status and waiting for clone and boot completed
        let tryCount = 0
        while (tryCount < 30) {
            const clone = await this.view(data.id)
            if (!clone) { return data }
            if (clone.status !== 'running') {
                console.log(`[LinodeService] Created node ${data.id} still offline -> delay 15s and check again`)
                await delay(15 * 1000) // delay 15s
            } else {
                console.log(`[LinodeService] Created node ${data.id} already booted -> finish checking status`)
                break
            }
            tryCount = tryCount + 1
        }

        return await this.view(data.id)
    }

    public clone = async (
        node: ILinode
    ): Promise<ILinode> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'post',
            url: `linode/instances/${node.id}/clone`,
            data: {
                region: node.region,
                type: node.type,
                label: `autoscale_node_clone_${node.id}_${(new Date()).getTime()}`,
                group: node.group,
                backups_enabled: false
            }
        })

        if (error) {
            console.log(`[LinodeService] clone node instance has error: `, JSON.stringify(error))
            return null
        }

        console.log(`[LinodeService] Waiting for 2 minues for clone node: ${data.id}`)
        await delay(2 * 60 * 1000)

        console.log(`[LinodeService] Boot clone node: ${data.id}`)
        const booted = await this.boot(data.id)
        if (!booted) {
            console.log(`[LinodeService] Boot clone node: ${data.id} has error`)
            return data
        } else {
            console.log(`[LinodeService] Booted clone node: ${data.id}`)
        }

        //Checking status and waiting for clone and boot completed
        let tryCount = 0
        while (tryCount < 30) {
            const clone = await this.view(data.id)
            if (!clone) { return data }
            if (clone.status !== 'running') {
                console.log(`[LinodeService] Cloned node ${data.id} still offline -> delay 15s and check again`)
                await delay(15 * 1000) // delay 15s
            } else {
                console.log(`[LinodeService] Cloned node ${data.id} already booted -> finish checking status`)
                break
            }
            tryCount = tryCount + 1
        }

        const ipAddress = await this.allocatePrivateIp(data.id)
        if (!ipAddress) {
            console.log('[LinodeService] Allocate private IP for clone node has error')
            return data
        } else {
            console.log('[LinodeService] Private IP allocated for clone node: ', ipAddress.address)
        }

        return await this.view(data.id)
    }

    public view = async (
        linodeId: number
    ): Promise<ILinode> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'get',
            url: `linode/instances/${linodeId}`
        })

        if (error) {
            console.log(`[LinodeService] get view for ${linodeId} has error: `, JSON.stringify(error))
            return null
        }

        return data
    }

    public allocatePrivateIp = async (
        linodeId: number
    ): Promise<INodeIpAddress> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'post',
            url: `linode/instances/${linodeId}/ips`,
            data: {
                public: false,
                type: 'ipv4'
            }
        })

        if (error) {
            console.log(`[LinodeService] allocate private IP for node instance has error: `, error)
            return null
        }

        console.log(`[LinodeService] Allocated private IP node instance ${linodeId}`)
        return data
    }

    public boot = async (
        linodeId: number
    ): Promise<boolean> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'post',
            url: `linode/instances/${linodeId}/boot`
        })

        if (error) {
            console.log(`[LinodeService] Boot node instance has error: `, JSON.stringify(error))
            return false
        }

        console.log(`[LinodeService] Booted node instance ${linodeId}`)
        return true
    }

    public reboot = async (
        linodeId: number
    ): Promise<boolean> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'post',
            url: `linode/instances/${linodeId}/reboot`
        })

        if (error) {
            console.log(`[LinodeService] Reboot node instance has error: `, JSON.stringify(error))
            return false
        }

        console.log(`[LinodeService] Reboot node instance ${linodeId}`)
        return true
    }

    public shutdown = async (
        linodeId: number
    ): Promise<boolean> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'post',
            url: `linode/instances/${linodeId}/shutdown`
        })

        if (error) {
            console.log(`[LinodeService] Shutdown node instance has error: `, JSON.stringify(error))
            return false
        }

        console.log(`[LinodeService] Shutdown node instance ${linodeId}`)
        return true
    }

    public delete = async (
        linodeId: number
    ): Promise<boolean> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'delete',
            url: `linode/instances/${linodeId}`
        })

        if (error) {
            console.log(`[LinodeService] Delete node instance has error: `, JSON.stringify(error))
            return false
        }

        console.log(`[LinodeService] Deleted node instance ${linodeId}`)
        return true
    }
}
