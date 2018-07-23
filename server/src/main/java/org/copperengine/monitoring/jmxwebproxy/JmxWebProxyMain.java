package org.copperengine.monitoring.jmxwebproxy;

import org.copperengine.monitoring.jmxwebproxy.security.BasicAuthServletFilter;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.grizzly.http.server.StaticHttpHandler;
import org.glassfish.grizzly.servlet.FilterRegistration;
import org.glassfish.grizzly.servlet.ServletRegistration;
import org.glassfish.grizzly.servlet.WebappContext;
import org.glassfish.grizzly.ssl.SSLContextConfigurator;
import org.glassfish.grizzly.ssl.SSLEngineConfigurator;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpContainer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.jolokia.http.AgentServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.bridge.SLF4JBridgeHandler;

import javax.ws.rs.core.UriBuilder;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.util.concurrent.TimeUnit;

public class JmxWebProxyMain {

    static {
        // init java.util.logging to SLF4J bridge (because Jersey uses JUL logging)
        // see https://www.slf4j.org/api/org/slf4j/bridge/SLF4JBridgeHandler.html
        SLF4JBridgeHandler.removeHandlersForRootLogger();
        SLF4JBridgeHandler.install();
    }

    private static final Logger log = LoggerFactory.getLogger(JmxWebProxyMain.class);

    /**
     * The name of the system property used to configure the monitoring port
     */
    public static final String COPPER_MONITORING_PORT = "copper.monitoring.port";

    /**
     * The names of the system enviroment variables used to configure https
     */
    private static final String KEYSTORE_LOC = "KEYSTORE_LOC";
    private static final String KEYSTORE_PASS = "KEYSTORE_PASS";
    private static final String TRUSTSTORE_LOC = "TRUSTSTORE_LOC";
    private static final String TRUSTSTORE_PASS = "TRUSTSTORE_PASS";
    private static final String HTTPS_ENABLED = "HTTPS_ENABLED";


