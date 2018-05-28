import * as utils from '../util/utils';
export class UserSettings {
    constructor(
        public defaultHost: string = 'localhost', 
        public defaultPort: string = '1099', 
        public updatePeriod: number, 
        public darkTheme: boolean) {}
}

export class InfluxConnection {
    constructor(
        public url: string,
        public username: string,
        public password: string,
        public useInfluxDB: boolean
    ) {}
}

export class User {
    constructor(public name: string, public password: string, public settings: UserSettings, public influx: InfluxConnection ) {
    }
}
