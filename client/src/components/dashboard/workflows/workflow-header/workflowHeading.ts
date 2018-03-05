import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { JmxService } from '../../../../services/jmxService';
import { WorkflowRepo, WorkflowFilter, State } from '../../../../models/engine';
import { Datetime } from 'vue-datetime';

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
    states = [];
    classNames = null;
    modTimeFromInput = null;
    modTimeToInput = null;
    createTimeFromInput = null;
    createTimeToInput = null;
    possibleClassnames = [];    
    possibleStates = [
        'Error',
        'Invalid'
    ];

    get createTimeFrom() {
        return this.formatTime(this.createTimeFromInput);
    }
    get createTimeTo() {
        return this.formatTime(this.createTimeToInput);
    }
    get modTimeFrom() {
        return this.formatTime(this.modTimeFromInput);
    }
    get modTimeTo() {
        return this.formatTime(this.modTimeToInput);
    }

    formatTime(time) {
        if (time != null) {
            return  time.substr(0, 4) + time.substr(5, 2) + time.substr(8, 2) + time.substr(11, 2) + time.substr(14, 2);
        } else {
            return null;
        }
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
        this.modTimeFromInput = null;
        this.modTimeToInput = null;
        this.createTimeFromInput = null;
        this.createTimeToInput = null;
    }
    applyFilter() {
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
        let newFilter = new WorkflowFilter (
            stateArray,
            this.classNames,
            this.getEpochTime(this.createTimeFromInput),
            this.getEpochTime(this.createTimeToInput),
            this.getEpochTime(this.modTimeFromInput),
            this.getEpochTime(this.modTimeToInput)
        );
        this.$emit('triggerApplyFilter', newFilter);
    }
    getPossibleClassNames() {
        this.jmxService.getWfRepo(this.$store.state.connectionSettings, this.$store.state.user).then((response: WorkflowRepo) => {
            this.possibleClassnames = response.workFlowInfo.map((workflow, index) => {
                return response.workFlowInfo[index].classname;
            });
        });
    }
    getEpochTime(time) {
        if (time != null) {
            let date = new Date(time);
            return date.getTime();
        } else {
            return null;
        }
    }

    sendRestartAll() {
        this.$emit('triggerRestartAll');
    }

    sendDeleteAll() {
        this.$emit('triggerDeleteAll');
    }
}