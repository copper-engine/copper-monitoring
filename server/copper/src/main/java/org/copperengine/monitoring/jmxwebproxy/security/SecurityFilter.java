package org.copperengine.monitoring.jmxwebproxy.security;

import javax.inject.Inject;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.PreMatching;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.ext.Provider;
import javax.xml.bind.DatatypeConverter;
import java.nio.charset.Charset;
import java.security.Principal;

/**
 * Simple authentication filter.
 * <p>
 * Returns response with http status 401 when proper authentication is not provided in incoming request.
 *
 * @author Pavel Bucek (pavel.bucek at oracle.com)
 * @see <a href="https://github.com/jersey/jersey/blob/master/examples/https-clientserver-grizzly/src/main/java/org/glassfish/jersey/examples/httpsclientservergrizzly/SecurityFilter.java">Grizzly2/Jersey httpsclientservergrizzly demo</a>
 */
@Provider
@PreMatching
public class SecurityFilter implements ContainerRequestFilter {

    @Inject
    public javax.inject.Provider<UriInfo> uriInfo;

    private final String realm;
    private final String fixedUsername;
    private final String fixedPassword;
    private final String fixedRole;

    public SecurityFilter(String realm, String fixedUsername, String fixedPassword, String fixedRole) {
        this.realm = realm;
        this.fixedUsername = fixedUsername;
        this.fixedPassword = fixedPassword;
        this.fixedRole = fixedRole;
    }

    @Override
    public void filter(ContainerRequestContext filterContext) {
        User user = authenticate(filterContext);
        boolean isSecure = "https".equals(uriInfo.get().getRequestUri().getScheme());
        filterContext.setSecurityContext(new Authorizer(user, isSecure));
    }

    private User authenticate(ContainerRequestContext filterContext) {
        // Extract authentication credentials
        String authentication = filterContext.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (authentication == null) {
            throw new AuthenticationException("Authentication credentials are required", realm);
        }
        if (!authentication.startsWith("Basic ")) {
            throw new AuthenticationException("Only HTTP Basic authentication is supported", realm);
        }
        authentication = authentication.substring("Basic ".length());
        String[] values = new String(DatatypeConverter.parseBase64Binary(authentication), Charset.forName("ASCII")).split(":");
        if (values.length < 2) {
            throw new WebApplicationException("Invalid syntax for username and password", Response.Status.BAD_REQUEST);
            //
        }
        String username = values[0];
        String password = values[1];
        if ((username == null) || (password == null)) {
            throw new WebApplicationException("Missing username or password", Response.Status.BAD_REQUEST);
        }

        // Validate the extracted credentials
        User user;

        if (username.equals(fixedUsername) && password.equals(fixedPassword)) {
            user = new User(username, fixedRole);
        } else {
            throw new AuthenticationException("Invalid username or password", realm);
        }
        return user;
    }

    public class Authorizer implements SecurityContext {
        private final User user;
        private final Principal principal;
        private final boolean isSecure;

        Authorizer(final User user, boolean isSecure) {
            this.user = user;
            this.principal = () -> user.username;
            this.isSecure = isSecure;
        }

        public Principal getUserPrincipal() {
            return this.principal;
        }

        public boolean isUserInRole(String role) {
            return (role.equals(user.role));
        }

        public boolean isSecure() {
            return isSecure;
        }

        public String getAuthenticationScheme() {
            return SecurityContext.BASIC_AUTH;
        }
    }

    public class User {
        public final String username;
        public final String role;

        User(String username, String role) {
            this.username = username;
            this.role = role;
        }
    }
}