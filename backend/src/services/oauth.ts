import { Issuer, BaseClient, generators } from "openid-client";
import { OAuthProvider } from "../types";

const stateStore: Map<
  string,
  { providerId: string; codeVerifier: string; timestamp: number }
> = new Map();
const clients: Map<string, BaseClient> = new Map();

export async function getOidcClient(
  provider: OAuthProvider,
): Promise<BaseClient> {
  if (clients.has(provider.id)) {
    return clients.get(provider.id)!;
  }

  const issuer = await Issuer.discover(provider.issuerUrl);
  const client = new issuer.Client({
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_post",
  });

  clients.set(provider.id, client);
  return client;
}

export function generateState(providerId: string): {
  state: string;
  codeChallenge: string;
} {
  const state = generators.state();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  stateStore.set(state, { providerId, codeVerifier, timestamp: Date.now() });
  return { state, codeChallenge };
}

export function validateState(
  state: string,
): { providerId: string; codeVerifier: string } | null {
  const data = stateStore.get(state);
  if (!data) return null;

  const isExpired = Date.now() - data.timestamp > 10 * 60 * 1000;
  stateStore.delete(state);

  if (isExpired) {
    return null;
  }

  return { providerId: data.providerId, codeVerifier: data.codeVerifier };
}
