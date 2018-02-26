export class UserSettings {
    constructor(public defaultHost: string = 'localhost', public defaultPort: string = '1099') {
    }
}
export class User {
    constructor(public name: string, public password: string, public settings: UserSettings ) {
    }
}
