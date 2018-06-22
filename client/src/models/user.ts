import * as utils from '../util/utils';
export class UserSettings {
    constructor(
        public defaultHost: string = 'localhost', 
        public defaultPort: string = '1099', 
        public defaultJmxUsername: string = null, 
        public defaultJmxPass: string = null, 
        public updatePeriod: number = 10, 
        public darkTheme: boolean = true) {}
}

export class InfluxConnection {
    constructor(
        public url: string,
        public username: string,
        public password: string,
        public useInfluxDB: boolean
    ) {}
}

export class ChartSettings {
    constructor(
        public interval: number,
        public layout: string,
    ) {}
}

export class User {
    constructor(public name: string, public password: string, public settings: UserSettings, public influx: InfluxConnection, public chart: ChartSettings ) {
    }
}
