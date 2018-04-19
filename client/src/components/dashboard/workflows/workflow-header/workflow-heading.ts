import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { JmxService } from '../../../../services/jmxService';
import { WorkflowRepo, WorkflowFilter, State, EngineStatus } from '../../../../models/engine';
import { Datetime } from 'vue-datetime';
import { FilterTime } from '../../../../models/filter-time';
import './workflow-heading.scss';

@Component({
    template: require('./workflow-heading.html'),
    components: {
        datetime: Datetime
    }
})
export class WorkflowHeading extends Vue {
    @Prop() engineStatus;
    @Prop() wfType: string;
    @Prop() wfCount: number;
    @Prop() restartingAll: boolean;
    @Prop() deletingAll: boolean;
    private jmxService: JmxService = this.$services.jmxService;
    clickAllowed = true;
    openFilterMenu: boolean = false;
    dialogDeleteOpen: boolean = false;
    hideOverflow: boolean = true;
    filterApplied: boolean = false;
    currentFilters: string[][] = [];
    currentFilterObject: WorkflowFilter;
    states: string[] = [];
    classNames: string = null;
    modTime: FilterTime = new FilterTime;
    createTime: FilterTime = new FilterTime;
    possibleClassnames = [];
    possibleStates = [
        'Error',
        'Invalid'
    ];

    clickedFromDate(dateTimeName, dateTimeRef) {
        if (this[dateTimeName]['fromSelect'] === null || this[dateTimeName]['fromSelect'] === '') {
            this[dateTimeName]['fromSelect'] = this.formatTimeForSelectAuto(this.getNow('0000'));
        }
        this.emitClick(dateTimeRef);
    }
    clickedToDate(dateTimeName, dateTimeRef) {
        if (this[dateTimeName]['toSelect'] === null || this[dateTimeName]['toSelect'] === '') {
            this[dateTimeName]['toSelect'] = this.formatTimeForSelectAuto(this.getNow('2359'));
        }
        this.emitClick(dateTimeRef);
    }

    emitClick(dateTimeRef) {
        let elem = (this as any).$refs[dateTimeRef];
        let event = new Event('click');
        elem.$el.dispatchEvent(event);
        elem.open(event);
    }

    @Watch('createTime.fromSelect')
    formatCreateFromSelect() {
        if (this.createTime.fromSelect != null) {
            let time = this.createTime.fromSelect;
            this.createTime.from = this.formatTimeForMain(time);
            this.createTime.fromType = this.formatTimeForType(time);
        }
    }
    @Watch('createTime.fromType')
    formatCreateTimeFromType() {
        if (this.createTime.fromType != null && this.createTime.fromType.length > 11) {
            let time = this.createTime.fromType;
            this.createTime.from = this.formatTimeForMain(time);
            this.createTime.fromSelect = this.formatTimeForSelect(time);
        }
    }

    @Watch('createTime.toSelect')
    formatCreateToSelect() {
        if (this.createTime.toSelect != null) {
            let time = this.createTime.toSelect;
            this.createTime.to = this.formatTimeForMain(time);
            this.createTime.toType = this.formatTimeForType(time);
        }
    }
    @Watch('createTime.toType')
    formatCreateTimeToType() {
        if (this.createTime.toType != null && this.createTime.toType.length > 11) {
            let time = this.createTime.toType;
            this.createTime.to = this.formatTimeForMain(time);
            this.createTime.toSelect = this.formatTimeForSelect(time);
        }
    }

    @Watch('modTime.fromSelect')
    formatModFromSelect() {
        if (this.modTime.fromSelect != null) {
            let time = this.modTime.fromSelect;
            this.modTime.from = this.formatTimeForMain(time);
            this.modTime.fromType = this.formatTimeForType(time);
        }
    }
    @Watch('modTime.fromType')
    formatModTimeFromType() {
        if (this.modTime.fromType != null && this.modTime.fromType.length > 11) {
            let time = this.modTime.fromType;
            this.modTime.from = this.formatTimeForMain(time);
            this.modTime.fromSelect = this.formatTimeForSelect(time);
        }
    }

    @Watch('modTime.toSelect')
    formatModToSelect() {
        if (this.modTime.toSelect != null) {
            let time = this.modTime.toSelect;
            this.modTime.to = this.formatTimeForMain(time);
            this.modTime.toType = this.formatTimeForType(time);
        }
    }
    @Watch('modTime.toType')
    formatModTimeToType() {
        if (this.modTime.toType != null && this.modTime.toType.length > 11) {
            let time = this.modTime.toType;
            this.modTime.to = this.formatTimeForMain(time);
            this.modTime.toSelect = this.formatTimeForSelect(time);
        }
    }

