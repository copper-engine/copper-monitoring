
export class MBeans {
    // Values will be fetched by first call to JMX
    public engineMBeans: string[];
    public wfRepoMBeans: string[];

    constructor(engineMBeans: string[], wfRepoMBeans: string[]) {
        this.setEngineMBeans(engineMBeans);
        this.setWfRepoMBeans(wfRepoMBeans);
    }

    setEngineMBeans(names: string[]) {
        this.engineMBeans = names.map(name => 'copper.engine:' + name); 
    }
    setWfRepoMBeans(names: string[]) {
        this.wfRepoMBeans = names.map(name => 'copper.workflowrepo:' + name); 
    }
    addEngineMBean(name: string) {
        this.engineMBeans.push('copper.engine:' + name); 
    }
    addWfRepoMBean(name: string) {
        this.wfRepoMBeans.push('copper.workflowrepo:' + name); 
    }
}