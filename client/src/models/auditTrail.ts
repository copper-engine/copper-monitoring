export class AuditTrailInstanceFilter {
    constructor(public transactionId: string, public conversationId: String, public correlationId: String, 
        public level: number, public max: number = 50, public offset: number = 0, public includeMessages: boolean = true) {
    }
}