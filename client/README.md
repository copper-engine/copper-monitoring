# copper-monitoring-gui

> Web GUI for Copper Engine

Monitoring GUI for Copper Engine is web application that uses JMX to connect to your copper application and show you current state of it in human friendly mode.

So far provieds you:
* information about applications current state
    * number of active/broken workflows
    * activity times
* Show list of broken workflows(with state of ERROR or INVALID)
    * Show details(with stacktrace) of broken workflow
    * Restart broken workflows(one or all)
    * Delete broken workflows(one or all) 

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
