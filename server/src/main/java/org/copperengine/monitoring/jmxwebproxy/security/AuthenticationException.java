package org.copperengine.monitoring.jmxwebproxy.security;

/**
 * A runtime exception representing a failure to provide correct authentication credentials.
 *
 * @author Pavel Bucek (pavel.bucek at oracle.com)
 */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message, String realm) {
        super(message);
        this.realm = realm;
    }

    private String realm = null;

    public String getRealm() {
        return this.realm;
    }

}