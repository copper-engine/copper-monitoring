# Security Certificates

If you want to use Docker with secure connections, place your certificates here.
You will want a Key/Trust store for the Front-Back end connection, and a Truststore
that contains the certificates of your Copper application. 

Running the '--dockerize-secure' command in the 'Start.cmd' file will create
'/../docker-secure/certs' folder and copy in the files from this folder so that 
your Docker container will have access to them. The Dockerfile in that folder
will add the files to the Docker image's directory.