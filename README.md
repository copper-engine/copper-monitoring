# copper-monitoring
Monitoring GUI and server for COPPER

## Server
Server so far only simple proxy for jmx. It uses jolokia to handle jmx calls to your copper applikation.

Note that your copper application should be running with turned on jmx. For example it can be runed with next parameters: 
`-Dcom.sun.management.jmxremote=true -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.port=1099 -Dcom.sun.management.jmxremote.ssl=false)` 

## Client 

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


# Getting startted
## Using bash script
* `./start.sh --install` for first use. It will install npm dependencies, build and ship gui to jetty server and then start Jetty server with GUI and Backend
* `./start.sh` for futher usages. It will start Jetty server with GUI and Backend

##Muanual instalation and start
Preparations:

`cd client`

install dependencies for client
`npm instal`

build client gui
`npm run build`

ship client gui to jetty server
`npm run deploy`

Start jetty server with GUI and Backend
`cd ../server/copper`
`java -jar ../start.jar`


For futher uses you can just start Jetty server with GUI and Backend
`cd server/copper`
`java -jar ../start.jar`