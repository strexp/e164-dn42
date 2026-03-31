import request from "supertest";
import { app } from "../server";
import { loadConfig } from "../config";
import { getDatabase, initDatabase, closeDatabase } from "../db";
import * as oauthService from "../services/oauth";

jest.mock("../services/oauth", () => {
  const original = jest.requireActual("../services/oauth");
  return {
    ...original,
    getOidcClient: jest.fn(),
  };
});

describe("Auth API Coverage", () => {
  beforeAll(() => {
    initDatabase(":memory:");
    const config = loadConfig();
    config.oauth = [
      {
        id: "test",
        name: "Test Provider",
        clientId: "client",
        clientSecret: "secret",
        issuerUrl: "https://test.com",
        asnJsonPath: "custom.asn",
      },
    ];
  });

  afterAll(() => {
    closeDatabase();
  });

  describe("GET /auth/providers", () => {
    it("should return oauth providers", async () => {
      const response = await request(app).get("/auth/providers");
      expect(response.status).toBe(200);
      expect(response.body[0].id).toBe("test");
    });
  });

  describe("GET /auth/login/:providerId", () => {
    it("should return 404 for unknown provider", async () => {
      const response = await request(app).get("/auth/login/unknown");
      expect(response.status).toBe(404);
    });

    it("should initiate login for valid provider", async () => {
      const mockClient = {
        authorizationUrl: jest.fn().mockReturnValue("https://test.com/auth"),
      };
      (oauthService.getOidcClient as jest.Mock).mockResolvedValue(mockClient);

      const response = await request(app).get("/auth/login/test");
      expect(response.status).toBe(302);
      expect(response.header.location).toBe("https://test.com/auth");
    });

    it("should handle error during login init", async () => {
      (oauthService.getOidcClient as jest.Mock).mockRejectedValue(
        new Error("init fail"),
      );
      const response = await request(app).get("/auth/login/test");
      expect(response.status).toBe(500);
    });
  });

  describe("GET /auth/callback/:providerId", () => {
    it("should redirect with error for unknown provider", async () => {
      const response = await request(app).get("/auth/callback/unknown");
      expect(response.status).toBe(302);
      expect(response.header.location).toContain("error=Provider+not+found");
    });

    it("should handle missing state", async () => {
      const mockClient = { callbackParams: jest.fn().mockReturnValue({}) };
      (oauthService.getOidcClient as jest.Mock).mockResolvedValue(mockClient);

      const response = await request(app).get("/auth/callback/test");
      expect(response.status).toBe(302);
      expect(response.header.location).toContain("error=Missing+state");
    });

    it("should handle invalid state", async () => {
      const mockClient = {
        callbackParams: jest.fn().mockReturnValue({ state: "invalid" }),
      };
      (oauthService.getOidcClient as jest.Mock).mockResolvedValue(mockClient);

      const response = await request(app).get("/auth/callback/test");
      expect(response.status).toBe(302);
      expect(response.header.location).toContain(
        "error=Invalid+or+expired+state",
      );
    });

    it("should handle missing access token", async () => {
      const { state } = oauthService.generateState("test");
      const mockClient = {
        callbackParams: jest.fn().mockReturnValue({ state }),
        callback: jest.fn().mockResolvedValue({}),
      };
      (oauthService.getOidcClient as jest.Mock).mockResolvedValue(mockClient);

      const response = await request(app).get(
        `/auth/callback/test?state=${state}`,
      );
      expect(response.status).toBe(302);
      expect(response.header.location).toContain(
        "error=Failed+to+retrieve+access+token",
      );
    });

    it("should handle invalid ASN", async () => {
      const { state } = oauthService.generateState("test");
      const mockClient = {
        callbackParams: jest.fn().mockReturnValue({ state }),
        callback: jest.fn().mockResolvedValue({ access_token: "token" }),
        userinfo: jest.fn().mockResolvedValue({ custom: { asn: "invalid" } }),
      };
      (oauthService.getOidcClient as jest.Mock).mockResolvedValue(mockClient);

      const response = await request(app).get(
        `/auth/callback/test?state=${state}`,
      );
      expect(response.status).toBe(302);
      expect(response.header.location).toContain("error=Invalid+ASN");
    });

    it("should authenticate and create user", async () => {
      const { state } = oauthService.generateState("test");
      const mockClient = {
        callbackParams: jest.fn().mockReturnValue({ state }),
        callback: jest.fn().mockResolvedValue({ access_token: "token" }),
        userinfo: jest
          .fn()
          .mockResolvedValue({ custom: { asn: "4242429999" } }),
      };
      (oauthService.getOidcClient as jest.Mock).mockResolvedValue(mockClient);

      const response = await request(app).get(
        `/auth/callback/test?state=${state}`,
      );
      expect(response.status).toBe(302);
      expect(response.header.location).toContain("token=");

      const db = getDatabase();
      const user = db
        .prepare("SELECT * FROM users WHERE asn = ?")
        .get("4242429999");
      expect(user).toBeDefined();
    });

    it("should handle callback global errors", async () => {
      const { state } = oauthService.generateState("test");
      const mockClient = {
        callbackParams: jest.fn().mockReturnValue({ state }),
        callback: jest.fn().mockRejectedValue(new Error("fail")),
      };
      (oauthService.getOidcClient as jest.Mock).mockResolvedValue(mockClient);

      const response = await request(app).get(
        `/auth/callback/test?state=${state}`,
      );
      expect(response.status).toBe(302);
      expect(response.header.location).toContain("error=Authentication+failed");
    });
  });
});
