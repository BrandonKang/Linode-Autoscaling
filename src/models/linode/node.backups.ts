export interface IBackupSchedule {
    day: string
    window: string
}

export interface INodeBackup {
    enabled: boolean
    schedule: IBackupSchedule
    last_successful: string
}