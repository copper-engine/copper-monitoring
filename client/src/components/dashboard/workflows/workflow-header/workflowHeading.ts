import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { JmxService } from '../../../../services/jmxService';
import { WorkflowRepo, WorkflowFilter, State } from '../../../../models/engine';
import { Datetime } from 'vue-datetime';
import './workflowHeading.scss';

@Component({
    template: require('./workflowHeading.html'),
    components: {
        datetime: Datetime
    }
})
export class WorkflowHeading extends Vue {
    @Prop() engineStatus;
    @Prop() restartingAll: boolean;
    @Prop() deletingAll: boolean;
    private jmxService: JmxService = this.$services.jmxService;
    openFilterMenu: boolean = false;
    filterApplied: boolean = false;
    currentFilters: string[][] = [];
    currentFilterObject: WorkflowFilter;
    states = [];
    classNames = null;
    modTimeFromSelect = null;
    modTimeFromType = null;
    modTimeFrom = null;
    modTimeToSelect = null;
    modTimeToType = null;
    modTimeTo = null;
    createTimeFromSelect: string = null;
    createTimeFromType = null;
    createTimeFrom = null;
    createTimeToSelect = null;
    createTimeToType = null;
    createTimeTo = null;
    possibleClassnames = [];
    possibleStates = [
        'Error',
        'Invalid'
    ];


    clickedFromDate(dateTimeName) {
        // TODO today 00:00
        this[dateTimeName] = this.formatTime('201803140000', 'forSelect');
        this.emitClick(dateTimeName);
    }
    clickedToDate(dateTimeName) {
        // TODO today 23:59
        this[dateTimeName] = this.formatTime('201803142359', 'forSelect');
        this.emitClick(dateTimeName);
    }

    emitClick(dateTimeName) {
        let elem = (this as any).$refs[dateTimeName];
        let event = new Event('click');
        elem.$el.dispatchEvent(event);
        elem.open(event);
    }

    @Watch('createTimeFromSelect')
    formatCreateFromSelect() {
        if (this.createTimeFromSelect != null) {
            let time = this.createTimeFromSelect;
            this.createTimeFrom = this.formatTime(time, 'forMain');
            this.createTimeFromType = this.formatTime(time, 'forType');
        }
    }
    @Watch('createTimeFromType')
    formatCreateTimeFromType() {
        if (this.createTimeFromType != null && this.createTimeFromType.length > 11) {
            let time = this.createTimeFromType;
            this.createTimeFrom = this.formatTime(time, 'forMain');
            this.createTimeFromSelect = this.formatTime(time, 'forSelect');
        }
    }

    @Watch('createTimeToSelect')
    formatCreateToSelect() {
        if (this.createTimeToSelect != null) {
            let time = this.createTimeToSelect;
            this.createTimeTo = this.formatTime(time, 'forMain');
            this.createTimeToType = this.formatTime(time, 'forType');
        }
    }
    @Watch('createTimeToType')
    formatCreateTimeToType() {
        if (this.createTimeToType != null && this.createTimeToType.length > 11) {
            let time = this.createTimeToType;
            this.createTimeTo = this.formatTime(time, 'forMain');
            this.createTimeToSelect = this.formatTime(time, 'forSelect');
        }
    }

    @Watch('modTimeFromSelect')
    formatModFromSelect() {
        if (this.modTimeFromSelect != null) {
            let time = this.modTimeFromSelect;
            this.modTimeFrom = this.formatTime(time, 'forMain');
            this.modTimeFromType = this.formatTime(time, 'forType');
        }
    }
    @Watch('modTimeFromType')
    formatModTimeFromType() {
        if (this.modTimeFromType != null && this.modTimeFromType.length > 11) {
            let time = this.modTimeFromType;
            this.modTimeFrom = this.formatTime(time, 'forMain');
            this.modTimeFromSelect = this.formatTime(time, 'forSelect');
        }
    }

