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


# Getting started
## Using bash script
* `./start.sh --install` for first use. It will install npm dependencies, build and ship gui to server and then start server with GUI and Backend
* `./start.sh` for futher usages. It will start server with GUI and Backend

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
Port 8080 should be binded to hosts port 8080 due to internal mapping to jolokia
`docker run -p 8080:8080 copper-monitoring`

By default, inside Container we are not able to access localhost as host so we should 
use ip of host in dockerland. We can get it like thar: 
`docker exec -it <container_id> ip route | awk '/default/ { print $3 }'`

We should use this IP address instead of localhost in our copper monitoring GUI.

