package org.copperengine.monitoring.jmxwebproxy.security;

import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

/**
 * Map an authentication exception to an HTTP 401 response, optionally including the realm for a credentials challenge at the client.
 *
 * @author Pavel Bucek (pavel.bucek at oracle.com)
 */
@Provider
public class AuthenticationExceptionMapper implements ExceptionMapper<AuthenticationException> {

    public Response toResponse(AuthenticationException e) {
        if (e.getRealm() != null) {
            return Response
                    .status(Status.UNAUTHORIZED)
                    .header("WWW-Authenticate", "Basic realm=\"" + e.getRealm() + "\"")
                    .type("text/plain")
                    .entity(e.getMessage())
                    .build();
        } else {
            return Response
                    .status(Status.UNAUTHORIZED)
                    .type("text/plain")
                    .entity(e.getMessage())
                    .build();
        }
    }

}