#!/bin/bash

x=${BASH_SOURCE%/*}
if [ $1 ] && [ $1 == '--install' ]
then
    echo ""
    echo "Will install npm dependencies, build and ship gui to jetty server and then start Jetty server"
    echo ""
    echo "---------------------------------------------------------------------------------------------"
    echo ""
    cd "${x}/client" && npm install && npm run build && npm run deploy && cd ../server/copper && java -jar ../start.jar
else 
    echo ""
    echo "Starting Jetty server"
    echo ""
    echo "---------------------------------------------------------------------------------------------"
    echo ""
    cd "${x}/server/copper" && java -jar ../start.jar
fi
