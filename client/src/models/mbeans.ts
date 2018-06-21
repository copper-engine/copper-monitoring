import { ConnectionSettings } from './connectionSettings';


export class MBean {
    constructor(public name: string, public atts: string[], public connectionSettings: ConnectionSettings) {

    } 
}