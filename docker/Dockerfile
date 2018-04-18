FROM java:8u111-jre

ARG COPPER_MONITORING_ZIP="copper-monitoring.zip"
WORKDIR /app
RUN mkdir -p /app
COPY ${COPPER_MONITORING_ZIP} /app
RUN ls
RUN unzip copper-monitoring.zip

WORKDIR /app/copper-monitoring
EXPOSE 8080
ENV JMX_AUTH "admin:admin;scoop:scoop"
ENV ENGINE_HOST "172.17.0.1"
ENV ENGINE_PORT "1099"

CMD ["./bin/jmxwebproxy"]