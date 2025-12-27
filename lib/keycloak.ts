import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://3.84.72.92:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'cabinetX-microservice-realm',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'cabinetx-client',
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;