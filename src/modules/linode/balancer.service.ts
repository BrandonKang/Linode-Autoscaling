import { forwardRef, Inject, Injectable } from "@nestjs/common"
import { IBalancer } from "src/models/linode/balancer"
import { IBalancerConfig } from "src/models/linode/balancer.config"
import { ILinode } from "src/models/linode/node"
import { LinodeAPIClient } from "src/modules/linode/api.linode.client"
import { LinodeService } from "./linode.service"

@Injectable()
export class LinodeBalancerService {
    constructor(
        @Inject(forwardRef(() => LinodeAPIClient))
        private readonly apiClient: LinodeAPIClient,

        @Inject(forwardRef(() => LinodeService))
        private readonly nodeService: LinodeService
    ) { }

    public getConfigs = async (
        balancerId: number
    ): Promise<IBalancerConfig[]> => {
        console.log(`[LinodeBalancerService] get config for ${balancerId}`)
        const { data, error } = await this.apiClient.sendRequest({
            method: 'get',
            url: `nodebalancers/${balancerId}/configs`
        })

        if (error) {
            console.log(`[LinodeBalancerService] get balancer configs has error: `, JSON.stringify(error))
            return []
        }

        if (!data || !data.data || data.data.length === 0) {
            console.log('[LinodeBalancerService] get balancer configs has empty data')
            return []
        }

        const configs = data.data
        for (const config of configs) {
            config.nodes = await this.getNodes(balancerId, config.id)
        }

        return configs
    }

    public getNodes = async (
        balancerId: number,
        configId: number
    ): Promise<ILinode[]> => {
        console.log(`[LinodeBalancerService] get nodes for ${balancerId} - ${configId}`)
        const { data, error } = await this.apiClient.sendRequest({
            method: 'get',
            url: `nodebalancers/${balancerId}/configs/${configId}/nodes`
        })

        if (error) {
            console.log(`[LinodeBalancerService] get nodes of balancer config has error: `, JSON.stringify(error))
            return []
        }

        if (!data || !data.data || data.data.length === 0) {
            console.log('[LinodeBalancerService] get nodes of balancer config has empty data')
            return []
        }

        const configNodes = data.data
        const userNodes = await this.nodeService.list()
        const nodeIpDict = userNodes.reduce((prev: Record<string, ILinode>, current) => {
            if (current.ipv4) {
                current.ipv4.map(ip => {
                    prev[ip] = current
                })
            }
            return prev
        }, {})

        const result = []
        for (const node of configNodes) {
            if (node.address) {
                const ips = node.address.split(':')
                const existNode = nodeIpDict[ips[0]]
                if (existNode) {
                    existNode.config_node_id = node.id
                    existNode.address = node.address
                    existNode.label = node.label
                    existNode.status = node.status
                    existNode.weight = node.weight
                    existNode.mode = node.mode
                    existNode.config_id = node.config_id
                    existNode.nodebalancer_id = node.nodebalancer_id
                    result.push(existNode)
                }
            }
        }

        return result
    }

    public list = async (): Promise<IBalancer[]> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'get',
            url: "nodebalancers"
        })

        if (error) {
            console.log(`[LinodeBalancerService] get balancer list has error: `, JSON.stringify(error))
            return []
        }

        if (!data || !data.data || data.data.length === 0) {
            console.log('[LinodeBalancerService] get balancer has empty data')
            return []
        }

        const balancers = data.data
        for (const balancer of balancers) {
            balancer.configs = await this.getConfigs(balancer.id)
        }

        return balancers
    }

    public addNode = async (
        balaner: IBalancer,
        config: IBalancerConfig,
        nodeIP: string
    ): Promise<ILinode> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'post',
            url: `nodebalancers/${balaner.id}/configs/${config.id}/nodes`,
            data: {
                address: `${nodeIP}:${config.port}`,
                label: `autoscale_node_${nodeIP}`,
                mode: 'accept',
                weight: 50
            }
        })

        if (error) {
            console.log(`[LinodeBalancerService] addNode has error: `, JSON.stringify(error))
            return null
        }

        return data
    }

    public removeNode = async (
        balancerId: number,
        configId: number,
        nodeId: number
    ): Promise<boolean> => {
        const { data, error } = await this.apiClient.sendRequest({
            method: 'delete',
            url: `nodebalancers/${balancerId}/configs/${configId}/nodes/${nodeId}`
        })

        if (error) {
            console.log(`[LinodeBalancerService] removeNode has error: `, JSON.stringify(error))
            return false
        }

        return true
    }
}
