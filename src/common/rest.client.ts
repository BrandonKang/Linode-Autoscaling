import { HttpService } from "@nestjs/axios"
import { Inject, forwardRef } from "@nestjs/common"
import * as Qs from 'query-string'
import { IError } from "./base.error"

export class RestClient {
    protected baseUrl: string = ''
    protected token: string = ''

    constructor(
        @Inject(forwardRef(() => HttpService))
        protected readonly httpService: HttpService
    ) {
        this.httpService.axiosRef.interceptors.request.use(
            (config) => {
                return config
            },
            (error) => {
                Promise.reject(error)
            }
        )

        this.httpService.axiosRef.interceptors.response.use(
            (response) => {
                return response
            },
            (error) => {
                return Promise.reject(error)
            }
        )
    }

    public instance = (): HttpService => { return this.httpService }

    public send = async (options: Record<string, any>) => {
        return new Promise((resolver, reject) => {
            this.httpService.request({
                baseURL: this.baseUrl,
                ...options,
                headers: {
                    "Access-Control-Allow-Origin": '*',
                    "Access-Control-Allow-Credentials": 'false',
                    ...options.headers,
                    "Authorization": `Bearer ${this.token}`
                }
            }).subscribe({
                next: ((result: any) => {
                    if (result.status != 200) {
                        reject({ code: `${result.status}`, message: result.statusText })
                        return
                    }

                    if (result.status != 200) {
                        reject({ code: `${result.status}`, message: result.data })
                        return
                    }
                    resolver(result.data)
                }),
                error: (error => {
                    console.log(`[RestClient] Send request has error: `, JSON.stringify({
                        code: error.code,
                        name: error.name,
                        message: error.message,
                        response: !error.response ? {} : {
                            status: error.response.status,
                            statusText: error.response.statusText,
                            data: error.response.data
                        }
                    }))
                    reject({ code: `${error.response.status}`, message: `${error.response.statusText}` })
                }),
                complete: (() => {

                })
            })
        })
    }

    public sendUrlEncoded = async (options: Record<string, any>) => {
        return new Promise((resolver, reject) => {
            this.httpService.request({
                baseURL: this.baseUrl,
                ...options,
                data: options.data ? Qs.stringify(options.data) : {},
                headers: {
                    "Access-Control-Allow-Origin": '*',
                    "Access-Control-Allow-Credentials": 'false',
                    ...options.headers,
                    "Authorization": `Bearer ${this.token}`
                }
            }).subscribe({
                next: ((result: any) => {
                    if (result.status != 200) {
                        reject({ code: `${result.status}`, message: result.statusText })
                        return
                    }

                    if (result.status != 200) {
                        reject({ code: `${result.status}`, message: result.data })
                        return
                    }
                    resolver(result.data)
                }),
                error: (error => {
                    reject({ code: `${error.response.status}`, message: `${error.response.statusText}` })
                }),
                complete: (() => {

                })
            })
        })
    }

    public sendRequest = async (
        options: Record<string, any>
    ): Promise<{ data: any | null, error: IError | null }> => {
        try {
            return { data: await this.send(options), error: null }
        } catch (error) {
            return { data: null, error: error }
        }
    }

    public sendUrlEncodedRequest = async (
        options: Record<string, any>
    ): Promise<{ data: any | null, error: IError | null }> => {
        try {
            return { data: await this.sendUrlEncoded(options), error: null }
        } catch (error) {
            return { data: null, error: error }
        }
    }
}
