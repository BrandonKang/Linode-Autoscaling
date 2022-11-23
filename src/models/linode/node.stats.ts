export interface INodeIOStats {
    io: number[][]
    swap: number[][]
}

export interface INodeNetStats {
    in: number[][]
    out: number[][]
    private_in: number[][]
    private_out: number[][]
}

export interface INodeStats {
    io: INodeIOStats
    netv6: INodeNetStats
    netv4: INodeNetStats
    cpu: number[][]
}