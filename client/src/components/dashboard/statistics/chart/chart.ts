// import VueCharts from 'vue-chartjs';
// import { Bar, mixins } from 'vue-chartjs';

// // import { Line, mixins } from 'vue-chartjs';

// export default {
//   extends: Bar,
//   mixins: [mixins.reactiveProp],
//   props: ['chartData', 'options'],
//   mounted () {
//     this.renderChart(this.chartData, this.options);
//   }
// };

import { Vue, Component} from 'vue-property-decorator';
import { VueCharts, Bar } from 'vue-chartjs';

// extends: Bar,

// Vue.component('my-chart', {
//     extends: Bar,
//     mounted () {
//       console.log('chart is rendered'); 
  
//       this.renderChart({
//         labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
//         datasets: [
//           {
//             label: 'GitHub Commits',
//             backgroundColor: '#f87979',
//             data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
//           }
//         ]
//       });
//     }
//   });


// @Component(
//     {
//     template: require('./chart.html'),
//     mixins: [VueCharts.core.default]
//     // components: {
//     //     'chartjs-line': CommitChart,
//     // }
// }
// )
// export class CommitChart extends Vue {
//     type: 'bar';
//     labels= ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
//     label = 'GitHub Commits';
//     backgroundColor = '#f87979';
//     data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11];
//     chart_data = {
//         labels: this.labels,
//         datasets: [{
//             type: 'bar',
//             label: this.label,
//             backgroundColor: this.backgroundColor,
//             borderColor: '#333',
//             borderWidth: 1,
//             data: this.data,
//         }, ],
//     };

//   mounted () {
//     console.log('chart is rendered'); 

//     // this.renderChart({
//     //   labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
//     //   datasets: [
//     //     {
//     //       label: 'GitHub Commits',
//     //       backgroundColor: '#f87979',
//     //       data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
//     //     }
//     //   ]
//     // });
//   }
// }


// @Component(
//     {
//     // template: require('./statistics.html'),
//     // components: {
//     //     'chartjs-line': CommitChart,
//     // }
// }
// )
// export class CommitChart extends Bar {
//   mounted () {
//     console.log('chart is rendered'); 

//     this.renderChart({
//       labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
//       datasets: [
//         {
//           label: 'GitHub Commits',
//           backgroundColor: '#f87979',
//           data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
//         }
//       ]
//     });
//   }
// }


// export default {
//   extends: Bar,
//   mounted () {
//     console.log('chart is rendered'); 

//     this.renderChart({
//       labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
//       datasets: [
//         {
//           label: 'GitHub Commits',
//           backgroundColor: '#f87979',
//           data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
//         }
//       ]
//     });
//   }
// };