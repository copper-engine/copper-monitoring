import { MBean } from './mbeans';

export class ConnectionSettings {
    
    constructor(
        public host: string = 'localhost', 
        public port: string = '1099') {
    }

    toString() {
        return this.host + ':' + this.port;
    }
}
export class ConnectionResult {    
    constructor(public settings: ConnectionSettings, public mbeans: MBean[]) {}

    isConnected() {
        return this.mbeans && this.mbeans.length > 0;
    }
}