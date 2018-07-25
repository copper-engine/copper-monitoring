import { MBean } from './mbeans';

export class ConnectionSettings {
    
    constructor(
        public host: string = 'localhost', 
        public port: string = '1099',
        public username: string = null,
        public password: string = null,
        public passwordSaved: boolean = false) {
    }

    toString() {
        return this.host + ':' + this.port;
    }
}
export class ConnectionResult {    
    constructor(public settings: ConnectionSettings, public mbeans: MBean[], public auditTrailsMBean: MBean[] = null, public error: string = null) {}

    isConnected() {
        return this.mbeans && this.mbeans.length > 0;
    }
}