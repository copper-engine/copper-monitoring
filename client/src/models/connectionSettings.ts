// fetchPeriod is in minutes
// updatePeriod is in seconds
export class ConnectionSettings {

    constructor(public host: string = 'localhost', public port: string = '1099', public fetchPeriod: number = 5, public updatePeriod: number = 10) {
    }
}