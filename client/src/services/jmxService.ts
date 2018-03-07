import Axios from 'axios';
// import Vue from 'vue';
import { State, EngineStatus, WorkflowInfo, WorkflowClassInfo, WorkflowRepo } from '../models/engine';
import { ConnectionSettings } from '../models/connectionSettings';
import moment from 'moment';
import { User } from '../models/user';
import { MBeans } from '../models/mbeans';

export class JmxService {
    getEngineStatus(connectionSettings: ConnectionSettings, mbeans: MBeans, user: User) {
        return Axios.post(process.env.API_NAME, [
                this.createEngineInfoRequest(connectionSettings, mbeans), 
                this.createEngineActivityRequest(connectionSettings, mbeans),
                this.createCountBrokenWFRequest(connectionSettings, mbeans)                
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseEngineStatusResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Engine Status:', error);
            });
    }
    getMBeans(connectionSettings: ConnectionSettings, user: User) {
        return Axios.post(process.env.API_NAME, [
                this.createMBeansListRequest(connectionSettings)
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then((response) => {
                if (!response || !response.data
                    || response.data.length < 1
                    || !this.isSubResponseValid(response.data[0])
                ) {
                    console.log('Invalid responce:', response);          
                    throw new Error('invalid response!');
                }
                
                return [Object.keys(response.data[0].value['copper.engine'])[0], Object.keys(response.data[0].value['copper.workflowrepo'])[0]];
            })
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Engine Status:', error);
            });
    }

    // TODO logout if wrong credentials...
    getBrokenWorkflows(connectionSettings: ConnectionSettings, mbeans: MBeans, user: User , max: number = 50, offset: number = 0) {
        return Axios.post(process.env.API_NAME, [
                this.createQueryBrokenWFRequest(connectionSettings, mbeans, max, offset)
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseBrokenWorkflowsResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Broken Workflows:', error);
            });
    }

    getWfRepo(connectionSettings: ConnectionSettings, mbeans: MBeans, user: User) {
        return Axios.post(process.env.API_NAME, [
            this.createWfRepoRequest(connectionSettings, mbeans)
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseWfRepoResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Broken Workflows:', error);
            });
    }

    getSourceCode(connectionSettings: ConnectionSettings, user: User, classname: String) {
        return Axios.post(process.env.API_NAME, [
            this.createSourceCodeRequest(connectionSettings, classname)
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseSourceCodeResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Broken Workflows:', error);
            });
    }

