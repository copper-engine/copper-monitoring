package org.copperengine.monitoring.jmxwebproxy;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.*;
import java.io.IOException;

public class UserServlet extends HttpServlet {
    private static final Logger log = LoggerFactory.getLogger(UserServlet.class);
    private static String JMX_HOST = System.getenv("JMX_HOST");
    private static String JMX_PORT = System.getenv("JMX_PORT");
    private static String JMX_USERNAME = System.getenv("JMX_USERNAME");
    private static String JMX_PASS = System.getenv("JMX_PASS");
    private static String INFLUX_URL = System.getenv("INFLUX_URL");
    private static String INFLUX_USERNAME = System.getenv("INFLUX_USERNAME");
    private static String INFLUX_PASSWORD = System.getenv("INFLUX_PASSWORD");


    static {
        if (JMX_HOST == null || JMX_HOST.trim().length() == 0) {
            JMX_HOST = "localhost";
        }

        if (JMX_PORT == null || JMX_PORT.trim().length() == 0) {
            JMX_PORT = "1099";
        }
    }

    // Return user settings
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("{ ");
        jsonBuilder.append("\"host\": ");
        jsonBuilder.append("\"" + JMX_HOST + "\"");
        jsonBuilder.append(", ");
        jsonBuilder.append("\"port\": ");
        jsonBuilder.append("\"" + JMX_PORT +"\" ");
        jsonBuilder.append(", ");
        jsonBuilder.append("\"jmxUsername\": ");
        jsonBuilder.append("\"" + JMX_USERNAME +"\" ");
        jsonBuilder.append(", ");
        jsonBuilder.append("\"jmxPassword\": ");
        jsonBuilder.append("\"" + JMX_PASS +"\" ");
        jsonBuilder.append(", ");
        jsonBuilder.append("\"influxURL\": ");
        jsonBuilder.append("\"" + INFLUX_URL +"\" ");
        jsonBuilder.append(", ");
        jsonBuilder.append("\"influxUsername\": ");
        jsonBuilder.append("\"" + INFLUX_USERNAME +"\" ");
        jsonBuilder.append(", ");
        jsonBuilder.append("\"influxPassword\": ");
        jsonBuilder.append("\"" + INFLUX_PASSWORD +"\" ");
        jsonBuilder.append(" }");

        response.getWriter().println(jsonBuilder.toString());
    }
}