    /**
     * The prefix of the system property names used to configure the jolokia servlet
     */
    public static final String JOLOKIA_SERVLET_PREFIX = "jolokia.servlet.";

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getProperty(COPPER_MONITORING_PORT, "8080"));
        new JmxWebProxyMain().run(port);
    }

    public void run(int port) throws IOException {
        log.info("--- Starting jmx web proxy server on http://localhost:{}/ ...", port);

        // check root dir for static resources
        File currentDir = new File(".").getCanonicalFile();
        log.info("    - starting in current directory: {}", currentDir);
        File docRoot = new File(currentDir, "static");
        if (!docRoot.exists()) {
            throw new IllegalStateException("Directory 'static' not found. Maybe you started the process from the wrong directory?!?");
        }

        boolean httpsEnabled = Boolean.parseBoolean(System.getenv(HTTPS_ENABLED));
        URI baseUri = UriBuilder.fromUri((httpsEnabled ? "https" : "http")+ "://0.0.0.0/").port(port).build();
        HttpServer server;
        // create webserver
        if (httpsEnabled) {
            SSLContextConfigurator sslCon = new SSLContextConfigurator();
            sslCon.setKeyStoreFile(System.getenv(KEYSTORE_LOC));
            sslCon.setKeyStorePass(System.getenv(KEYSTORE_PASS));

            sslCon.setTrustStoreFile(System.getenv(TRUSTSTORE_LOC));
            sslCon.setTrustStorePass(System.getenv(TRUSTSTORE_PASS));


            log.info("    - starting server in https mode");
            server = GrizzlyHttpServerFactory.createHttpServer(baseUri,(GrizzlyHttpContainer) null,
                    true, new SSLEngineConfigurator(sslCon).setClientMode(false).setNeedClientAuth(false), true);
        } else {
            log.info("    - starting server in http mode");
            server = GrizzlyHttpServerFactory.createHttpServer(baseUri);
        }

        Runtime.getRuntime().addShutdownHook(createShutdownHook(server));

        // deploy Jolokia servlet
        WebappContext jolokiaWebappContext = createJolokiaWebappContext("/api");
        jolokiaWebappContext.deploy(server);
        log.info("    - jolokia servlet deployed at /api");
        WebappContext userWebappContext = createUserWebappContext("/user");
        userWebappContext.deploy(server);
        log.info("    - user servlet deployed at /user");

        // deploy handler for static resources
        StaticHttpHandler staticResourcesHandler = new StaticHttpHandler(docRoot.getCanonicalPath());
        server.getServerConfiguration().addHttpHandler(staticResourcesHandler);
        log.info("    - serving static resources at / from directory: {}", docRoot);

        server.start();

        log.info("--- Server started.");
    }

    private WebappContext createJolokiaWebappContext(String contextPath) {
        // the following has been retrieved directly from web.xml inside jolokia.war
        // and turned into Java method calls
        WebappContext webappContext = new WebappContext("JSON JMX Agent", contextPath);

        String jolokiaServletName = "jolokia-agent";
        ServletRegistration servlet = webappContext.addServlet(jolokiaServletName, new AgentServlet());

        // Init parameters:

        // Class names (comma separated) of RequestDispatcher used in addition to the LocalRequestDispatcher
        jolokiaInit(servlet, "dispatcherClasses", "org.jolokia.jsr160.Jsr160RequestDispatcher");
        // Debugging state after startup. Can be changed via the Config MBean during runtime
        jolokiaInit(servlet, "debug", "false");
        // Entries to keep in the history. Can be changed during runtime via the config MBean
        jolokiaInit(servlet, "historyMaxEntries", "10");
        // Maximum number of entries to keed in the local debug history if switched on. Can be change via the config MBean during runtime.
        jolokiaInit(servlet, "debugMaxEntries", "100");
        // Maximum depth when traversing bean properties. If set to 0, depth checking is disabled
        jolokiaInit(servlet, "maxDepth", "15");
        // Maximum size of collections returned when serializing to JSON. When set to 0, not collections are truncated.
        jolokiaInit(servlet, "maxCollectionSize", "1000");
        // Maximum number of objects which is traversed when serializing a single response.
        // Use this as airbag to avoid boosting your memory and network traffic.
        // Nevertheless, when set to 0 not limit is used.
        jolokiaInit(servlet, "maxObjects", "0");
        // Options specific for certain application server detectors. Detectors
        // can evaluate these options and perform a specific initialization based
        // on these options. The value is a JSON object with the detector's name
        // as key and the options as value. E.g. '{glassfish: {bootAmx: false}}'
        // would prevent the booting of the AMX subsystem on a glassfish with
        // is done by default.
        jolokiaInit(servlet, "detectorOptions", "{}");
        // This option specifies in which order the key-value properties within
        // ObjectNames as returned by "list" or "search" are returned. By default
        // this is the so called 'canonical order' in which the keys are sorted
        // alphabetically. If this option is set to "false", then the natural
        // order is used, i.e. the object name as it was registered. This option
        // can be overridden with a query parameter of the same name.
        jolokiaInit(servlet, "canonicalNaming", "true");
        // Whether to include a stacktrace of an exception in case
        // of an error. By default it it set to "true" in which case
        // the stacktrace is always included. If set to "false", no
        // stacktrace is included. If the value is "runtime" a stacktrace
        // is only included for RuntimeExceptions. This global option
        // can be overridden with a query parameter.
        jolokiaInit(servlet, "includeStackTrace", "true");
        // When this parameter is set to "true", then an exception thrown
        // will be serialized as JSON and included in the response
        // under the key "error_value". By default it is "false". This global
        // option can be overridden by a query parameter of the same name.
        jolokiaInit(servlet, "serializeException", "false");
        // If discoveryEnabled is set to true, then this servlet will listen
        // for multicast discovery request and responds with its agent URL and
        // other server specific information. Instead of setting this confog variable,
        // discovery can be also enabled via the system property "jolokia.discoveryEnabled"
        // or the environment variable "JOLOKIA_DISCOVERY_ENABLED".
        // In addition the config parameter "discoveryAgentUrl" can be used to set the the agent's URL.
        // By default, auto detection (after the first request was processed by the servlet)) of the URL is used.
        // If the URL is set, then discovery is automatically enabled (i.e. there is
        // no need to set "discoveryEnabled=true"). This configuration option
        // is especially useful if the WAR is used in a proxy setup. Instead of setting the URL
        // here, it can be set also either via the system property "jolokia.discoveryAgentUrl" or the
        // environment variable "JOLOKIA_DISCOVERY_AGENT_URL".
        jolokiaInit(servlet, "discoveryEnabled", "false");

        servlet.setLoadOnStartup(1);

        servlet.addMapping("/*");

        // add basic auth filter for this Jolokia servlet
        FilterRegistration authFilter = webappContext.addFilter("authFilter", new BasicAuthServletFilter());
        authFilter.setInitParameter("realm", "Jolokia JMW Web Proxy");
        String auth = System.getenv("MONITORING_AUTH");
        if (auth == null || auth.length() == 0) {
            log.warn("No authentication credentials were set. Check if environment variable MONITORING_AUTH is set correct.");
            auth = "";
        }
        authFilter.setInitParameter("auth", auth);
        authFilter.addMappingForServletNames(null, jolokiaServletName);

        return webappContext;
    }

    private WebappContext createUserWebappContext(String contextPath) {
        WebappContext webappContext = new WebappContext("user Agent", contextPath);

        String servletName = "user-agent";
        ServletRegistration servlet = webappContext.addServlet(servletName, new UserServlet());
        servlet.setInitParameter("debug", "false");
        servlet.setLoadOnStartup(1);

        servlet.addMapping("/*");

        // add basic auth filter for this Jolokia servlet
        FilterRegistration authFilter = webappContext.addFilter("authFilter", new BasicAuthServletFilter());
        authFilter.setInitParameter("realm", "Jolokia JMW Web Proxy");
        String auth = System.getenv("MONITORING_AUTH");
        if (auth == null || auth.length() == 0) {
            log.warn("No authentication credentials were set. Check if environment variable MONITORING_AUTH is set correct.");
            auth = "";
        }
        authFilter.setInitParameter("auth", auth);
        authFilter.addMappingForServletNames(null, servletName);

        return webappContext;
    }

    private Thread createShutdownHook(HttpServer server) {
        return new Thread("main server shutdown hook") {
            @Override
            public void run() {
                server.shutdown(30L, TimeUnit.SECONDS);
                log.info("--- Server stopped.");
            }
        };
    }

    private static String jolokiaInit(ServletRegistration servlet, String parameter, String defaultValue) {
        String value = System.getProperty(JOLOKIA_SERVLET_PREFIX + parameter, defaultValue);
        servlet.setInitParameter(parameter, value);
        return value;
    }
}