    private createSourceCodeRequest(connectionSettings: ConnectionSettings, classname: String) {
        return {
        type: 'EXEC',
        mbean: 'copper.workflowrepo:name=wfRepository',
        // mbean: 'copper.workflowrepo:name=workflowRepositoryMXBean',
        operation: 'getWorkflowInfo',
        arguments: [classname],
        target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }

    private parseSourceCodeResponse = (response): String => {
        if (!response || !response.data 
            || response.data.length < 1
            || response.data[0].error) {
            console.log('Invalid responce:', response); 
            throw new Error('invalid response!');
        }
        return response.data[0].value.sourceCode;
    }

    restartAll(connectionSettings: ConnectionSettings, mbeans: MBeans, user: User) {
        return Axios.post(process.env.API_NAME, [
                    this.createJmxExecRequest(connectionSettings, mbeans, { operation: 'restartAll()' })
                ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
            });
    }

    deleteAll(connectionSettings: ConnectionSettings, mbeans: MBeans, workflows: WorkflowInfo[], user: User) {
        let requestList = workflows.map((workflow) => {
            return this.createJmxExecRequest(connectionSettings, mbeans, { operation: 'deleteBroken', arguments: [ workflow.id ] });
        });
        
        return Axios.post(process.env.API_NAME, requestList, {
            auth: { username: user.name, password: user.password }
        })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
            });
    }

    restart(connectionSettings: ConnectionSettings, mbeans: MBeans, workflowId: string, user: User) {
        return Axios.post(process.env.API_NAME, 
                [ this.createJmxExecRequest(connectionSettings, mbeans, { operation: 'restart', arguments: [ workflowId ] }) ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
            });
    }

    deleteBroken(connectionSettings: ConnectionSettings, mbeans: MBeans, workflowId: string, user: User) {
        return Axios.post(process.env.API_NAME, 
                [ this.createJmxExecRequest(connectionSettings, mbeans, { operation: 'deleteBroken', arguments: [ workflowId ] }) ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
            });
    }

    private buildRestartAllRequest = (connectionSettings: ConnectionSettings, mbeans: MBeans) => [
        this.createJmxExecRequest(connectionSettings, mbeans, {
            operation: 'restartAll()',
            arguments: [], 
        })
    ]

    private createWfRepoRequest(connectionSettings: ConnectionSettings, mbeans: MBeans) {
        return {
            type: 'read',
            mbean: mbeans.wfRepoMBean,
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }
    private createEngineInfoRequest(connectionSettings: ConnectionSettings, mbeans: MBeans) {
        return {
            type: 'read',
            mbean: mbeans.engineMBean,
            attribute: ['EngineId', 'EngineType', 'State'],
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }

    private createMBeansListRequest(connectionSettings: ConnectionSettings) {
        return {
            type: 'LIST',
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }

    private createQueryBrokenWFRequest(connectionSettings: ConnectionSettings, mbeans: MBeans, max: number, offset: number) {
        return this.createJmxExecRequest(connectionSettings, mbeans, {
            operation: 'queryWorkflowInstances(javax.management.openmbean.CompositeData)',
            arguments: [this.createWorkflowFilter(connectionSettings, [State.ERROR, State.INVALID], max, offset)], // get workflows with status Invalid
        });
    }
    private createCountBrokenWFRequest(connectionSettings: ConnectionSettings, mbeans: MBeans) {
        return this.createJmxExecRequest(connectionSettings, mbeans, {
            operation: 'countWorkflowInstances(javax.management.openmbean.CompositeData)',
            arguments: [this.createWorkflowFilter(connectionSettings, [State.ERROR, State.INVALID])], // get workflows with status Invalid
        });
    }

    private createEngineActivityRequest(connectionSettings: ConnectionSettings, mbeans: MBeans) {
        return this.createJmxExecRequest(connectionSettings, mbeans, {
            operation: 'queryEngineActivity',
            arguments: [connectionSettings.fetchPeriod], // fetch info for last N minutes
        });
    }

    private createWorkflowFilter(connectionSettings: ConnectionSettings, states: State[], max: number = 50, offset: number = 0) {
        let now = new Date().getTime();
        // let fromTime = new Date(now - connectionSettings.fetchPeriod * 60 * 1000).getTime();
        return { 
            'states': states.map((state) => State[state]),
            'lastModTS': { 'from': null, 'to': now}, 
            'creationTS': { 'from': null, 'to': now}, 
            'processorPoolId': null, 
            'workflowClassname': null, 
            'max': max,
            'offset': offset
        };
    }

    private createJmxExecRequest(connectionSettings, mbeans: MBeans, uniquePart: {}) {
        return Object.assign(this.createJmxExecRequstBase(connectionSettings, mbeans), uniquePart);
    }

    private createJmxExecRequstBase(connectionSettings: ConnectionSettings, mbeans: MBeans) {
        return {
            type: 'EXEC',
            mbean: mbeans.engineMBean,
            target: {
                url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi`
            }
        };
    }

    private parseWfRepoResponse = (response) => {
        if (!response || !response.data 
            || response.data.length < 1
            || response.data[0].error) {
            console.log('Invalid responce:', response); 
            throw new Error('invalid response!');
        }
        let wfArray: Array<WorkflowClassInfo> = response.data[0].value.Workflows.map((workflow) => {
            return new WorkflowClassInfo(
                workflow.classname,
                workflow.alias,
                workflow.majorVersion,
                workflow.minorVersion,
                workflow.patchLevel,
                workflow.serialversionuid,
                workflow.sourceCode
            );
        });
        let wfRepo = new WorkflowRepo(
            response.data[0].value.Description,
            response.data[0].value.SourceDirs[0],
            wfArray
        );
        return wfRepo;
    }

    private parseVoidResponse = (response): boolean => {
        if (!response || !response.data 
            || response.data.length < 1
            || response.data[0].error) {
            console.log('Invalid responce:', response); 
            throw new Error('invalid response!');
        }

        return response.data[0].status === 200;
    }

    private parseEngineStatusResponse = (response): EngineStatus => {
        if (!response || !response.data
            || response.data.length < 3
            || !this.isSubResponseValid(response.data[0])
            || !this.isSubResponseValid(response.data[1])
            || !this.isSubResponseValid(response.data[2])
        ) {
            console.log('Invalid responce:', response);          
            throw new Error('invalid response!');
        }

        return new EngineStatus(
            response.data[1].value.startupTS,
            response.data[1].value.lastActivityTS,
            response.data[0].value.EngineId,
            response.data[0].value.EngineType,
            response.data[1].value.countWfiLastNMinutes,
            response.data[0].value.State.toLowerCase(),
            response.data[2].value
        );
    }

    private parseBrokenWorkflowsResponse = (response): WorkflowInfo[] => {
        if (!response || !response.data
            || response.data.length < 1
            || !this.isSubResponseValid(response.data[0])
        ) {
            console.log('Invalid responce:', response);          
            throw new Error('invalid response!');
        }

        return response.data[0].value.map(info => Object.assign(new WorkflowInfo(), info));
    }

    private isSubResponseValid(subResponse) {
        return !subResponse.error && (subResponse.value !== null ||  subResponse.value !== undefined);
    }
}
