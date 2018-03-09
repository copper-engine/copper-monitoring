import { Vue, Component} from 'vue-property-decorator';
import './homepage.scss';

@Component({
    template: require('./homepage.html')
})

export class HomePage extends Vue {

}