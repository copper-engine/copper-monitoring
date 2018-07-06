FROM java:8u111-jre

RUN mkdir -p /app
WORKDIR /app

ARG COPPER_MONITORING_ZIP="copper-monitoring.zip"
ADD $COPPER_MONITORING_ZIP /app/copper-monitoring.zip

RUN unzip copper-monitoring.zip

WORKDIR /app/copper-monitoring/bin
EXPOSE 8080
ENV JMX_AUTH "admin:admin;scoop:scoop"
ENV ENGINE_HOST "172.17.0.1"
ENV ENGINE_PORT "1099"

CMD ["./jmxwebproxy"]
