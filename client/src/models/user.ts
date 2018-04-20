import * as utils from '../util/utils';
export class UserSettings {
    constructor(
        public defaultHost: string = 'localhost', 
        public defaultPort: string = '1099', 
        public updatePeriod: number, 
        public fetchPeriod: number, 
        public darkTheme: boolean) {}
}
export class User {
    constructor(public name: string, public password: string, public settings: UserSettings ) {
    }
}
