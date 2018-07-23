import { Component, Vue, Watch } from 'vue-property-decorator';
import './auditTrail.scss';
import { JmxService } from '../../../services/jmxService';
import { MBean } from '../../../models/mbeans';
import { FilterTime } from '../../../models/filter-time';
import { AuditTrailInstanceFilter, AuditTrail } from '../../../models/auditTrail';
import { Datetime } from 'vue-datetime';

@Component({
    template: require('./auditTrail.html'),
    services: ['jmxService'],
    components: {
        datetime: Datetime
    }
})
export class AuditTrailComponent extends Vue {
    private jmxService: JmxService = this.$services.jmxService;
    private auditTrail: AuditTrail[] = [];
    private auditTrailContext: Map<number, boolean> = new Map<number, boolean>(); 
    private auditTrailCount: number = 0;
    private mbeans: MBean[] = null;
    private page: number = 1;
    private perPage: number = 10;
    private perPageItems: number[] = [10, 15, 25, 50];
    private possibleLogLevels: number[] = [1, 2, 3, 4, 5, 6, 7];
    private clickAllowed: boolean[] = [];
    private filter: AuditTrailInstanceFilter = new AuditTrailInstanceFilter(null, null, null, null, null, 0, 0, null, null);
    private userFilter: AuditTrailInstanceFilter = new AuditTrailInstanceFilter(null, null, null, null, null, 0, 0, null, null);
    private selectedConnection: MBean = null;
    private timestamp: FilterTime = new FilterTime;
    private openFilterMenu: boolean = false;
    private filterApplied: boolean = false;
    private currentFilters: string[][] = [];
    private fetchInterval;

    mounted() {
        this.init();
    }

    beforeDestroy() {
        clearInterval(this.fetchInterval);
    }

    @Watch('$store.getters.auditTrailMBeans')
    init() {
        this.mbeans = [];
        this.$store.getters.auditTrailMBeans.map((beans) => {
            if (beans !== null) {
                beans.map((bean) => {
                    this.mbeans.push(bean);
                });            }
        });
        this.selectedConnection = this.mbeans[0];
        this.timestamp = new FilterTime;
        this.countAuditTrails(this.filter);
        this.scheduleFetch();
    }

    @Watch('page')
    @Watch('perPage')
    @Watch('$store.state.connectionSettings')
    @Watch('$store.state.user.settings.updatePeriod')
    private scheduleFetch() {
        if (this.fetchInterval) {
            clearInterval(this.fetchInterval);
        }
        this.auditTrailContext = new Map<number, boolean>(); 
        this.getAuditTrails(this.filter);
        this.countAuditTrails(this.filter);
        this.fetchInterval = setInterval(() => {
            this.getAuditTrails(this.filter);
            this.countAuditTrails(this.filter);
        }, this.$store.state.user.settings.updatePeriod * 1000);
    }

    @Watch('timestamp.fromSelect')
    formatTimestampFromSelect() {
        if (this.timestamp.fromSelect != null) {
            let time = this.timestamp.fromSelect;
            this.timestamp.from = this.formatTimeForMain(time);
            this.timestamp.fromType = this.formatTimeForType(time);
        }
    }
    @Watch('timestamp.fromType')
    formatTimestampTimeFromType() {
        if (this.timestamp.fromType != null && this.timestamp.fromType.length > 11) {
            let time = this.timestamp.fromType;
            this.timestamp.from = this.formatTimeForMain(time);
            this.timestamp.fromSelect = this.formatTimeForSelect(time);
        }
    }

    @Watch('timestamp.toSelect')
    formatTimestampToSelect() {
        if (this.timestamp.toSelect != null) {
            let time = this.timestamp.toSelect;
            this.timestamp.to = this.formatTimeForMain(time);
            this.timestamp.toType = this.formatTimeForType(time);
        }
    }
    @Watch('timestamp.toType')
    formatTimestampToType() {
        if (this.timestamp.toType != null && this.timestamp.toType.length > 11) {
            let time = this.timestamp.toType;
            this.timestamp.to = this.formatTimeForMain(time);
            this.timestamp.toSelect = this.formatTimeForSelect(time);
        }
    }

