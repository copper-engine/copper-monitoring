# copper-monitoring-gui

> Web GUI for Copper Engine

Monitoring GUI for Copper Engine is web application, that uses JMX to connect to application that use copper-engine to show current state of copper engines. Able to connect to few applications, that are in app cluster, in same time to show information about all engines. Groups engines that have same engineClusterId to engine cluster for better understanding.  

Currently provide user next features:
* Information about enginees current state
    * number of active/broken workflows
    * last activity times
    * grouping engines to engine cluster in case they have same engineClusterID

* Show list of Broken workflows(with state of ERROR or INVALID)
    * Show details(with stacktrace) of broken workflow
    * Show error and last wait Strack Traces
    * Show source code of workflow(with highliting of last waiting and error lines)
    * Open workflow in pop-up window
    * Filter workflows by class name, state or created and modification date 
    * Restart broken workflows(one, filtered or all)
    * Delete broken workflows(one, filtered or all) 

* Show list of Waiting workflows(with state of WAITING)
    * Show details(with stacktrace) of broken workflow
    * Show source code of workflow(with highlited last waiting line and error line)
    * Show last wait Strack Traces
    * Open workflow in pop-up window
    * Filter workflows by class name or created and modification date

* Show Workflow Repository info
    * Show base info about repository
    * Show list of classes with detail information
    * For Filebased repository it's possible to see:
        * Show last build results (It's helpfull in case there are some errors)
        * Show sourcecodes of classes

* Show Processor Pools
    * Show information about all processor pools
    * Alows to do actions: Resume, Suspend, Resume Deque and Suspend Deque

* Show Audit Trail
    * Showing audit trails based on users filter

* Collect and show Statistics for all engines
    * By default GUI would collect statistics per each engine every 5 seconds
    * Collected statistics can be then agregated by 5/15/30 seconds or 1/5/15 minutes
    * It's allso possible to collect and store information in Influx DB with help of telegraph
        * Copper Monitoring GUI will generate configuration settings for telegraf
        * Then it can load statistics data from Influx DB (enables user to see statistics even for period of time when GUI wasn't running)
     

App uses Vue.js with TypeScript and Vuetify as base.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:9099
# you should run server with jolokia to be able to comunicate with your cooper App(more at ../server/README.md)
# path to jolokia server you can configure at enviroment/dev.env.js -> API_NAME: '"http://localhost:8080/api/"',
npm run dev

# build for production with minification. Provide war package as well.
# package name can be changed in enviroment/prod.env.js -> PACKAGE_NAME: '"monitoring-gui"',
# IMPORTANT by default app should be runned under url: http://yourhost/monitoring-gui 
# You can change it at enviroment/prod.env.js -> ROUTING_BASE: '"/monitoring-gui/"'
# To run application as root app change ROUTING_BASE to '"/"' (ROUTING_BASE: '"/"')
npm run build

# clean the production build
npm run clean

# # lint the Typescript
# npm run lint

# # run the tests
# npm test

# # run the tests on changes
# npm run test:watch

# # run the test suite and generate a coverage report
# npm run coverage

# # run the tests on Teamcity
# npm run ci:teamcity

# # run the tests on Jenkins
# npm run ci:jenkins
```
