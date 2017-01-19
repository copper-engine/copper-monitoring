<script>

  import moment from 'moment';
  import { capitalize } from 'lodash';

  export default {
    props: {
      data: Object,
      currentPage: {
        type: Number,
        default: 1,
      },
    },
    computed: {
      state() {
        if (this.data.state === 'unknown') return 'Down/Not reachable';
        return capitalize(this.data.state);
      },
      runningSince() {
        return moment(this.data.running_since).fromNow();
      },
      lastProcessing() {
        return moment(this.data.last_processing).fromNow();
      },
    },
    methods: {
      navigatePrevious() {
        if (!this.isFirst) {
          this.dispatch(this.currentPage - 1);
        }
      },
    },
  };
</script>

<template>
    <div class="col-sm-12 col-md-6 col-lg-4 col-xl-3 pb-3">
        <div class="col-md-12 bg-faded rounded"
             style="border: 1px solid rgba(0, 0, 0, 0.15);">

            <h3 class="pt-2 mb-0 pb-1 text-truncate" :title="data.host">{{data.host}}</h3>

            <p class="uuid text-muted text-nowrap mb-2" style="font-size: 15px;"><small>{{data.uuid}}</small></p>
            <hr class="mb-0 mt-0">
            <div class="state" :class="data.state">
              <span class="fa-stack fa-sm" style="vertical-align: top;">
                <!--i class="fa fa-power-off fa-stack-1x"></i-->
                <i v-if="data.state == 'unknown'" class="fa fa-exclamation-triangle fa-stack-1x"></i>
                <i v-if="data.state == 'stopped'" class="fa fa-toggle-off fa-stack-1x"></i>
                <i v-if="data.state == 'started'" class="fa fa-toggle-on fa-stack-1x"></i>
              </span>
                <span style="font-size: 19px; line-height: 29px;">{{state}}</span>
            </div>

            <hr class="mt-0 mb-0">

            <div class="row" style="color: #636c72;">
                <div class="col-5 pt-1 activity pr-0"><small>
                    <span style="font-weight: 600;">Activity:</span>
                    <span class="instances"
                          title="Number of workflow instances within 5 minutes">{{data.instances}}</span>
                    </small>
                </div>
                <div class="col-7">
                    <p class="mb-0 engine-type text-right text-muted"><!--  badge badge-pill badge-info -->
                <span class="text-uppercase" style="letter-spacing: 1px; font-size: 11px;">
                {{data.type}}
                </span>
                        <span class="fa-stack fa-sm" style="width: 1em">
                  <i v-if="data.type == 'persistent' || data.type == 'hybrid'" class="fa fa-database fa-stack-1x"></i>
                  <i v-if="data.type == 'transient' || data.type == 'hybrid'" class="fa fa-bolt fa-stack-1x"
                     :class="{'fa-inverse': data.type == 'hybrid'}"></i>
                </span>
                    </p>
                </div>
            </div>
            <div class="pb-2 text-muted" style="line-height: 18px"><small>
                <span style="width: 90px; display: inline-block;">Running since:</span>
                <span class="ts_running_since" :title="data.running_since">{{runningSince}}</span>
                <br>
                <span style="width: 90px; display: inline-block;">Last processing:</span>
                <span class="ts_last_processing" :title="data.last_processing">{{lastProcessing}}</span>
                </small>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .state.started {
        color: #5cb85c;
    }

    .state.stopped {
        color: #f0ad4e;
    }

    .state.unknown {
        color: #d9534f;
    }
</style>
