#!/bin/bash

PATH_TO_SCRIPT=${BASH_SOURCE%/*}
if [ -z $1 ]
then
    echo ""
    echo "Starting server"
    echo ""
    echo "---------------------------------------------------------------------------------------------"
    echo ""
    cd "${PATH_TO_SCRIPT}/server" && ./gradlew run
elif [ $1 == '--install' ]
then
    echo ""
    echo "Will install npm dependencies, build and ship gui to server and then start server"
    echo ""
    echo "---------------------------------------------------------------------------------------------"
    echo ""
    cd "${PATH_TO_SCRIPT}/client" && npm install && npm run build && npm run deploy
elif [ $1 == '--prep-docker' ]
then
    echo ""
    echo "Will prepare files for docker image copper-monitoring"
    echo ""
    echo "---------------------------------------------------------------------------------------------"
    echo ""
    cd "${PATH_TO_SCRIPT}/client" && npm install && npm run build && npm run deploy && cd ../server && ./gradlew distZip && cp build/distributions/copper-monitoring.zip ../docker/
elif [ $1 == '--dockerize' ]
then
    echo ""
    echo "Will create docker image copper-monitoring from prepared files"
    echo ""
    echo "---------------------------------------------------------------------------------------------"
    echo ""
    cd ""${PATH_TO_SCRIPT}/docker" && docker build -t copper-monitoring .
else 
    echo ""
    echo "Script usage:"
    echo "Run without arguments to start copper monitoring. Will not fetch laters client changes."
    echo "      P.S: use after you runned script with --install parameter."
    echo "--install   : will build client and copy it to server part as a preparation to run the copper-monitoring"
    echo "--prep-docker : will build client & server parts and will prepare files for docker image of copper-monitoring"
    echo "--dockerize : will create docker image of copper-monitoring"
fi
