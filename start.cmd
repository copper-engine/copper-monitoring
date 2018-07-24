@ECHO OFF
IF "%1" == "" (
    ECHO Starting Server
    cd "%~dp0"/server
    call gradlew.bat
)
IF "%1" == "--install" (
    ECHO Will install npm dependencies, build and ship gui to server, and then start server
    cd "%~dp0"/client
    npm install && npm run build && npm run deploy-win
    pause
)
IF "%1" == "--dockerize" (
    ECHO Will create docker image copper-monitoring
    cd "%~dp0"/client
    npm install && npm run build && npm run deploy-win
    cd ../Server
    call gradlew.bat distZip && robocopy ./build/distributions ../docker copper-monitoring.zip
    pause
)
IF "%1" == "--help" (
    ECHO Script usage:
    ECHO Run without arguments to start copper monitoring. Will not fetch future client changes.
    ECHO       P.S: use after you run the script with the --install parameter.
    ECHO --install   : will build client and copy it to server as preparation to run the copper-monitoring
    ECHO --dockerize : will build client and server parts and will prepare a docker image of copper-monitoring
)
pause