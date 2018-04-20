export class UserSettings {
    constructor(public defaultHost: string = 'localhost', public defaultPort: string = '1099', public updatePeriod: number = 10, public fetchPeriod: number = 5) {
    }
}
export class User {
    constructor(public name: string, public password: string, public settings: UserSettings ) {
    }
}
