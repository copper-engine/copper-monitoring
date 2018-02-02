FROM jetty

WORKDIR /copper-monitoring
ADD copper /copper-monitoring/

EXPOSE 8080

USER jetty
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["java","-jar","/usr/local/jetty/start.jar"]