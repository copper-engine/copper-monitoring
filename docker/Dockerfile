FROM java:8u111-jre

RUN mkdir -p /app
# RUN mkdir -p /app/certs
WORKDIR /app

ARG COPPER_MONITORING_ZIP="copper-monitoring.zip"
ADD $COPPER_MONITORING_ZIP /app/copper-monitoring.zip

RUN unzip copper-monitoring.zip

WORKDIR /app/copper-monitoring/bin
EXPOSE 8080
ENV MONITORING_AUTH "admin:admin;scoop:scoop"
ENV JMX_HOST "172.17.0.1"
ENV JMX_PORT "1099"
ENV JMX_USERNAME "copper"
ENV JMX_PASS "copper"

# Example of setting https and connecting to secured jmx. Make sure you have your certs in docker foulder
# ENV KEYSTORE_LOC "/app/certs/keystore"
# ENV KEYSTORE_PASS "copper"
# ENV TRUSTSTORE_LOC "/app/certs/truststore"
# ENV TRUSTSTORE_PASS "copper"
# ENV HTTPS_ENABLED "true"

# ENV JMXWEBPROXY_OPTS "-Djavax.net.ssl.trustStore=/app/certs/app_truststore -Djavax.net.ssl.trustStorePassword=copper"

CMD ["./jmxwebproxy"]
