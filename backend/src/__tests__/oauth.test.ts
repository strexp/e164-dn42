import { generateState, validateState, getOidcClient } from "../services/oauth";

jest.mock("openid-client", () => ({
  Issuer: {
    discover: jest.fn().mockResolvedValue({
      Client: class {
        constructor() {}
      },
    }),
  },
  generators: {
    state: () => "fixed-state-" + Math.random(),
    codeVerifier: () => "fixed-verifier",
    codeChallenge: () => "fixed-challenge",
  },
}));

describe("OAuth Service Coverage", () => {
  it("should cache and return OIDC client", async () => {
    const provider = {
      id: "test",
      issuerUrl: "http://test",
      clientId: "c",
      clientSecret: "s",
      name: "Test",
      asnJsonPath: "asn",
    };
    const client1 = await getOidcClient(provider);
    const client2 = await getOidcClient(provider);
    expect(client1).toBe(client2);
  });

  it("should generate and successfully validate state once", () => {
    const { state, codeChallenge } = generateState("provider1");
    expect(codeChallenge).toBe("fixed-challenge");
    const result = validateState(state);
    expect(result).toEqual({
      providerId: "provider1",
      codeVerifier: "fixed-verifier",
    });
    expect(validateState(state)).toBeNull();
  });

  it("should expire state after 10 mins", () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);
    const { state } = generateState("provider2");

    jest.spyOn(Date, "now").mockReturnValue(now + 11 * 60 * 1000);
    expect(validateState(state)).toBeNull();

    jest.restoreAllMocks();
  });
});
