
export class MBeans {
    // Values will be fetched by first call to JMX
    public engineMBean: string;
    public wfRepoMBean: string;

    constructor(engineMBean: string, wfRepoMBean: string) {
        this.setEngineMBean(engineMBean);
        this.setWfRepoMBean(wfRepoMBean);
    }

    setEngineMBean(name: string) {
        this.engineMBean = 'copper.engine:' + name; 
    }
    setWfRepoMBean(name: string) {
        this.wfRepoMBean = 'copper.workflowrepo:' + name; 
    }
}