# copper-monitoring
Monitoring GUI and server for COPPER

## Server
Server is simple proxy for jmx based on Jolokia and Grizly server. It uses jolokia to handle jmx calls to your copper application.

Note that your copper application should be running with turned on jmx. For example it can be runed with next parameters: 
`-Dcom.sun.management.jmxremote=true -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.port=1099 -Dcom.sun.management.jmxremote.ssl=false` 

## Client 

Monitoring GUI for Copper Engine is web application, that uses JMX to connect to application that use copper-engine to show current state of copper engines. Able to connect to few applications, that are in app cluster, in same time to show information about all engines. Groups engines that have same engineClusterId to engine cluster for better understanding.  

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


# Getting started
## Using bash script
* `./start.sh --install` for first use. It will install npm dependencies, build and ship gui to server
* `./start.sh` for futher usages. It will start server with GUI and Backend
* `./start.sh --prep-docker` for preparing files brfore creating docker image. It will build client & server parts
* `./start.sh --dockerize` for creating docker image. It will createa docker image of copper-monitoring

## Manual instalation and start
Preparations:

`cd client`

Install dependencies for client: `npm install`

Build client gui: `npm run build`

Ship client gui to server: `npm run deploy`

Start server with GUI and Backend:
```
cd ../server
./gradlew run
```

For futher uses you can just start server with GUI and Backend:
```
cd server
./gradlew run
```


# Copper Monitoring With Docker
Quick creation of docker image can be done by running `./start.sh --dockerize`

## Notes for dockerized Copper Monitoring
Port 8080 should be binded to hosts port 8080 due to internal mapping to jolokia
`docker run -p 8080:8080 copper-monitoring`

By default, inside Container we are not able to access localhost as host so we should 
use ip of host in dockerland. We can get it like thar: 
`docker exec -it <container_id> ip route | awk '/default/ { print $3 }'`

We should use this IP address instead of localhost in our copper monitoring GUI.



