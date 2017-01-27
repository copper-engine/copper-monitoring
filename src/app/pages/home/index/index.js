/* ============
 * Home Index Page
 * ============
 *
 * The home index page
 */

import Axios from 'axios';

export default {
  components: {
    VLayout: require('layouts/default/default.vue'),
    VPanel: require('components/panel/panel.vue'),
    VEngine: require('components/engine/engine.vue'),
  },
  data: function () {
    return {
      engines: []
    };
  },
  mounted() {
    this.fetchEngines();
  },
  methods: {
    fetchEngines() {
      Axios.get('/static/engines.json')
        .then((response) => {
          this.$set(this, 'engines', response.data.engines);
        })
        .catch((error) => {
          console.log('TODO: error handling!!');
          console.log(error);
        });
    }
  }
};
