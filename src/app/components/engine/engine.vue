<script>

  import moment from 'moment';
  import { capitalize } from 'lodash';
  import engineService from '../../services/engine';

  export default {
    data() {
      return {
        isError: false,
        isLoading: true,
        details: Object,
      };
    },
    props: {
      target: Object,
    },
    computed: {
      state() {
        if (this.isError) return 'Down/Not reachable';
        else if (this.isLoading) return 'Loading...';
        return capitalize(this.details.state).replace(/_/, ' ');
      },
      runningSince() {
        return moment(this.details.runningSince).fromNow();
      },
      lastProcessing() {
        return moment(this.details.lastProcessing).fromNow();
      },
      engineId() {
        return this.details.engineId || `${this.target.host}:${this.target.port}`;
      },
    },
    mounted() {
      this.fetchData();

      setInterval(() => {
        this.fetchData();
      }, 10000);
    },
    methods: {
      fetchData() {
        engineService(this.target)
          .then((response) => {
            this.details = response;
            this.isLoading = false;
            this.isError = false;
          })
          .catch(() => {
            this.setError();
          });
      },
      setError() {
        this.isLoading = false;
        this.isError = true;
      },
    },
  };
</script>

<template>
    <div class="col-sm-12 col-md-6 col-lg-4 col-xl-3 pb-3">
        <div class="col-md-12 bg-faded rounded engine">

            <h3 class="pt-2 mb-0 pb-1 text-truncate engineId" :class="{'font-italic': isLoading || isError}" :title="engineId">{{engineId}}</h3>

            <p class="host text-muted mb-2" style="font-size: 15px;">
                <small><span style="font-weight: 500;">{{target.host}}</span><span style="margin: 1px" v-if="target.port">:</span>{{target.port}}</small>
            </p>
            <hr class="mb-0 mt-0">

            <div class="state" :class="[{error: isError, loading: isLoading}, details.state]">
                <span class="fa-stack fa-sm" style="vertical-align: top;">

                    <i v-if="isError" key="error" class="fa fa-exclamation-triangle fa-stack-1x"></i>
                    <i v-else-if="isLoading" key="error" class="fa fa-cog fa-spin fa-stack-1x"></i>
                    <i v-else-if="details.state == 'stopped'" key="normal" class="fa fa-toggle-off fa-stack-1x"></i>
                    <i v-else-if="details.state == 'started'" key="normal" class="fa fa-toggle-on fa-stack-1x"></i>
                    <i v-else-if="details.state == 'shutting_down'" key="normal" class="fa fa-hourglass fa-stack-1x"></i>
                    <i v-else-if="details.state == 'raw'" key="normal" class="fa fa-cogs fa-stack-1x fa-fw"></i>
                </span>

                <transition name="slide-fade" mode="out-in">
                    <strong class="list-inline-item text" :key="state">
                        {{state}}
                    </strong>
                </transition>
            </div>

            <hr class="mt-0 mb-0">

            <transition name="fade">
                <div v-if="!isLoading && !isError" key="display">

                    <div class="row" style="color: #636c72;">
                        <div class="col-5 pt-1 activity pr-0">
                            <small>
                                <span style="font-weight: 600;">Activity:</span>
                                <span class="instances"
                                      title="Number of workflow instances within 5 minutes">{{details.instances}}</span>
                            </small>
                        </div>
                        <div class="col-7">
                            <p class="mb-0 engine-type text-right text-muted"><!--  badge badge-pill badge-info -->
                                <span class="text-uppercase" style="letter-spacing: 1px; font-size: 11px;">
                                    {{details.type}}
                                </span>
                                <span class="fa-stack fa-sm" style="width: 1em">
                                <i v-if="details.type == 'other'" class="fa fa-question fa-stack-1x"></i>
                                <i v-if="details.type == 'persistent' || details.type == 'hybrid'" class="fa fa-database fa-stack-1x"></i>
                                <i v-if="details.type == 'transient' || details.type == 'hybrid'" class="fa fa-bolt fa-stack-1x"
                                 :class="{'fa-inverse': details.type == 'hybrid'}"></i>
                                </span>
                            </p>
                        </div>
                    </div>
                    <div class="pb-2 text-muted" style="line-height: 18px">
                        <small>
                            <span style="width: 90px; display: inline-block;">Running since:</span>
                            <span class="ts_running_since text-nowrap" :title="details.running_since">{{runningSince}}</span>
                            <br>
                            <span style="width: 90px; display: inline-block;">Last processing:</span>
                            <span class="ts_last_processing text-nowrap" :title="details.last_processing">{{lastProcessing}}</span>
                        </small>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>

<style scoped>
    .engine {
        border: 1px solid rgba(0, 0, 0, 0.15);
        min-height: 190px;
    }

    .state strong {
        font-size: 19px;
        line-height: 29px;
        font-weight: normal;
    }
    .state.started {
        color: #5cb85c;
    }

    .state.stopped,
    .state.shutting_down {
        color: #f0ad4e;
    }

    .state.error {
        color: #d9534f;
    }

    .loading {
        color: #757575;
    }

    .state.raw {
        color: #5bc0de;
    }

    .slide-fade-enter-active {
        transition: all .8s ease;
    }
    .slide-fade-leave-active {
        transition: all .3s cubic-bezier(1.0, 0.5, 0.8, 1.0);
    }
    .slide-fade-enter {
        transform: translateX(20px);
        opacity: 0;
    }
    .slide-fade-leave-to {
        transform: translateX(-10px);
        opacity: 0;
    }
    .fade-enter-active, .fade-leave-active {
        transition: opacity 1.5s
    }
    .fade-enter, .fade-leave-to {
        opacity: 0
    }
</style>
