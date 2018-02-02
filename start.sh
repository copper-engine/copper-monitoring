#!/bin/bash

x=${BASH_SOURCE%/*}
if [ $1 ] && [ $1 == '--install' ]
then
    echo ""
    echo "Will install npm dependencies, build and ship gui to server and then start server"
    echo ""
    echo "---------------------------------------------------------------------------------------------"
    echo ""
    cd "${x}/client" && npm install && npm run build && npm run deploy && cd ../server && ./gradlew run
else 
    echo ""
    echo "Starting server"
    echo ""
    echo "---------------------------------------------------------------------------------------------"
    echo ""
    cd "${x}/server" && ./gradlew run
fi
