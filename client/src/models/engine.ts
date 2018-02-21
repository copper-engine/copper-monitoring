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

export class EngineStatus {
    constructor(
        public runningSince: Date,
        public lastProcessing: Date,
        public engineId: string,
        public type: string,
        public instances: number,
        public state: string,
        public brokenWFCount: number,
        public wfRepoMXBeanName: String
        // public brokenWF: WorkflowInfo[]
    ) {}
}

export class WorkflowInfo {

    constructor(
        public id: String,
        public state: String,
        public priority: number,
        public processorPoolId: String,
        public timeout: Date,
        public workflowClassInfo: WorkflowClassInfo,
        public dataAsString: String,
        public lastWaitStackTrace: String,
        public errorData: ErrorData,
        public lastModTS: Date,
        public creationTS: Date
    ) {}
}

export class WorkflowClassInfo {
    constructor(
        public classname: String,
        public alias: String,
        public majorVersion: number,
        public minorVersion: number,
        public patchLevel: number,
        public serialversionuid: number,
        public sourceCode: String
    ) {}
}
export class ErrorData {
    constructor(
        public errorTS: Date,
        public exceptionStackTrace: String
    ) {}
}