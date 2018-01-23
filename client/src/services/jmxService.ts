import Axios from 'axios';
// import Vue from 'vue';
import { State, EngineStatus, WorkflowInfo } from '../models/engine';
import { ConnectionSettings } from '../models/connectionSettings';
import moment from 'moment';

const ENGINE_MBEAN = 'copper.engine:name=persistent.engine';

export class JmxService {
    getEngineStatus(connectionSettings: ConnectionSettings) {
        return Axios.post(process.env.API_NAME, [
                this.createEngineInfoRequest(connectionSettings), 
                this.createEngineActivityRequest(connectionSettings),
                this.createCountBrokenWFRequest(connectionSettings)
            ])
            .then(this.parseEngineStatusResponse)
            .catch(error => {
                console.error('Error fetching Engine Status:', error);
            });
    }

    getBrokenWorkflows(connectionSettings: ConnectionSettings, max: number = 50, offset: number = 0) {
        return Axios.post(process.env.API_NAME, [
                this.createQueryBrokenWFRequest(connectionSettings, max, offset)
            ])
            .then(this.parseBrokenWorkflowsResponse)
            .catch(error => {
                console.error('Error fetching Broken Workflows:', error);
            });
    }

    restartAll(connectionSettings: ConnectionSettings) {
        return Axios.post(process.env.API_NAME, [
                    this.createJmxExecRequest(connectionSettings, { operation: 'restartAll()' })
                ])
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Error restarting broken workflows:', error);
            });
    }

    deleteAll(connectionSettings: ConnectionSettings, workflows: WorkflowInfo[]) {
        let requestList = workflows.map((workflow) => {
            return this.createJmxExecRequest(connectionSettings, { operation: 'deleteBroken', arguments: [ workflow.id ] });
        });
        
        return Axios.post(process.env.API_NAME, requestList)
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Error restarting broken workflows:', error);
            });
    }

    restart(connectionSettings: ConnectionSettings, workflowId: string) {
        return Axios.post(process.env.API_NAME, 
                [ this.createJmxExecRequest(connectionSettings, { operation: 'restart', arguments: [ workflowId ] }) ])
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Error restarting broken workflow:', error);
            });
    }

    deleteBroken(connectionSettings: ConnectionSettings, workflowId: string) {
        return Axios.post(process.env.API_NAME, 
                [ this.createJmxExecRequest(connectionSettings, { operation: 'deleteBroken', arguments: [ workflowId ] }) ])
            .then(this.parseVoidResponse)
            .catch(error => {
                console.error('Error restarting broken workflow:', error);
            });
    }

    private buildRestartAllRequest = (connectionSettings: ConnectionSettings) => [
        this.createJmxExecRequest(connectionSettings, {
            operation: 'restartAll()',
            arguments: [], 
        })
    ]

    private createEngineInfoRequest(connectionSettings: ConnectionSettings) {
        return {
            type: 'read',
            mbean: ENGINE_MBEAN,
            attribute: ['EngineId', 'EngineType', 'State'],
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
            throw new Error('invalid response!');
        }

        return response.data[0].value as WorkflowInfo[];
    }

    private isSubResponseValid(subResponse) {
        return !subResponse.error && (subResponse.value !== null ||  subResponse.value !== undefined);
    }
}
