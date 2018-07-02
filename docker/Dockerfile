FROM java:8u111-jre

RUN mkdir -p /app
WORKDIR /app

ARG COPPER_MONITORING_ZIP="copper-monitoring.zip"
ADD $COPPER_MONITORING_ZIP /app/copper-monitoring.zip

RUN unzip copper-monitoring.zip

WORKDIR /app/copper-monitoring
EXPOSE 8080
ENV MONITORING_AUTH "admin:admin;scoop:scoop"
ENV JMX_HOST "172.17.0.1"
ENV JMX_PORT "1099"
ENV JMX_USERNAME ""
ENV JMX_PASS ""

CMD [ "./bin/jmxwebproxy" ]