    @Watch('modTimeToSelect')
    formatModToSelect() {
        if (this.modTimeToSelect != null) {
            let time = this.modTimeToSelect;
            this.modTimeTo = this.formatTime(time, 'forMain');
            this.modTimeToType = this.formatTime(time, 'forType');
        }
    }
    @Watch('modTimeToType')
    formatModTimeToType() {
        if (this.modTimeToType != null && this.modTimeToType.length > 11) {
            let time = this.modTimeToType;
            this.modTimeTo = this.formatTime(time, 'forMain');
            this.modTimeToSelect = this.formatTime(time, 'forSelect');
        }
    }

    formatTime(time, type: string) {
        if (type === 'forMain') {
            return time.substr(0, 4) + '/' + time.substr(5, 2) + '/' + time.substr(8, 2) + ' ' + time.substr(11, 2) + ':' + time.substr(14, 2);
        }
        else if (type === 'forType') {
            return time.substr(0, 4) + time.substr(5, 2) + time.substr(8, 2) + time.substr(11, 2) + time.substr(14, 2);
        }
        else if (type === 'forSelect') {
            return time.substr(0, 4) + '-' + time.substr(4, 2) + '-' + time.substr(6, 2) + 'T' + time.substr(8, 2) + ':' + time.substr(10, 2);
        }
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
        if (this.possibleClassnames.length < 1) {
            this.getPossibleClassNames();
        }
        this.openFilterMenu = !this.openFilterMenu;
    }
    clearFilter() {
        this.states = [];
        this.classNames = null;
        this.modTimeFromType = null;
        this.modTimeFromSelect = null;
        this.modTimeFrom = null;
        this.modTimeToType = null;
        this.modTimeToSelect = null;
        this.modTimeTo = null;
        this.createTimeFromType = null;
        this.createTimeFromSelect = null;
        this.createTimeFrom = null;
        this.createTimeToType = null;
        this.createTimeToSelect = null;
        this.createTimeTo = null;
    }
    applyFilter() {   
        this.currentFilterObject = new WorkflowFilter (
            this.parseStates(),
            this.classNames,
            this.getEpochTime(this.createTimeFrom),
            this.getEpochTime(this.createTimeTo),
            this.getEpochTime(this.modTimeFrom),
            this.getEpochTime(this.modTimeTo)
        );
        this.openFilterMenu = false;
        this.filterApplied = this.isFiltered(this.currentFilterObject);
        this.$emit('triggerApplyFilter', this.currentFilterObject);
    }
    isFiltered(newFilter: WorkflowFilter) {
        this.currentFilters = [];
        if (newFilter.classname !== null) {
            this.currentFilters.push(['Classname', newFilter.classname]);
        }
        if (newFilter.states.length < 2) {
            this.currentFilters.push(['States', String(this.states)]);
        }
        if (newFilter.createFrom > 0) {
            this.currentFilters.push(['Created from:', this.createTimeFrom]);
        }
        if (newFilter.createTo > 0) {
            this.currentFilters.push(['Created  up to:', this.createTimeTo]);
        }
        if (newFilter.modFrom > 0) {
            this.currentFilters.push(['Modified from: ', this.modTimeFrom]);
        }
        if (newFilter.modTo > 0) {
            this.currentFilters.push(['Modified up to: ', this.modTimeTo]);
        }
        return this.currentFilters.length > 0;
    }

    parseStates() {
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
    }

    getPossibleClassNames() {
        this.jmxService.getWfRepo(this.$store.state.connectionSettings, this.$store.state.user).then((response: WorkflowRepo) => {
            this.possibleClassnames = response.workFlowInfo.map((workflow, index) => {
                return response.workFlowInfo[index].classname;
            });
        });
    }

    getEpochTime(time) {
        if (time != null && time !== NaN) {
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
        this.$emit('triggerDeleteFiltered', this.filterApplied ? this.currentFilterObject : new WorkflowFilter());
    }
}