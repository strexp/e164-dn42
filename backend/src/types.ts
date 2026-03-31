export interface Config {
  server: {
    host: string,
    port: number;
    jwtSecret: string;
    frontendUrl: string;
  };
  dns: {
    zoneFilePath: string;
    soa: {
      ns: string;
      email: string;
    };
    maxNsServers: number;
  };
  oauth: OAuthProvider[];
}

export interface OAuthProvider {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  asnJsonPath: string;
}

export interface User {
  asn: string;
  enabled: boolean;
  created_at: string;
}

export interface NSServer {
  id: number;
  asn: string;
  server: string;
}

export interface PhonebookEntry {
  id: number;
  asn: string;
  number: string;
  name: string;
}

export interface JwtPayload {
  asn: string;
  iat?: number;
  exp?: number;
}

export interface E164Info {
  asn: string;
  prefix: string;
  e164Zone: string;
}