    private getAuditTrails(auditTrailFilter: AuditTrailInstanceFilter) {
        auditTrailFilter.max = this.perPage;
        auditTrailFilter.offset = (this.page - 1) * this.perPage;
        this.jmxService.getAuditTrails(this.selectedConnection, this.$store.state.user, auditTrailFilter)
            .then(result => {
                this.auditTrail = result.map((log) => {
                    return new AuditTrail(log.context, log.conversationId, log.correlationId, log.id, log.loglevel, 
                        log.message, log.messageType, log.occurrence, log.transactionId, log.workflowInstanceId);
                });
                this.getClickAllowedList(this.auditTrail.length);
                // if (result && result.length > 0) {
                //     this.getAuditMessage(result[0].id);
                // }
            }).catch(error => {
                console.error('Error getting audit trail', error);
            });
    }

    private countAuditTrails(auditTrailFilter: AuditTrailInstanceFilter) {
        this.jmxService.countAuditTrails(this.selectedConnection, this.$store.state.user, auditTrailFilter)
            .then(result => {
                this.auditTrailCount = result;
            }).catch(error => {
                console.error('Error getting audit trail', error);
            });
    }

    private getAuditMessage(id: number) {
        this.jmxService.getAuditTrailMessage(this.selectedConnection, this.$store.state.user, id).then(result => {
            // console.log('getting message for audit trail', result);
        }).catch(error => {
            console.error('Error getting audit trail', error);
        });
    }

    private getPreview(message: string) {
        let length = 140;
        // message = message + 'asfjakl gjl akjdga hlkjfhlak... ...da gsd ...ah.a fdh.da gddgadsh adfha hdfha lak.. ....dagsd ...ah. afdh. dagdd gadsh adfhahlak. .....dag sd...a h.afdh.d agddgad shadfhah';
        if (message.length > length) {
            return message.substr(0, length) + '...';
        } else {
            return message.substr(0, length);
        }
    }

    private formatTimeForMain(time) {
        return time.substr(0, 4) + '/' + time.substr(5, 2) + '/' + time.substr(8, 2) + ' ' + time.substr(11, 2) + ':' + time.substr(14, 2);
    }
    private formatTimeForType(time) {
        return time.substr(0, 4) + time.substr(5, 2) + time.substr(8, 2) + time.substr(11, 2) + time.substr(14, 2);
    }
    private formatTimeForSelect(time) {
        return time.substr(0, 4) + '-' + time.substr(4, 2) + '-' + time.substr(6, 2) + 'T' + time.substr(8, 2) + ':' + time.substr(10, 2);
    }
    private formatTimeForSelectAuto(time) {
        return time.substr(0, 4) + '-' + time.substr(4, 2) + '-' + time.substr(6, 2) + 'T' + time.substr(8, 2) + ':' + time.substr(10, 2) + ':00.000' + this.getOffset();
    }

    private getOffset() {
        let sign = '';
        let offset = new Date().getTimezoneOffset();
        if (offset > 0) {
            sign = '-';
        } else {
            sign = '+';
        }
        let hours = String(Math.abs(offset) / 60);
        if (parseInt(hours)  < 10) {
            hours = '0' + hours;
        }
        return (sign + hours + ':00');
    }

    private getNow(addition: string) {
        let date = new Date();
        let now = String(date.getFullYear());
        if (date.getMonth() > 8) {
            now = now + (date.getMonth() + 1);
        } else {
            now = now + '0' + (date.getMonth() + 1);
        }
        if (date.getDate() > 9) {
            now = now + date.getDate() + addition;
        } else {
            now = now + '0' + date.getDate() + addition;
        }
        return now;
    }

    private getTimestamp(occurrence: number) {
        return new Date(occurrence);
    }

    private getName(bean: MBean) {
        if (bean === null || bean === undefined) {
            return 'Connection';
        } else {
            let startIndex = bean.name.indexOf('=');
            return bean.name.substr(startIndex + 1) + ' (' + bean.connectionSettings.host + ':' + bean.connectionSettings.port + ')'; 
        }
    }

    private selectConnection(bean: MBean) {
        this.selectedConnection = bean;
        this.scheduleFetch();
    }

    private toggleOpen(id: number, index: number) {
        if (this.clickAllowed[index] === true) {
            let context = this.auditTrailContext.get(id);
            if (!context) {
                this.auditTrailContext.set(id, false);
                context = false;
            }
            this.clickAllowed[index] = false;
            let newState = !this.auditTrailContext.get(id);
            this.auditTrailContext.set(id, newState);
            this.$forceUpdate();
            setTimeout(() => {
                this.clickAllowed[index] = true;
            }, 750);
        }
    }

