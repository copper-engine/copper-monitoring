export class ConnectionSettings {
    // Default values. Actual values will be fetched by first call to JMX
    public engineMBean: string = 'copper.engine:name=persistent.engine';
    public wfRepoMBean: string = 'copper.workflowrepo:name=wfRepository';
    
    constructor(
        public host: string = 'localhost', 
        public port: string = '1099', 
        // fetchPeriod is in minutes
        public fetchPeriod: number = 5, 
        // updatePeriod is in seconds
        public updatePeriod: number = 10) {
    }

    setEngineMBean(name: string) {
        this.engineMBean = 'copper.engine:' + name; 
    }
    setwfRepoMBean(name: string) {
        this.wfRepoMBean = 'copper.workflowrepo:' + name; 
    }
}