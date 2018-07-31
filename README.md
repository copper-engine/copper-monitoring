# copper-monitoring
Monitoring GUI and server for COPPER

## Feature Overview
* Visualize overall state of your application:
* Show list of Broken workflows (with state of ERROR or INVALID) with their details 
* Show list of Waiting workflows (with state of WAITING) with their details 
* Show Workflow Repository
* Show Processor Pools
* Show Audit Trail based on users filter
* Collect and show Statistics for all engines
* Interact by deleting / restarting workflows

## Installation
Download the Copper-Monitoring source code from GitHub here:
https://github.com/copper-engine/copper-monitoring

Or pull a Docker image with:
`docker pull copperengine/copper-monitoring`

## Set up with Docker
To build and zip the source code for Docker to use, simply run the following commands:
Linux: `./start.sh --prep-docker && ./start.sh --dockerize`
Windows: `./start.cmd --dockerize`
This will build and store the zipped source code in the /docker folder.

Next, check the default Dockerfile, as you may want to chang certainer enviornmental variables such as 
which credentials are required to log into the GUI, or what the default JMX credentials are.

To create a Docker image from the zipped source code, run the following command from inside the /docker folder:
`docker build -t copper-monitoring ./`

To create a container from your image run the following command:
`docker create -p {nnnn}:8080 copper-monitoring`
Where {nnnn} is a port of your choice to forward to your container.

Alternativley, if you have pulled an image from Dockerhub, you can edit the enviornmental variables when creating a container.
A default enviornmental variable file can be found here:
https://github.com/copper-engine/copper-monitoring/tree/master/docker/env-vars/env.list
Or in the source code at docker/env-vars.

Edit the variables as you wish, and build the container with the following command:
`docker create -p {nnnn}:8080 --env-file {path to env.list} copper-monitoring`
Where {nnnn} is a port of your choice to forward to your container.

Finally run your container with your container id by:
`docker start {id}`

By default, inside Container we are not able to access localhost as host. Instead, do the following:
 
Linux:
Use the ip of host in dockerland. We can get it like this: 
`docker exec -it <container_id> ip route | awk '/default/ { print $3 }'`

Windows:
Use `host.docker.internal`

## Using scripts
Linux:
* `./start.sh --install` for first use. It will install npm dependencies, build and ship gui to server
* `./start.sh` for futher usages. It will start server with GUI and Backend
* `./start.sh --prep-docker` for preparing files brfore creating docker image. It will build client & server parts
* `./start.sh --dockerize` for creating docker image. It will create a docker image of copper-monitoring

Windows:
* `./start.cmd --install` for first use. It will install npm dependencies, build and ship gui to server
* `./start.cmd` runs the server, now the user can connect and start with the application
* `./start.cmd --dockerize` for creating docker image. It will build a zipped application and store it in /docker
                            from here build the image through Docker with 'docker build -t copper-monitor'

## Server
Server is a simple proxy for JMX based on Jolokia and Grizzly server. It uses Jolokia to handle JMX calls to your Copper Application.

Note that your Copper Application should be running with JMX and a JMX port exposed. Take the following VM parameters for example: 
`-Dcom.sun.management.jmxremote=true -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.port=1099 -Dcom.sun.management.jmxremote.ssl=false` 

If you want to protect your exposed JMX port with credentials, use this alternative option:
`-Dcom.sun.management.jmxremote.authenticate=true`
And set your desired credentials in `Java/jdk/jre/lib/management` with the `jmxremote.password` file. For more information, see:
https://docs.oracle.com/javase/8/docs/technotes/guides/management/agent.html

* Securing application with SSL
    * run copper application with VM options to have secure jmx connection: 
        `-Dcom.sun.management.jmxremote=true 
        -Dcom.sun.management.jmxremote.authenticate=true 
        -Dcom.sun.management.jmxremote.port=1099 
        -Dcom.sun.management.jmxremote.ssl=true 
        -Djavax.net.ssl.keyStore={path to keystore_monitoring} 
        -Djavax.net.ssl.keyStorePassword={password} 
        -Djavax.net.ssl.trustStore={path to truststore_monitoring} 
        -Djavax.net.ssl.trustStorePassword={password}` 

    * add VM options to copper monitoring to connect to secured jmx: 
        `-Djavax.net.ssl.trustStore={path to truststore_copper_app} 
        -Djavax.net.ssl.trustStorePassword={password}`

   * add Enviroment variables to copper monitoring server to enable HTTPS: 
        KEYSTORE_LOC={path to keystore_monitoring}, 
        KEYSTORE_PASS={password}, 
        TRUSTSTORE_LOC={path to truststore_monitoring}, 
        TRUSTSTORE_PASS={password}, 
        HTTPS_ENABLED=true

* Securing with Docker

    * The same Env. variables and VM options are required with Docker, however they can be applied
    through a Dockerfile or Enviorment Variable file. The appropriate Env. variables and other commands are commented out in the default Dockerfile and 
    also commented out in the 'env.list' file in 'docker/env-vars'.
    Uncomment them from the Dockerfile to create a new image, or build a new container from an existing image with the --env-file tag.
    
    * Place the appropriate files ( keystore, truststore, cert, ect. ) in Server/certs, and check to
    make sure their names and locations match up with those detailed in the Dockerfile / env.list file. Alter eithe accordingly. 

## Client 
The Copper Monitoring GUI is a web application that uses JMX to query real time statistics from an application using the Copper Engine.The monitoring application queries and displays this information, and offers the user some interactive functionality with the engine as well.
The application is able to connect to more than one application in an app-cluster, and show information from all engines. Engines with the same 'engineClusterId' are grouped together visually for clarity.
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
    * It's also possible to collect and store information in Influx DB with help of telegraph
        * Copper Monitoring GUI will generate configuration settings for telegraf
        * Then it can load statistics data from Influx DB (enables user to see statistics even for period of time when GUI wasn't running)

App uses Vue.js with TypeScript and Vuetify as base.

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