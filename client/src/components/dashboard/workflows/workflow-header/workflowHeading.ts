import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { JmxService } from '../../../../services/jmxService';
import { WorkflowRepo } from '../../../../models/engine';
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
    classNames = [];
    modTimeFromInput = '';
    modTimeToInput = '';
    createTimeFromInput = '';
    createTimeToInput = '';
    possibleClassnames = [];    
    possibleStates = [
        'Error',
        'Invalid'
    ];

    get createTimeFrom() {
        let time = this.createTimeFromInput;
        let formattedTime = time.substr(0, 4) + time.substr(5, 2) + time.substr(8, 2) + time.substr(11, 2) + time.substr(14, 2);
        return formattedTime;
    }
    get createTimeTo() {
        let time = this.createTimeToInput;
        let formattedTime = time.substr(0, 4) + time.substr(5, 2) + time.substr(8, 2) + time.substr(11, 2) + time.substr(14, 2);
        return formattedTime;
    }
    get modTimeFrom() {
        let time = this.modTimeFromInput;
        let formattedTime = time.substr(0, 4) + time.substr(5, 2) + time.substr(8, 2) + time.substr(11, 2) + time.substr(14, 2);
        return formattedTime;
    }
    get modTimeTo() {
        let time = this.modTimeToInput;
        let formattedTime = time.substr(0, 4) + time.substr(5, 2) + time.substr(8, 2) + time.substr(11, 2) + time.substr(14, 2);
        return formattedTime;
    }


    triggerFilterMenu() {
        if (this.possibleClassnames.length < 1) {
            this.getPossibleClassNames();
        }
        this.openFilterMenu = !this.openFilterMenu;
    }
    clearFilter() { 
        this.states = [];
        this.classNames = [];
        this.modTimeFromInput = '';
        this.modTimeToInput = '';
        this.createTimeFromInput = '';
        this.createTimeToInput = '';
    }
    applyFilter() {
        console.log('S T A T E S');
        console.log(this.states);
        console.log('C L A S S  N A M E S');
        console.log(this.classNames);
        console.log('M O D  T I M E');
        console.log(this.getEpochTime(this.modTimeFromInput) + ' to ' + this.getEpochTime(this.modTimeToInput));
        console.log('C R E A T E  T I M E');
        console.log(this.createTimeFrom + ' to ' + this.createTimeTo);        
    }
    getPossibleClassNames() {
        this.jmxService.getWfRepo(this.$store.state.connectionSettings, this.$store.state.user).then((response: WorkflowRepo) => {
            this.possibleClassnames = response.workFlowInfo.map((workflow, index) => {
                return response.workFlowInfo[index].classname;
            });
        });
    }
    getEpochTime(time) {
        let date = new Date(time);
        return date.getTime();
    }

    sendRestartAll() {
        this.$emit('triggerRestartAll');
    }

    sendDeleteAll() {
        this.$emit('triggerDeleteAll');
    }
}