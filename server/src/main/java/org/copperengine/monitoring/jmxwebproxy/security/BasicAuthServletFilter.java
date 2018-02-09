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

import static javax.ws.rs.core.Response.Status.UNAUTHORIZED;

/**
 * Simple authentication filter.
 * <p>
 * Returns response with http status 401 when proper authentication is not
 * provided in incoming request.
 */
public class BasicAuthServletFilter implements Filter {
    private static final Logger log = LoggerFactory.getLogger(BasicAuthServletFilter.class);

    private String realm;
    private String fixedUsername;
    private String fixedPassword;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        this.realm = filterConfig.getInitParameter("realm");
        this.fixedUsername = filterConfig.getInitParameter("fixedUsername");
        this.fixedPassword = filterConfig.getInitParameter("fixedPassword");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;


        log.info(">>>> Method : " + httpServletRequest.getMethod());
        if ("OPTIONS".equals(httpServletRequest.getMethod())) {
    //        httpServletResponse.addHeader("Access-Control-Allow-Origin", "http://localhost:9099");
            httpServletResponse.addHeader("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
            httpServletResponse.addHeader("Access-Control-Allow-Origin", "*");
            httpServletResponse.addHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, OPTIONS");
            httpServletResponse.addHeader("Access-Control-Allow-Credentials", "true");
            httpServletResponse.addHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, X-Codingpedia");
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
        if (!username.equals(fixedUsername) || !password.equals(fixedPassword)) {
            authError(httpServletResponse, "Invalid username or password");
            return;
        }

        chain.doFilter(request, response);
    }

    private void authError(HttpServletResponse httpServletResponse, String msg) throws IOException {
        httpServletResponse.addHeader("WWW-Authenticate", "Basic realm=\"" + realm + "\"");
        httpServletResponse.sendError(UNAUTHORIZED.getStatusCode(), msg);
    }


    @Override
    public void destroy() {
        // nothing to do
    }

}
