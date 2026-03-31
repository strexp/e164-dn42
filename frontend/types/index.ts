// frontend/types/index.ts
export interface User {
  asn: string;
  prefix: string;
  e164Zone: string;
  email?: string;
}

export interface NSConfig {
  enabled: boolean;
  servers: string[];
}

export interface PhoneEntry {
  id: number;
  number: string;
  name: string;
}

export interface PublicEntry {
  asn: string;
  number: string;
  name: string;
}

export interface Participant {
  asn: string;
  prefix: string;
}

export interface AuthProvider {
  id: string;
  name: string;
}

declare module '#app' {
  interface NuxtApp {
    $api: (url: string, options?: any) => Promise<any>;
  }
}
