# copper-monitoring
Monitoring GUI and server for COPPER

## Server
Server is simple proxy for jmx based on Jolokia and Grizly server. It uses jolokia to handle jmx calls to your copper application.

Note that your copper application should be running with turned on jmx. For example it can be runed with next parameters: 
`-Dcom.sun.management.jmxremote=true -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.port=1099 -Dcom.sun.management.jmxremote.ssl=false` 

* Securing application
    * run copper application with VM options to have secure jmx connection: 
        `-Dcom.sun.management.jmxremote=true 
        -Dcom.sun.management.jmxremote.authenticate=true 
        -Dcom.sun.management.jmxremote.port=1099 
        -Dcom.sun.management.jmxremote.ssl=true 
        -Djavax.net.ssl.keyStore={path to keystore_monitoring} 
        -Djavax.net.ssl.keyStorePassword={password} 
        -Djavax.net.ssl.trustStore={path to truststore_monitoring} 
        -Djavax.net.ssl.trustStorePassword={password}` 

   * add Enviroment variables to copper monitoring server to enable HTTPS: 
        KEYSTORE_LOC={path to keystore_monitoring}, 
        KEYSTORE_PASS={password}, 
        TRUSTSTORE_LOC={path to truststore_monitoring}, 
        TRUSTSTORE_PASS={password}, 
        HTTPS_ENABLED=true
        
    * add VM options to copper monitoring to connect to secured jmx: 
        `-Djavax.net.ssl.trustStore={path to truststore_copper_app} 
        -Djavax.net.ssl.trustStorePassword={password}`

* Securing with Docker

    * The same Env. variables and VM options are required with Docker, however they can be applied
    through a Dockerfile. Use the Dockerfile in /docker-secure. This can be done with the command
    in 'Start.cmd', './start --dockerize-secure'
    
    * Place the appropriate files ( keystore, truststore, cert, ect. ) in Server/certs, and check to
    make sure their names and locations match up with those detailed in the Dockerfile. Alter either the
    files or the Dockerfile accordingly. 

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
Linux:
* `./start.sh --install` for first use. It will install npm dependencies, build and ship gui to server
* `./start.sh` for futher usages. It will start server with GUI and Backend
* `./start.sh --prep-docker` for preparing files brfore creating docker image. It will build client & server parts
* `./start.sh --dockerize` for creating docker image. It will create a docker image of copper-monitoring

Windows:
* `./start.cmd --dockerize` for creating docker image. It will build a zipped application and store it in /docker
                            from here build the image through Docker with 'docker build -t copper-monitor'
* `./start.cmd --dockerize-secure` also for creating a docker image, however this build file enables SSL in the 
                                    image. It requires security certificated to be placed in the Server/certs
                                    folder. Stores zipped application and security files in /docker-secure.
                                    Build image with 'docker build -t copper-monitor-secure'

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
Quick creation of docker image can be done by running `./start.sh --prep-docker && ./start.sh --dockerize`
You all also can download docker image from Docker Hub: `docker pull copperengine/copper-monitoring`

## Notes for dockerized Copper Monitoring
You should bind a port of your choice 'nnnnn' to port 8080 due to internal mapping to jolokia
`docker run -p nnnn:8080 copper-monitoring`
example: `docker run -p 1234:8080 copper-monitoring`

By default, inside Container we are not able to access localhost as host. Instead, do the following:
 
Linux:
Use the ip of host in dockerland. We can get it like this: 
`docker exec -it <container_id> ip route | awk '/default/ { print $3 }'`

Windows:
Use `host.docker.internal`

We should use this IP address instead of localhost in our copper monitoring GUI.

License
-----------------
Copyright 2002-2016 Copper Engine Development Team

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

To get check licenses of other third party libraries that we use in our client part, 
you can use https://www.npmjs.com/package/license-checker or any other alternative.
For server part you can use `gradle downloadLicenses` command and then see report at
copper-monitoring/server/build/reports/license/dependency-license.html  