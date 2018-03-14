export enum State {
    RAW,        // Workflow was just initialized, nothing happened with it so far
    ENQUEUED,   // Workflow is in queue and waits for execution (Used by transient engines) / waits for engine to take ownership and grep it from database (persistent)
    DEQUEUED,   // Workflow is pulled from database (dequeued) and put to the Processing pool queue. Dequeue is marked on the processing state within the database.
    RUNNING,    // Workflow is currently running (This state is set in RAM only. A persistent engine will not update the database whether a workflow is running (it keeps on dequeud)
    WAITING,    // Workflow is in wait state. The awake-conditions from wait are not yet (fully) fulfilled.
    FINISHED,   // Workflow finished execution normally.
    ERROR,      // Workflow stopped execution due to an exception. Might be resubmitted later on.
    INVALID     // Something illegal happened to the workflow. Cannot work with it anymore. In persistent mode, this might be caused by a deserialization error or something similar.
}

export class StatesPrint {
    constructor(
        public time: Date,
        public raw: number,
        public waiting: number,
        public finished: number,
        public dequeued: number,
        public error: number,
        public invalid: number) {}
}

export class EngineStatus {
    constructor(
        public runningSince: Date,
        public lastProcessing: Date,
        public engineId: string,
        public type: string,
        public instances: number,
        public state: string,
        public brokenWFCount: number
    ) {}
}

export class WorkflowRepo {
    constructor(
        public description: string,
        public sourceDir: string,
        public workFlowInfo: Array<WorkflowClassInfo>
    ) {}
}

export class WorkflowInfo {
    public id: string;
    public state: string;
    public priority: number;
    public processorPoolId: string;
    public timeout: Date;
    public workflowClassInfo: WorkflowClassInfo;
    public dataAsstring: string;
    public lastWaitStackTrace: string;
    public errorData: ErrorData;
    public lastModTS: Date;
    public creationTS: Date;

    constructor(
    ) {}


    public getLastWaitingLineNum(): number {
        if (this.lastWaitStackTrace) {
            let className = '(' + this.getShortClassName() + '.java';
            let firstLine = this.lastWaitStackTrace.split('\n').find(line => line.indexOf(className) !== -1);
            if (firstLine) {
                let lineNum = parseInt(firstLine.substring(firstLine.lastIndexOf(':') + 1, firstLine.lastIndexOf(')')));
                return lineNum ? lineNum : -1;
            }
        }

        return -1;
    }
    public getErrorLineNum(): number {
        if (this.errorData && this.errorData.exceptionStackTrace) {
            let className = '(' + this.getShortClassName() + '.java';
            let firstLine = this.errorData && this.errorData.exceptionStackTrace.split('\n').find(line => line.indexOf(className) !== -1);
            if (firstLine) {
                let lineNum = parseInt(firstLine.substring(firstLine.lastIndexOf(':') + 1, firstLine.lastIndexOf(')')));
                return lineNum ? lineNum : -1;
            }
        }

        return -1;
    }

    public getShortClassName(): string {
        if (this.workflowClassInfo.classname) {
            let names = this.workflowClassInfo.classname.split('.');
            return names[names.length - 1];
        } else {
            return this.workflowClassInfo.classname;
        }
    }
}

export class WorkflowClassInfo {
    public sourceCodeLines: string[];

    constructor(
        public classname: string,
        public alias: string,
        public majorVersion: number,
        public minorVersion: number,
        public patchLevel: number,
        public serialversionuid: number,
        public sourceCode: string,
        public open: Boolean = false
    ) {}
}
export class ErrorData {
    constructor(
        public errorTS: Date,
        public exceptionStackTrace: string
    ) {}
}