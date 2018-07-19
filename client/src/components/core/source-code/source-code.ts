import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

import { HighlitedLine } from '../../../models/highlited-line';
import  Prism from 'prismjs';
import 'prismjs/components/prism-java.js';
import 'prismjs/themes/prism.css';

import './source-code.scss';

@Component({
    template: require('./source-code.html')
})
export class SourceCodeComponent extends Vue {
    @Prop() sourceCode: string;
    @Prop() showLineNumbers: boolean;
    @Prop() highliteLines: HighlitedLine[];

    lines: string[] = [];
    highlites: Map<number, HighlitedLine> = new Map<number, HighlitedLine>();

    mounted() {
        this.parseSourceCode();
        this.parseHighlits();
    }

    @Watch('sourceCode')
    parseSourceCode() {
        if (this.sourceCode && this.sourceCode.trim() !== 'NA') {
            let highlitedSC = Prism.highlight(this.sourceCode, Prism.languages.java);
            this.lines = highlitedSC.split('\n');
        }
    }

    @Watch('highliteLines')
    parseHighlits() {
        if (this.highliteLines) {
            this.highlites = new Map<number, HighlitedLine>();
            this.highliteLines.forEach(line => {
                this.highlites.set(line.lineNumber, line);
            });
        }
    }



}