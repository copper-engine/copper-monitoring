import Axios from 'axios';
// import Vue from 'vue';
import { State, EngineStatus, WorkflowInfo, WorkflowClassInfo,
    WorkflowRepo, WorkflowFilter, ProcessorPool } from '../models/engine';
import { ConnectionSettings } from '../models/connectionSettings';
import moment from 'moment';
import { User } from '../models/user';

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
    getBrokenWorkflows(connectionSettings: ConnectionSettings, user: User , max: number = 50, offset: number = 0, filter: WorkflowFilter) {
        return Axios.post(process.env.API_NAME, [
                this.createQueryBrokenWFRequest(connectionSettings, max, offset, filter)
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseBrokenWorkflowsResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Broken Workflows:', error);
            });
    }

    getWfRepo(connectionSettings: ConnectionSettings, user: User) {
        return Axios.post(process.env.API_NAME, [
            this.createWfRepoRequest(connectionSettings)
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

    getProcessorPools(connectionSettings: ConnectionSettings, user: User) {
        return Axios.post(process.env.API_NAME, 
                [ this.createGetProcessorPoolsRequest(connectionSettings) ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseProcessorPoolsResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
            });
    }

    resume(connectionSettings: ConnectionSettings, user: User) {
        return Axios.post(process.env.API_NAME, [
            this.createPoolExecRequest(connectionSettings, { operation: 'resume()' })
        ], {
            auth: { username: user.name, password: user.password }
        })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
        });
    }

    suspend(connectionSettings: ConnectionSettings, user: User) {
        return Axios.post(process.env.API_NAME, [
            this.createPoolExecRequest(connectionSettings, { operation: 'suspend()' })
        ], {
            auth: { username: user.name, password: user.password }
        })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
        });
    }

    resumeDeque(connectionSettings: ConnectionSettings, user: User) {
        return Axios.post(process.env.API_NAME, [
            this.createPoolExecRequest(connectionSettings, { operation: 'resumeDeque()' })
        ], {
            auth: { username: user.name, password: user.password }
        })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
        });
    }

    suspendDeque(connectionSettings: ConnectionSettings, user: User) {
        return Axios.post(process.env.API_NAME, [
            this.createPoolExecRequest(connectionSettings, { operation: 'suspendDeque()' })
        ], {
            auth: { username: user.name, password: user.password }
        })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
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

    deleteFiltered(connectionSettings: ConnectionSettings, user: User , max: number = 50, offset: number = 0, filter: WorkflowFilter) {
        return Axios.post(process.env.API_NAME, 
            [ this.createJmxExecRequest(connectionSettings, { operation: 'deleteFiltered(javax.management.openmbean.CompositeData)', arguments: [this.createWorkflowFilter(connectionSettings, filter.states, max, offset, filter)] }) ], {
                auth: { username: user.name, password: user.password }
            })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
        });
    }

    restartFiltered(connectionSettings: ConnectionSettings, user: User , max: number = 50, offset: number = 0, filter: WorkflowFilter) {
        return Axios.post(process.env.API_NAME, [
            this.createJmxExecRequest(connectionSettings, { operation: 'restartFiltered(javax.management.openmbean.CompositeData)', arguments: [this.createWorkflowFilter(connectionSettings, filter.states, max, offset, filter)]  })
            ], {
                auth: { username: user.name, password: user.password }
            })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting filtered workflows:', error);
        });
    }

    private buildRestartAllRequest = (connectionSettings: ConnectionSettings) => [
        this.createJmxExecRequest(connectionSettings, {
            operation: 'restartAll()',
            arguments: [], 
        })
    ]

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

    private createWfRepoRequest(connectionSettings: ConnectionSettings) {
        return {
            type: 'read',
            mbean: connectionSettings.wfRepoMBean,
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }
    private createEngineInfoRequest(connectionSettings: ConnectionSettings) {
        return {
            type: 'read',
            mbean: connectionSettings.engineMBean,
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

    private createGetProcessorPoolsRequest(connectionSettings: ConnectionSettings) {
        return {
            type: 'READ',
            mbean: 'copper.processorpool:name=persistent.ProcessorPool.default',
            attribute: ['Id', 'ProcessorPoolState', 'ThreadPriority', 'UpperThreshold', 'LowerThreshold', 'NumberOfThreads', 'NumberOfActiveThreads'],
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }

    private createQueryBrokenWFRequest(connectionSettings: ConnectionSettings, max: number, offset: number, filter: WorkflowFilter) {
        return this.createJmxExecRequest(connectionSettings, {
            operation: 'queryWorkflowInstances(javax.management.openmbean.CompositeData)',
            arguments: [this.createWorkflowFilter(connectionSettings, filter.states, max, offset, filter)], // get workflows with status Invalid
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

    private createWorkflowFilter(connectionSettings: ConnectionSettings, states: State[], max: number = 50, offset: number = 0, filter: WorkflowFilter = new WorkflowFilter) {
        let createTo = new Date().getTime();
        let modTo = new Date().getTime();
        if (filter.createTo != null) {
            createTo = filter.createTo;
        }
        if (filter.modTo != null) {
            modTo = filter.modTo;
        }
        return { 
            'states': states.map((state) => State[state]),
            'lastModTS': { 'from': filter.modFrom, 'to': filter.modTo}, 
            'creationTS': { 'from': filter.createFrom, 'to': filter.createTo}, 
            'processorPoolId': null, 
            'workflowClassname': filter.classname, 
            'max': max,
            'offset': offset
        };
    }

    private createJmxExecRequest(connectionSettings, uniquePart: {}) {
        return Object.assign(this.createJmxExecRequstBase(connectionSettings), uniquePart);
    }

    private createPoolExecRequest(connectionSettings, uniquePart: {}) {
        return Object.assign(this.createPoolExecRequstBase(connectionSettings), uniquePart);
    }

    private createJmxExecRequstBase(connectionSettings: ConnectionSettings) {
        return {
            type: 'EXEC',
            mbean: connectionSettings.engineMBean,
            target: {
                url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi`
            }
        };
    }

    private createPoolExecRequstBase(connectionSettings: ConnectionSettings) {
        return {
            type: 'EXEC',
            mbean: 'copper.processorpool:name=persistent.ProcessorPool.default',
            target: {
                url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi`
            }
        };
    }

    private parseProcessorPoolsResponse = (response) => {
        if (!response || !response.data 
            || response.data.length < 1
            || response.data[0].error) {
            console.log('Invalid responce:', response); 
            throw new Error('invalid response!');
        }
        let pool = new ProcessorPool (
            response.data[0].value.Id,
            response.data[0].value.ProcessorPoolState,
            response.data[0].value.ThreadPriority,
            response.data[0].value.QueueSize,
            response.data[0].value.MemoryQueueSize,
            response.data[0].value.DequeBulkSize,
            response.data[0].value.EmptyQueueWaitMSec,
            response.data[0].value.UpperThresholdReachedWaitMSec,            
            response.data[0].value.UpperThreshold,
            response.data[0].value.LowerThreshold,
            response.data[0].value.NumberOfThreads,
            response.data[0].value.NumberOfActiveThreads
        );
        return pool;
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
            console.log('Invalid response:', response); 
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

    private parseSourceCodeResponse = (response): String => {
        if (!response || !response.data 
            || response.data.length < 1
            || response.data[0].error) {
            console.log('Invalid responce:', response); 
            throw new Error('invalid response!');
        }
        return response.data[0].value.sourceCode;
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
