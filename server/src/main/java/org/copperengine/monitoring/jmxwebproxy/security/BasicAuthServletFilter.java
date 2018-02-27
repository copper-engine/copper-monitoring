package org.copperengine.monitoring.jmxwebproxy.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.HttpHeaders;
import javax.xml.bind.DatatypeConverter;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import static javax.ws.rs.core.Response.Status.UNAUTHORIZED;

/**
 * Simple authentication filter.
 * <p>
 * Returns response with http status 401 when proper authentication is not
 * provided in incoming request.
 */
public class BasicAuthServletFilter implements Filter {
    private static final Logger log = LoggerFactory.getLogger(BasicAuthServletFilter.class);
    private static final String ENVIRONMENT = System.getenv("ENVIRONMENT");

    private String realm;
    private Map<String, String> credentialMap = new HashMap<>();

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        this.realm = filterConfig.getInitParameter("realm");
        String auth = filterConfig.getInitParameter("auth");
        
        if (auth != null && auth.length() > 0) {
            Arrays.stream(auth.split(";")).map(entry -> entry.split(":"))
                .forEach(credentials -> {
                    if (credentials.length == 2) {
                        credentialMap.put(credentials[0], credentials[1]);
                    } else {
                        System.out.println("Found no password for " + credentials[0]);
                    }
                });
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;

        if ("DEV".equals(ENVIRONMENT)) {
            httpServletResponse.addHeader("Access-Control-Allow-Origin", "*");
        }
        if ("OPTIONS".equals(httpServletRequest.getMethod())) {
//            log.warn("Setting Access-Control-Allow headers. Consider to not use it in production.");

            httpServletResponse.addHeader("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
            httpServletResponse.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            httpServletResponse.addHeader("Access-Control-Allow-Credentials", "true");
            return;
        }

        // Extract authentication credentials
        String authentication = httpServletRequest.getHeader(HttpHeaders.AUTHORIZATION);
        if (authentication == null) {
            authError(httpServletResponse, "Authentication credentials are required");
            return;
        }
        if (!authentication.startsWith("Basic ")) {
            throw new ServletException("Only HTTP Basic authentication is supported");
        }
        authentication = authentication.substring("Basic ".length());
        String[] values = new String(DatatypeConverter.parseBase64Binary(authentication), Charset.forName("ASCII")).split(":");
        if (values.length < 2) {
            httpServletResponse.sendError(UNAUTHORIZED.getStatusCode(), "Invalid syntax for username and password");
            return;
        }
        String username = values[0];
        String password = values[1];
        if (username == null || password == null) {
            authError(httpServletResponse, "Missing username or password");
            return;
        }

        // Validate the extracted credentials
        if (!password.equals(credentialMap.get(username))) {
            authError(httpServletResponse, "Invalid username or password");
            return;
        }

        chain.doFilter(request, response);
    }

    private void authError(HttpServletResponse httpServletResponse, String msg) throws IOException {
        httpServletResponse.addHeader("WWW-Authenticate", "xBasic realm=\"" + realm + "\"");
        httpServletResponse.sendError(UNAUTHORIZED.getStatusCode(), msg);
    }


    @Override
    public void destroy() {
        // nothing to do
    }

}
