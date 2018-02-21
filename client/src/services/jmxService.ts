import Axios from 'axios';
// import Vue from 'vue';
import { State, EngineStatus, WorkflowInfo } from '../models/engine';
import { ConnectionSettings } from '../models/connectionSettings';
import moment from 'moment';
import { User } from '../models/user';

const ENGINE_MBEAN = 'copper.engine:name=persistent.engine';

export class JmxService {
    getEngineStatus(connectionSettings: ConnectionSettings, user: User) {
        return Axios.post(process.env.API_NAME, [
                this.createEngineInfoRequest(connectionSettings), 
                this.createEngineActivityRequest(connectionSettings),
                this.createCountBrokenWFRequest(connectionSettings)                
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseEngineStatusResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Engine Status:', error);
            });
    }

// TODO logout if wrong credentials...
    getBrokenWorkflows(connectionSettings: ConnectionSettings, user: User , max: number = 50, offset: number = 0) {
        return Axios.post(process.env.API_NAME, [
                this.createQueryBrokenWFRequest(connectionSettings, max, offset)
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseBrokenWorkflowsResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Broken Workflows:', error);
            });
    }

    getWfRepo(connectionSettings: ConnectionSettings, user: User , wfRepoMXBean: String ) {
        return Axios.post(process.env.API_NAME, [
            this.createWfRepoRequest(connectionSettings, wfRepoMXBean)
            ], {
                auth: { username: user.name, password: user.password }
            })
            // TODO
            // .then(this.parseWfRepoResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Broken Workflows:', error);
            });
    }

    restartAll(connectionSettings: ConnectionSettings, user: User) {
        return Axios.post(process.env.API_NAME, [
                    this.createJmxExecRequest(connectionSettings, { operation: 'restartAll()' })
                ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
            });
    }

    deleteAll(connectionSettings: ConnectionSettings, workflows: WorkflowInfo[], user: User) {
        let requestList = workflows.map((workflow) => {
            return this.createJmxExecRequest(connectionSettings, { operation: 'deleteBroken', arguments: [ workflow.id ] });
        });
        
        return Axios.post(process.env.API_NAME, requestList, {
            auth: { username: user.name, password: user.password }
        })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
            });
    }

    restart(connectionSettings: ConnectionSettings, workflowId: string, user: User) {
        return Axios.post(process.env.API_NAME, 
                [ this.createJmxExecRequest(connectionSettings, { operation: 'restart', arguments: [ workflowId ] }) ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
            });
    }

    deleteBroken(connectionSettings: ConnectionSettings, workflowId: string, user: User) {
        return Axios.post(process.env.API_NAME, 
                [ this.createJmxExecRequest(connectionSettings, { operation: 'deleteBroken', arguments: [ workflowId ] }) ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
            });
    }

    private buildRestartAllRequest = (connectionSettings: ConnectionSettings) => [
        this.createJmxExecRequest(connectionSettings, {
            operation: 'restartAll()',
            arguments: [], 
        })
    ]

    private createWfRepoRequest(connectionSettings: ConnectionSettings, wfRepoMXBean: String) {
        return {
            type: 'read',
            // mbean: 'copper.workflowrepo:name=wfRepository',
            mbean: wfRepoMXBean,
            // attribute: ['EngineId', 'EngineType', 'State', 'WorkflowRepository'],
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }
    private createEngineInfoRequest(connectionSettings: ConnectionSettings) {
        return {
            type: 'read',
            mbean: ENGINE_MBEAN,
            attribute: ['EngineId', 'EngineType', 'State', 'WorkflowRepository'],
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }
    private createQueryBrokenWFRequest(connectionSettings: ConnectionSettings, max: number, offset: number) {
        return this.createJmxExecRequest(connectionSettings, {
            operation: 'queryWorkflowInstances(javax.management.openmbean.CompositeData)',
            arguments: [this.createWorkflowFilter(connectionSettings, [State.ERROR, State.INVALID], max, offset)], // get workflows with status Invalid
        });
    }
    private createCountBrokenWFRequest(connectionSettings: ConnectionSettings) {
        return this.createJmxExecRequest(connectionSettings, {
            operation: 'countWorkflowInstances(javax.management.openmbean.CompositeData)',
            arguments: [this.createWorkflowFilter(connectionSettings, [State.ERROR, State.INVALID])], // get workflows with status Invalid
        });
    }

    private createEngineActivityRequest(connectionSettings: ConnectionSettings) {
        return this.createJmxExecRequest(connectionSettings, {
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

    private createJmxExecRequest(connectionSettings, uniquePart: {}) {
        return Object.assign(this.createJmxExecRequstBase(connectionSettings.host, connectionSettings.port), uniquePart);
    }

    private createJmxExecRequstBase(host: string, port: string) {
        return {
            type: 'EXEC',
            mbean: ENGINE_MBEAN,
            target: {
                url: `service:jmx:rmi:///jndi/rmi://${host}:${port}/jmxrmi`
            }
        };
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

        let wfName = 'NoWorkflowRepository';
        if (response.data[0].value.WorkflowRepository != null) {
            wfName = response.data[0].value.WorkflowRepository.objectName;
        }

        return new EngineStatus(
            response.data[1].value.startupTS,
            response.data[1].value.lastActivityTS,
            response.data[0].value.EngineId,
            response.data[0].value.EngineType,
            response.data[1].value.countWfiLastNMinutes,
            response.data[0].value.State.toLowerCase(),
            response.data[2].value,
            wfName
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

        return response.data[0].value as WorkflowInfo[];
    }

    private isSubResponseValid(subResponse) {
        return !subResponse.error && (subResponse.value !== null ||  subResponse.value !== undefined);
    }
}
