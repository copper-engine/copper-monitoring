FROM java:8u111-jre

WORKDIR /app
RUN mkdir -p /app
COPY server/build/distributions/copper-monitoring.zip /app
RUN ls
RUN unzip copper-monitoring.zip

WORKDIR /app/copper-monitoring
EXPOSE 8080

CMD ["./bin/jmxwebproxy"]