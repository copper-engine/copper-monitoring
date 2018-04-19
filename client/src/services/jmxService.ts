import Axios from 'axios';
// import Vue from 'vue';
import { State, EngineStatus, WorkflowInfo, WorkflowClassInfo, WorkflowRepo, StatesPrint, WorkflowFilter, ProcessorPool } from '../models/engine';
import { ConnectionSettings, ConnectionResult } from '../models/connectionSettings';
import moment from 'moment';
import { User } from '../models/user';
import { MBeans, MBean } from '../models/mbeans';
import * as _ from 'lodash';

export class JmxService {
    getEngineStatus(mbeans: MBean[], user: User) {
        let requests = _.flatten(mbeans.map((mbean) => this.createEngineStatusRequest(mbean)));
        return Axios.post(process.env.API_NAME, requests, {
                auth: { username: user.name, password: user.password }
            })
            .then((response) => this.parseEngineStatusResponse(response, mbeans.length))
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Engine Status:', error);
            });
    }

    createEngineStatusRequest(mbean: MBean) {
        return [
            this.createEngineInfoRequest(mbean.connectionSettings, mbean), 
            this.createEngineActivityRequest(mbean.connectionSettings, mbean.name),
            this.createCountWFRequest(mbean.connectionSettings, mbean.name, [ State.ERROR, State.INVALID ])                
        ];
    }

    countWFRequest(connectionSettings, mbeanName, user: User, filter: WorkflowFilter) {
        return Axios.post(process.env.API_NAME, this.createCountWFRequest(connectionSettings, mbeanName, filter.states, filter), {
            auth: { username: user.name, password: user.password }
        })
        .then(this.parseCountWFRequest)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Engine Status:', error);
        });
    }

    getChartCounts(mbean: MBean, user: User) {
        return Axios.post(process.env.API_NAME, [
                this.createCountWFRequest(mbean.connectionSettings, mbean.name, [ State.RUNNING ]),                
                this.createCountWFRequest(mbean.connectionSettings, mbean.name, [ State.WAITING ]),                
                this.createCountWFRequest(mbean.connectionSettings, mbean.name, [ State.FINISHED ]),                
                this.createCountWFRequest(mbean.connectionSettings, mbean.name, [ State.DEQUEUED ]),                
                this.createCountWFRequest(mbean.connectionSettings, mbean.name, [ State.ERROR ]),               
                this.createCountWFRequest(mbean.connectionSettings, mbean.name, [ State.INVALID ])                
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseChartCountResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Engine Status:', error);
            });
    }

    getGroupChartCounts(mbeans: MBean[], length: number, user: User) {
        let requests = [];
        this.createGroupCountRequest(user, mbeans, [ State.RUNNING ]).map((request) => {
            requests.push(request);
        });
        this.createGroupCountRequest(user, mbeans, [ State.DEQUEUED ]).map((request) => {
            requests.push(request);
        });

        requests.push(this.createCountWFRequest(mbeans[0].connectionSettings, mbeans[0].name, [ State.WAITING ]));
        requests.push(this.createCountWFRequest(mbeans[0].connectionSettings, mbeans[0].name, [ State.FINISHED ]));
        
        requests.push(this.createCountWFRequest(mbeans[0].connectionSettings, mbeans[0].name, [ State.ERROR ]));
        requests.push(this.createCountWFRequest(mbeans[0].connectionSettings, mbeans[0].name, [ State.INVALID ]));
        
        return Axios.post(process.env.API_NAME, requests, {
                auth: { username: user.name, password: user.password }
            })
            .then((response) => this.parseGroupChartCountResponse(response, length))
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Engine Status:', error);
            });
    }

    createGroupCountRequest(user: User, mbeans: MBean[], state: State[]) {
        let requests = mbeans.map((bean) => {
            return this.createCountWFRequest(bean.connectionSettings, bean.name, state);
        });
        return requests;
    }

    parseGroupChartCountResponse = (response, length) => {
        let counter = length;
        let running = 0;
        let dequeued = 0;
        let otherValues = [];

        for (let i = 0; i < counter; i++) {
            running = running + response.data[i].value;
        }
        for (let i = counter; i < (counter * 2); i++) {
            dequeued = dequeued + response.data[i].value;
        }
        for (let i = (counter * 2); i < response.data.length; i++) {
            otherValues.push(response.data[i].value);
        }

        return new StatesPrint(new Date(response.data[0].timestamp * 1000), 
            running, otherValues[0], otherValues[1], dequeued, otherValues[2], otherValues[3]);
    }

    getConnectionResults(connectionSettingsList: ConnectionSettings[], user: User): Promise<void | ConnectionResult[]> {
        return Axios.post(process.env.API_NAME, 
                connectionSettingsList.map( connectionSettings => this.createMBeansListRequest(connectionSettings)), 
                { auth: { username: user.name, password: user.password } })
            .then((response) => {
                if (!response || !response.data
                    || response.data.length === 0) {
                    console.log('Invalid responce:', response);          
                    throw new Error('invalid response!');
                }

                let connectionResults: ConnectionResult[] = connectionSettingsList.map((connectionSettings, i) => {
                    if (this.isSubResponseValid(response.data[i]) && response.data[i].value['copper.engine']) {
                        let engines = response.data[i].value['copper.engine'];
                        let mbeanNames = Object.keys(engines);
                        let mbeans = mbeanNames.map((mbean) => new MBean(mbean, Object.keys(engines[mbean].attr), connectionSettings));

                        return new ConnectionResult(connectionSettings, mbeans);
                    } else {
                        return new ConnectionResult(connectionSettings, []);
                    }
                });

                console.log('connectionResults', connectionResults);
                return connectionResults;
            })
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error makink JMX connection:', error);
            });
    }

    // TODO logout if wrong credentials...
    getWorkflows(connectionSettings: ConnectionSettings, mbean: string, user: User , max: number = 0, offset: number = 0, filter: WorkflowFilter) {
        return Axios.post(process.env.API_NAME, [
                this.createQueryWFRequest(connectionSettings, mbean, max, offset, filter)
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseWorkflowsResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Broken Workflows:', error);
            });
    }

    getWfRepo(connectionSettings: ConnectionSettings, mbean: string, user: User) {
        return Axios.post(process.env.API_NAME, [
            this.createWfRepoRequest(connectionSettings, mbean)
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseWfRepoResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Broken Workflows:', error);
            });
    }

    getSourceCode(connectionSettings: ConnectionSettings, user: User, mbean: string, classname: String) {
        return Axios.post(process.env.API_NAME, [
            this.createSourceCodeRequest(connectionSettings, mbean, classname)
            ], {
                auth: { username: user.name, password: user.password }
            })
            .then(this.parseSourceCodeResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error fetching Broken Workflows:', error);
            });
    }

    getProcessorPools(connectionSettings: ConnectionSettings, mbeans: string[], engineType: string, user: User) {
        let requests = mbeans.map((mbean) => { return this.createGetProcessorPoolsRequest(connectionSettings, mbean, engineType); });
        return Axios.post(process.env.API_NAME, requests, {
                    auth: { username: user.name, password: user.password }
                })
            .then((response) => this.parseProcessorPoolsResponse(response, mbeans))
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
            });
    }

    resume(connectionSettings: ConnectionSettings, user: User, mbean: string) {
        return Axios.post(process.env.API_NAME, [
            this.createPoolExecRequest(connectionSettings, mbean, { operation: 'resume()' })
        ], {
            auth: { username: user.name, password: user.password }
        })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
        });
    }

    restartAll(connectionSettings: ConnectionSettings, mbean: string, user: User) {
        return Axios.post(process.env.API_NAME, [
                    this.createJmxExecRequest(connectionSettings, mbean, { operation: 'restartAll()' })
                ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
            });
    }

    suspend(connectionSettings: ConnectionSettings, user: User, mbean: string) {
        return Axios.post(process.env.API_NAME, [
            this.createPoolExecRequest(connectionSettings, mbean, { operation: 'suspend()' })
        ], {
            auth: { username: user.name, password: user.password }
        })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
        });
    }

    resumeDeque(connectionSettings: ConnectionSettings, user: User, mbean: string) {
        return Axios.post(process.env.API_NAME, [
            this.createPoolExecRequest(connectionSettings, mbean, { operation: 'resumeDeque()' })
        ], {
            auth: { username: user.name, password: user.password }
        })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
        });
    }

    suspendDeque(connectionSettings: ConnectionSettings, user: User, mbean: string) {
        return Axios.post(process.env.API_NAME, [
            this.createPoolExecRequest(connectionSettings, mbean, { operation: 'suspendDeque()' })
        ], {
            auth: { username: user.name, password: user.password }
        })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflows:', error);
        });
    }

    restart(connectionSettings: ConnectionSettings, mbean: string, workflowId: string, user: User) {
        return Axios.post(process.env.API_NAME, 
                [ this.createJmxExecRequest(connectionSettings, mbean, { operation: 'restart', arguments: [ workflowId ] }) ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
            });
    }

    deleteBroken(connectionSettings: ConnectionSettings, mbean: string, workflowId: string, user: User) {
        return Axios.post(process.env.API_NAME, 
                [ this.createJmxExecRequest(connectionSettings, mbean, { operation: 'deleteBroken', arguments: [ workflowId ] }) ], {
                    auth: { username: user.name, password: user.password }
                })
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
            });
    }

    deleteFiltered(connectionSettings: ConnectionSettings, mbean: string, user: User , max: number = 0, offset: number = 0, filter: WorkflowFilter) {
        return Axios.post(process.env.API_NAME, 
            [ this.createJmxExecRequest(connectionSettings, mbean, { operation: 'deleteFiltered(javax.management.openmbean.CompositeData)', arguments: [this.createWorkflowFilter(connectionSettings, filter.states, max, offset, filter)] }) ], {
                auth: { username: user.name, password: user.password }
            })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting broken workflow:', error);
        });
    }

    restartFiltered(connectionSettings: ConnectionSettings, mbean: string, user: User , max: number = 0, offset: number = 0, filter: WorkflowFilter) {
        return Axios.post(process.env.API_NAME, [
            this.createJmxExecRequest(connectionSettings, mbean, { operation: 'restartFiltered(javax.management.openmbean.CompositeData)', arguments: [this.createWorkflowFilter(connectionSettings, filter.states, max, offset, filter)]  })
            ], {
                auth: { username: user.name, password: user.password }
            })
        .then(this.parseVoidResponse)
        .catch(error => {
            console.error('Can\'t connect to Jolokia server or Copper Engine app. Checkout if it\'s running. Error restarting filtered workflows:', error);
        });
    }

    private buildRestartAllRequest = (connectionSettings: ConnectionSettings, mbean: string) => [
        this.createJmxExecRequest(connectionSettings, mbean, {
            operation: 'restartAll()',
            arguments: [], 
        })
    ]

    private createSourceCodeRequest(connectionSettings: ConnectionSettings, mbean: string, classname: String) {
        return {
            type: 'EXEC',
            mbean: mbean,
            operation: 'getWorkflowInfo',
            arguments: [classname],
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }

    private createWfRepoRequest(connectionSettings: ConnectionSettings, mbean: string) {
        return {
            type: 'read',
            mbean: mbean,
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }
    private createEngineInfoRequest(connectionSettings: ConnectionSettings, mbean: MBean) {
        let attributes = ['EngineId', 'EngineType', 'State', 'WorkflowRepository', 'ProcessorPools'];
        if (mbean.atts.indexOf('DBStorage') >= 0) {
            attributes.push('DBStorage');
        }
        if (mbean.atts.indexOf('EngineClusterId') >= 0) {
            attributes.push('EngineClusterId');
        }
        return {
            type: 'read',
            mbean: mbean.name,
            attribute: attributes,
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }

    private createMBeansListRequest(connectionSettings: ConnectionSettings) {
        return {
            type: 'LIST',
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` },
        };
    }

    private createGetProcessorPoolsRequest(connectionSettings: ConnectionSettings, mbean: string, engineType: string) {
        let attributes = ((engineType === 'persistent') ? ['Id', 'ProcessorPoolState', 'ThreadPriority', 'UpperThreshold', 'LowerThreshold', 'NumberOfThreads', 'NumberOfActiveThreads'] : ['Id', 'ProcessorPoolState', 'ThreadPriority', 'MemoryQueueSize', 'QueueSize', 'NumberOfThreads', 'NumberOfActiveThreads']);
        return {
            type: 'READ',
            mbean: mbean,
            attribute: attributes,
            target: { url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi` }
        };
    }

    private createQueryWFRequest(connectionSettings: ConnectionSettings, mbean: string, max: number, offset: number, filter: WorkflowFilter) {
        return this.createJmxExecRequest(connectionSettings, mbean, {
            operation: 'queryWorkflowInstances(javax.management.openmbean.CompositeData)',
            arguments: [this.createWorkflowFilter(connectionSettings, filter.states, max, offset, filter)], // get workflows with status Invalid
        });
    }

    private createCountWFRequest(connectionSettings: ConnectionSettings, mbean: string, states: State[], filter: WorkflowFilter = new WorkflowFilter) {
        return this.createJmxExecRequest(connectionSettings, mbean, {
            operation: 'countWorkflowInstances(javax.management.openmbean.CompositeData)',
            arguments: [this.createWorkflowFilter(connectionSettings, states, 0, 0, filter)], // get workflows with status Invalid
        });
    }

    private createEngineActivityRequest(connectionSettings: ConnectionSettings, mbean: string) {
        return this.createJmxExecRequest(connectionSettings, mbean, {
            operation: 'queryEngineActivity',
            arguments: [connectionSettings.fetchPeriod], // fetch info for last N minutes
        });
    }

    private createWorkflowFilter(connectionSettings: ConnectionSettings, states: State[], max: number = 0, offset: number = 0, filter: WorkflowFilter = new WorkflowFilter) {
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

    private createJmxExecRequest(connectionSettings, mbean: string, uniquePart: {}) {
        return Object.assign(this.createJmxExecRequstBase(connectionSettings, mbean), uniquePart);
    }

    private createPoolExecRequest(connectionSettings, mbean, uniquePart: {}) {
        return Object.assign(this.createPoolExecRequstBase(connectionSettings, mbean), uniquePart);
    }

    private createJmxExecRequstBase(connectionSettings: ConnectionSettings, mbean: string) {
        return {
            type: 'EXEC',
            mbean: mbean,
            target: {
                url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi`
            }
        };
    }

    private createPoolExecRequstBase(connectionSettings: ConnectionSettings, mbean) {
        return {
            type: 'EXEC',
            mbean: mbean,
            target: {
                url: `service:jmx:rmi:///jndi/rmi://${connectionSettings.host}:${connectionSettings.port}/jmxrmi`
            }
        };
    }

    parseCountWFRequest(response) {
        if (!response || !response.data 
            || response.data.length < 1
            || response.data.error) {
            console.log('Invalid responce:', response); 
            throw new Error('invalid response!');
        }
        return response.data.value;
    }

    private parseProcessorPoolsResponse = (response, mbeans) => {
        if (!response || !response.data 
            || response.data.length < 1
            || response.data.error) {
            console.log('Invalid responce:', response); 
            throw new Error('invalid response!');
        }
        let pools = response.data.map((pool, index) => {
            let newPool = new ProcessorPool (
            pool.value.Id,
            pool.value.ProcessorPoolState,
            pool.value.ThreadPriority,
            pool.value.QueueSize,
            pool.value.MemoryQueueSize,
            pool.value.DequeBulkSize,
            pool.value.EmptyQueueWaitMSec,
            pool.value.UpperThresholdReachedWaitMSec,            
            pool.value.UpperThreshold,
            pool.value.LowerThreshold,
            pool.value.NumberOfThreads,
            pool.value.NumberOfActiveThreads, 
            mbeans[index]
            );
            return newPool;
        });
        return pools;
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

    private parseEngineStatusResponse = (response, enginesCount: number): EngineStatus[] => {
        if (!response || !response.data || response.data.length < 3) {
            console.log('Invalid responce:', response);          
            throw new Error('invalid response!');
        }

        return _.chunk(response.data, 3).map((data, index) => this.parseEngineStatusData(data, index));
    }
    private parseEngineStatusData = (data, id: number): EngineStatus => {
        if (data.length < 3
            || !this.isSubResponseValid(data[0])
            || !this.isSubResponseValid(data[1])
            || !this.isSubResponseValid(data[2])
        ) {
            throw new Error('invalid engine data:!' + data);
        }

        return new EngineStatus(
            id,
            data[1].value.startupTS,
            data[1].value.lastActivityTS,
            data[0].value.EngineClusterId,
            data[0].value.EngineId,
            data[0].value.EngineType,
            data[1].value.countWfiLastNMinutes,
            data[0].value.State.toLowerCase(),
            data[2].value,
            data[0].value.DBStorage ? data[0].value.DBStorage.objectName : null,
            data[0].value.WorkflowRepository.objectName,
            data[0].value.ProcessorPools.map((mbean) => mbean.objectName)            
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

    private parseChartCountResponse = (response): StatesPrint => {
        console.log('chart responce', response.data);
        if (!response || !response.data
            || response.data.length < 5
            || !this.isSubResponseValid(response.data[0])
            || !this.isSubResponseValid(response.data[1])
            || !this.isSubResponseValid(response.data[2])
            || !this.isSubResponseValid(response.data[3])
            || !this.isSubResponseValid(response.data[4])
            || !this.isSubResponseValid(response.data[5])
        ) {
            console.log('Invalid responce:', response);          
            throw new Error('invalid response!');
        }

        return new StatesPrint(new Date(response.data[0].timestamp * 1000),
        response.data[0].value, response.data[1].value, response.data[2].value, response.data[3].value, response.data[4].value, response.data[5].value);
    }

    private parseWorkflowsResponse = (response): WorkflowInfo[] => {
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