    formatTimeForMain(time) {
        return time.substr(0, 4) + '/' + time.substr(5, 2) + '/' + time.substr(8, 2) + ' ' + time.substr(11, 2) + ':' + time.substr(14, 2);
    }
    formatTimeForType(time) {
        return time.substr(0, 4) + time.substr(5, 2) + time.substr(8, 2) + time.substr(11, 2) + time.substr(14, 2);
    }
    formatTimeForSelect(time) {
        return time.substr(0, 4) + '-' + time.substr(4, 2) + '-' + time.substr(6, 2) + 'T' + time.substr(8, 2) + ':' + time.substr(10, 2);
    }

    formatTimeForSelectAuto(time) {
        return time.substr(0, 4) + '-' + time.substr(4, 2) + '-' + time.substr(6, 2) + 'T' + time.substr(8, 2) + ':' + time.substr(10, 2) + ':00.000' + this.getOffset();
    }

    getOffset() {
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

    getNow(addition: string) {
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

    dateCheck(date) {
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

    triggerFilterMenu() {
        if (this.clickAllowed === true) {
            if (this.possibleClassnames.length < 1) {
                this.getPossibleClassNames();
            }
            this.openFilterMenu = !this.openFilterMenu;
            if (this.openFilterMenu === true) {
                setTimeout(() => { this.hideOverflow = false; }, 250);
            } else {
                this.hideOverflow = true;
                setTimeout(() => { this.hideOverflow = true; }, 250);
            }
            this.clickAllowed = false;
            setTimeout(() => { this.clickAllowed = true; }, 750);
        }
    }
    clearChips() {
        this.filterApplied = false;
        setTimeout(() => { this.clearFilter(); this.applyFilter(); }, 750);
    }
    clearFilter() {
        this.states = [];
        this.classNames = null;
        this.createTime.clear();
        this.modTime.clear();
    }
    applyFilter() {
        this.currentFilterObject = new WorkflowFilter (
            this.parseStates(),
            this.classNames,
            this.getEpochTime(this.createTime.from),
            this.getEpochTime(this.createTime.to),
            this.getEpochTime(this.modTime.from),
            this.getEpochTime(this.modTime.to)
        );
        this.hideOverflow = true;
        this.openFilterMenu = false;
        this.filterApplied = this.isFiltered(this.currentFilterObject);
        this.$emit('triggerApplyFilter', this.currentFilterObject);
    }
    isFiltered(newFilter: WorkflowFilter) {
        this.currentFilters = [];
        if (newFilter.classname !== null) {
            this.currentFilters.push(['Classname', newFilter.classname]);
        }
        if (this.wfType === 'broken') {
            if (newFilter.states.length < 2) {
                this.currentFilters.push(['States', String(this.states)]);
            }
        }
        if (newFilter.createFrom > 0) {
            this.currentFilters.push(['Created from:', this.createTime.from]);
        }
        if (newFilter.createTo > 0) {
            this.currentFilters.push(['Created  up to:', this.createTime.to]);
        }
        if (newFilter.modFrom > 0) {
            this.currentFilters.push(['Modified from: ', this.modTime.from]);
        }
        if (newFilter.modTo > 0) {
            this.currentFilters.push(['Modified up to: ', this.modTime.to]);
        }
        return this.currentFilters.length > 0;
    }

    parseStates() {
        if (this.wfType === 'broken') {
            let stateArray: State[] = [];
            this.states.forEach((state) => {
                if (state === 'Error') {
                    stateArray.push(State.ERROR);
                }
                else if (state === 'Invalid') {
                    stateArray.push(State.INVALID);
                }
            });
            if (stateArray.length < 1) {
                stateArray = [State.ERROR, State.INVALID];
            }
            return stateArray;
        } else {
            return [State.WAITING];
        }
        
    }
    
    getPossibleClassNames() {
        this.jmxService.getWfRepo(this.$store.getters.engineMBeans[this.engineStatus.id].connectionSettings, this.engineStatus.wfRepoMXBean, this.$store.state.user).then((response: WorkflowRepo) => {
            this.possibleClassnames = response.workFlowInfo.map((workflow, index) => {
                return response.workFlowInfo[index].classname;
            });
        });
    }

    getEpochTime(time) {
        if (time !== null && time !== NaN) {
            let date = new Date(time);
            return date.getTime();
        } else {
            return null;
        }
    }

    sendRestartAll() {
        if (this.filterApplied === false) {
            this.$emit('triggerRestartAll');
        } else {
            this.$emit('triggerRestartFiltered', this.currentFilterObject);
        }
    }

    sendDeleteAll() {
        this.dialogDeleteOpen = false;
        this.$emit('triggerDeleteFiltered', this.filterApplied ? this.currentFilterObject : new WorkflowFilter());
    }
}