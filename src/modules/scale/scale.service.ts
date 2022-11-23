import { forwardRef, Inject, Injectable } from "@nestjs/common"
import { LinodeService } from "../linode/linode.service"
import { Cron } from '@nestjs/schedule'
import { LinodeBalancerService } from "../linode/balancer.service"
import { IBalancer } from "src/models/linode/balancer"
import { IBalancerConfig } from "src/models/linode/balancer.config"
import { delay } from "src/common/helper"

const STATUS_CHECKING_TIME_INTERVAL = `${process.env.STATUS_CHECKING_TIME_INTERVAL || '5 * * * * *'}`
const SCALE_UP_CPU_PERCENTAGE = Number(process.env.SCALE_UP_CPU_PERCENTAGE || 75)
const SCALE_DOWN_CPU_PERCENTAGE = Number(process.env.SCALE_DOWN_CPU_PERCENTAGE || 50)

@Injectable()
export class ScaleService {
    private scaleIsRunning = false
    constructor(
        @Inject(forwardRef(() => LinodeBalancerService))
        private readonly balancerService: LinodeBalancerService,

        @Inject(forwardRef(() => LinodeService))
        private readonly linodeService: LinodeService
    ) {
        console.log(`[ScaleService] Initial with configuration: ${JSON.stringify({
            STATUS_CHECKING_TIME_INTERVAL: process.env.STATUS_CHECKING_TIME_INTERVAL,
            SCALE_UP_CPU_PERCENTAGE: process.env.SCALE_UP_CPU_PERCENTAGE,
            SCALE_DOWN_CPU_PERCENTAGE: process.env.SCALE_DOWN_CPU_PERCENTAGE
        })}`)
    }

    @Cron(STATUS_CHECKING_TIME_INTERVAL)
    async autoScale() {
        if (!this.scaleIsRunning) {
            const startTime = (new Date()).getTime()
            console.log(`[ScaleService] autoScale start: ${(new Date()).toTimeString()}`)
            this.scaleIsRunning = true

            try {
                const fixedBalancerId = Number(process.env.LINODE_BALANCER_AUTOSCALE_ID || 0)
                console.log(`[ScaleService] Target balancer ID: ${fixedBalancerId === 0 ? 'ALL' : fixedBalancerId}`)
                const balancers = await this.balancerService.list()
                if (balancers.length > 0) {
                    for (const balancer of balancers) {
                        if (fixedBalancerId) {
                            if (balancer.id === fixedBalancerId) {
                                await this.scaleAnalyze(balancer)
                            } else {
                                console.log(`[ScaleService] Skip non-target balancer: ${balancer.label} - ${balancer.id}`)
                            }
                        } else {
                            await this.scaleAnalyze(balancer)
                        }
                    }
                }
            } catch (error) {
                console.log('[ScaleService] autoScale has exception: ', error)
            }

            this.scaleIsRunning = false
            console.log(`[ScaleService] autoScale end: ${(new Date()).toTimeString()} - ${(new Date()).getTime() - startTime} (ms)`)
        } else {
            console.log('[ScaleService] Previous autoScale turn has not completed -> skip this turn')
        }
    }

    async scaleAnalyze(balancer: IBalancer) {
        console.log(`[ScaleService] scaleAnalyze for balancer: ${balancer.label} - ${balancer.id}`)
        if (balancer.configs && balancer.configs.length > 0) {
            for (const config of balancer.configs) {
                await this.scaleConfigAnalyze(balancer, config)
            }
        }
    }

    async scaleConfigAnalyze(balancer: IBalancer, config: IBalancerConfig) {
        console.log(`[ScaleService] scaleConfigAnalyze for ${balancer.label} - ${balancer.id} - ${config.id}`)
        let cpuAverage = 0
        let isSkip = false
        for (const node of config.nodes) {
            if (node.status === 'UP') {
                node.stats = await this.linodeService.stats(node.id)
                if (!node.stats || !node.stats.cpu) {
                    isSkip = true
                    console.log(`[ScaleService] Skip scale for ${balancer.id} - ${config.id}: get stats failed -> ${node.id}`)
                    break
                }

                const lastCPU = node.stats.cpu.sort((a, b) => { return a[0] <= b[0] ? 1 : 0 })[node.stats.cpu.length - 1]
                console.log(`[ScaleService] CPU of ${balancer.id} - ${config.id} - ${node.id} : ${lastCPU[1]} %`)
                cpuAverage = cpuAverage === 0 ? lastCPU[1] : (cpuAverage + lastCPU[1]) / 2
            }
        }

        if (isSkip) { return }

        console.log(`[ScaleService] CPU everage of ${balancer.id} - ${config.id}: ${cpuAverage} %`)
        if (cpuAverage > SCALE_UP_CPU_PERCENTAGE) {
            await this.scaleUp(balancer, config)
        } else if (cpuAverage < SCALE_DOWN_CPU_PERCENTAGE) {
            await this.scaleDown(balancer, config)
        } else {
            console.log(`[ScaleService] Skip scale for ${balancer.label} - ${balancer.id} - ${config.id}`)
        }
    }

