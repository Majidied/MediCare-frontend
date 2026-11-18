import Keycloak from 'keycloak-js';

const KEYCLOAK_URL =
  (process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_URL !== "undefined")
    ? process.env.NEXT_PUBLIC_KEYCLOAK_URL
    : 'http://localhost:8180'

const KEYCLOAK_REALM =
  (process.env.NEXT_PUBLIC_KEYCLOAK_REALM && process.env.NEXT_PUBLIC_KEYCLOAK_REALM !== "undefined")
    ? process.env.NEXT_PUBLIC_KEYCLOAK_REALM
    : 'cabinetX-microservice-realm'

const KEYCLOAK_CLIENT_ID =
  (process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID && process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID !== "undefined")
    ? process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
    : 'cabinetx-client'

const keycloakConfig = {
  url: KEYCLOAK_URL,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_CLIENT_ID,
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;