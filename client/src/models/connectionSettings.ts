export class ConnectionSettings {
    
    constructor(
        public host: string = 'localhost', 
        public port: string = '1099', 
        // fetchPeriod is in minutes
        public fetchPeriod: number = 5, 
        // updatePeriod is in seconds
        public updatePeriod: number = 10) {
    }
}