import { Component, Vue, Watch } from 'vue-property-decorator';
import './auditTrail.scss';
import { JmxService } from '../../../services/jmxService';
import { MBean } from '../../../models/mbeans';
import { AuditTrailInstanceFilter } from '../../../models/auditTrail';

@Component({
    template: require('./auditTrail.html'),
    services: ['jmxService'],
    components: {
    }
})
export class AuditTrailComponent extends Vue {
    public wfRepo = [];
    private jmxService: JmxService = this.$services.jmxService;
    public mbeans: MBean[] = null;


    mounted() {
        this.mbeans = this.$store.getters.auditTrailMBeans;
        console.log('audit Trail MBeans', this.mbeans );
        this.getAuditTrails(new AuditTrailInstanceFilter(null, null, null, null, 20, 20));
        this.countAuditTrails(new AuditTrailInstanceFilter(null, null, null, null, 0, 0));
    }
    
    getAuditTrails(auditTrailFilter: AuditTrailInstanceFilter) {
        // change this.mbeans[0]
        this.jmxService.getAuditTrails(this.mbeans[0], this.$store.state.user, auditTrailFilter)
            .then(result => {
                console.log('result of audit trail', result);

                if (result && result.length > 0) {
                    this.getAuditMessage(result[0].id);
                }
            }).catch(error => {
                console.error('Error getting audit trail', error);
            });
    }

    countAuditTrails(auditTrailFilter: AuditTrailInstanceFilter) {
        // change this.mbeans[0]
        this.jmxService.countAuditTrails(this.mbeans[0], this.$store.state.user, auditTrailFilter)
            .then(result => {
                console.log('result of counting audit trail', result);
            }).catch(error => {
                console.error('Error getting audit trail', error);
            });
    }

    getAuditMessage(id: number) {
        this.jmxService.getAuditTrailMessage(this.mbeans[0], this.$store.state.user, id).then(result => {
            console.log('getting message for audit trail', result);
        }).catch(error => {
            console.error('Error getting audit trail', error);
        });
    }

}