    async scaleUp(balancer: IBalancer, config: IBalancerConfig) {
        console.log(`[ScaleService] scaleUp for ${balancer.label} - ${config.id} ==> START`)
        //Clone a node instance
        // const cloneNode = await this.linodeService.clone(config.nodes[0])

        const cloneNode = await this.linodeService.create(config.nodes[0])
        if (!cloneNode) {
            console.log('[ScaleService] Clone node instance hase error')
        } else {
            const nodeIP = cloneNode.ipv4[1]
            if (!nodeIP) {
                console.log(`[ScaleService] Clone node private IP not found: `, cloneNode.ipv4)
            } else {
                const addedNode = await this.balancerService.addNode(balancer, config, nodeIP)
                if (!addedNode) {
                    console.log(`[ScaleService] Add node to balancer ${balancer.label} - ${balancer.id} has error: `, nodeIP)
                } else {
                    console.log(`[ScaleService] Add node to balancer ${balancer.label} - ${balancer.id} success: `, nodeIP)

                    //Checking UP status of new node (waiting for maximum 5 minutes - 30 loops 10s)
                    let tryCount = 0
                    while (tryCount < 30) {
                        const nodeList = await this.balancerService.getNodes(balancer.id, config.id)
                        const target = nodeList.find(node => {
                            if (node.ipv4) {
                                for (const ip of node.ipv4) {
                                    if (ip.startsWith(nodeIP)) return true
                                }
                            }
                            return false
                        })

                        console.log(`[ScaleService] Found cloned node in balancer ${balancer.label} and status is ${target.status}`)
                        if (target && target.status === 'UP') break

                        //Waiting for 10 seconds for next times
                        await delay(10 * 1000)

                        tryCount = tryCount + 1
                    }
                }
            }
        }

        console.log(`[ScaleService] scaleUp for ${balancer.label} - ${config.id} ==> END`)
    }

    async scaleDown(balancer: IBalancer, config: IBalancerConfig) {
        console.log(`[ScaleService] scaleDown for ${balancer.label} - ${config.id} ==> START`)
        let totalCPU = 0
        let minCPU = 100
        let minCPUNode = config.nodes.find(node => node.label.startsWith('autoscale_node_'))
        const upNodeCnt = config.nodes.reduce((prev: number, current) => {
            if (current.status === 'UP' && current.stats.cpu) {
                const lastCPU = current.stats.cpu[current.stats.cpu.length - 1]
                if (lastCPU[1] < minCPU) {
                    minCPU = lastCPU[1]
                    //Only remove autoscale cloned node
                    if (!minCPUNode || current.label.startsWith('autoscale_node_')) {
                        minCPUNode = current
                    }
                }
                totalCPU = totalCPU + lastCPU[1]
                return (prev + 1)
            }
            return prev
        }, 0)

        if (upNodeCnt < 2) {
            console.log(`[ScaleService] No need scale: has only one VM`)
        } else {
            //Caculate CPU after remove smallest CPU node
            const resultCPU = totalCPU / (upNodeCnt - 1)
            if (resultCPU > SCALE_UP_CPU_PERCENTAGE) {
                console.log(`[ScaleService] No need scale down: result CPU will higher than SCALE_UP_CPU_PERCENTAGE`)
            } else {
                //Remove node from balancer config
                await this.balancerService.removeNode(balancer.id, config.id, minCPUNode.config_node_id)
                console.log(`[ScaleService] scaleDown removed node ${minCPUNode.label} from balancer ${balancer.label} - ${balancer.id}`)

                //Remove node instance
                await this.linodeService.delete(minCPUNode.id)
                console.log(`[ScaleService] scaleDown removed node instance ${minCPUNode.label} - ${minCPUNode.address}`)
            }
        }

        console.log(`[ScaleService] scaleDown for ${balancer.label} - ${balancer.id} - ${config.id} ==> END`)
    }
}