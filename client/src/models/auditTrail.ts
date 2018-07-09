export class AuditTrailInstanceFilter {
    constructor(public instanceId: string, public transactionId: string, public conversationId: String, public correlationId: String, 
        public level: number, public max: number = 50, public offset: number = 0, public occurredFrom: Date, public occurredTo: Date, 
        public includeMessages: boolean = true) {
    }
}
export class AuditTrail {
    constructor(public context: string, public conversationId: string, public correlationId: string, public id: number,
        public logLevel: number, public message: string, public messageType: string, public occurrence: number, 
        public transactionId: number, public workflowInstanceId: string, public open: boolean) {
    } 
}