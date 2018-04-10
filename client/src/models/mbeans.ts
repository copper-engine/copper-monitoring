import { ConnectionSettings } from './connectionSettings';


export class MBean {
    constructor(public name: string, public atts: string[], public connectionSettings: ConnectionSettings) {

    } 
}


export class MBeans {
    // Values will be fetched by first call to JMX
    constructor(public engineMBeans: MBean[] = [new MBean('', [], null)]) {
        this.setEngineMBeans(engineMBeans);
    }

    setEngineMBeans(beans: MBean[]) {
        beans.forEach(bean => bean.name = 'copper.engine:' + bean.name);
        this.engineMBeans = beans;
    }
    addEngineMBean(bean: MBean) {
        bean.name = 'copper.engine:' + bean.name;
        this.engineMBeans.push(bean); 
    }
}