    private triggerFilterMenu() {
        this.openFilterMenu = !this.openFilterMenu;
    }

    private getClickAllowedList(count: number) {
        for (let i = 0; i < count; i++) {
            this.clickAllowed.push(true);
        }
    }

    get totalPages() {
        if (this.auditTrailCount > 0) {
            let total = Math.ceil(Number(this.auditTrailCount) / this.perPage);          
            if (this.page > total) {
                this.page = 1; 
            }
            if (total > 0) {
                return total;
            } else {
                return 1;
            }
        } else {           
            this.page = 1;
            return 1;
        }
    }

    private clearFilter() {
        this.userFilter = new AuditTrailInstanceFilter(null, null, null, null, null, 0, 0, null, null);
        this.filter = new AuditTrailInstanceFilter(null, null, null, null, null, 0, 0, null, null);
        this.timestamp.clear();
        this.filterApplied = false;
        this.scheduleFetch();
    }

    private clearChips() {
        this.filterApplied = false;
        setTimeout(() => { 
            this.clearFilter();
        }, 750);
    }

    private applyFilter() {
        if (this.timestamp.from !== null) {
            this.userFilter.occurredFrom = new Date(this.timestamp.from);
        }
        if (this.timestamp.to !== null) {
            this.userFilter.occurredTo = new Date(this.timestamp.to);
        }
        this.openFilterMenu = false;
        this.filterApplied = this.isFiltered(this.userFilter);
        this.filter = this.userFilter;
        this.scheduleFetch();
    }

    private isFiltered(newFilter: AuditTrailInstanceFilter) {
        this.currentFilters = [];
        if (newFilter.level !== null && newFilter.level !== 0) {
            this.currentFilters.push(['Log Level:', String(newFilter.level)]);
        }
        if (newFilter.instanceId !== null && newFilter.instanceId !== '') {
            this.currentFilters.push(['Workflow ID:', String(newFilter.instanceId)]);
        }
        if (newFilter.conversationId !== null && newFilter.conversationId !== '') {
            this.currentFilters.push(['Conversation ID:', String(newFilter.conversationId)]);
        }
        if (newFilter.correlationId !== null && newFilter.correlationId !== '') {
            this.currentFilters.push(['Correlation ID:', String(newFilter.correlationId)]);
        }
        if (newFilter.transactionId !== null && newFilter.transactionId !== '') {
            this.currentFilters.push(['Transaction ID:', String(newFilter.transactionId)]);
        }
        if (newFilter.occurredFrom !== null) {
            this.currentFilters.push(['Occurred From:', String(this.timestamp.from)]);
        }
        if (newFilter.occurredTo !== null) {
            this.currentFilters.push(['Occurred Up To: ', String(this.timestamp.to)]);
        }
        return this.currentFilters.length > 0;
    }

    private clickedFromDate(dateTimeName, dateTimeRef) {           
        if (this.timestamp.fromSelect === null || this.timestamp.fromSelect === '') {         
            this.timestamp.fromSelect = this.formatTimeForSelectAuto(this.getNow('0000'));
        }
        this.emitClick('from');
    }
    private clickedToDate(dateTimeName, dateTimeRef) {
        if (this.timestamp.toSelect === null || this.timestamp.toSelect === '') {
            this.timestamp.toSelect = this.formatTimeForSelectAuto(this.getNow('2359'));
        }
        this.emitClick('to');
    }

    private emitClick(dateTimeRef) {
        let elem = (this as any).$refs[dateTimeRef];
        let event = new Event('click');
        elem.$el.dispatchEvent(event);
        elem.open(event);
    }

    private dateCheck(date) {
        if (date !== null && date !== '' && date.length > 5) {
            if (Number(date.substr(4, 2)) > 12) {
                return 'Invalid Month';
            }
            if (Number(date.substr(6, 2)) > 31) {
                return 'Invalid Day';
            }
            if (date.length < 8) {
                return 'Invalid Date';
            }
            if (Number(date.substr(8, 2)) > 24 || Number(date.substr(8, 2)) < 0) {
                return 'Invalid Hour';
            }
            if (Number(date.substr(10, 2)) > 59 || Number(date.substr(8, 2)) < 0) {
                return 'Invalid Minute';
            }
            if (date.length < 12) {
                return 'Invalid Time';
            }  
        }
        return true;
    }

}