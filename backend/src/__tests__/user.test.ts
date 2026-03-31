import request from "supertest";
import { initDatabase, closeDatabase, getDatabase } from "../db";
import { loadConfig } from "../config";
import { generateToken } from "../middleware/auth";
import { app } from "../server";

export function createTestToken(asn: string = "4242421234"): string {
  const db = getDatabase();
  db.prepare("INSERT OR IGNORE INTO users (asn, enabled) VALUES (?, ?)").run(
    asn,
    1,
  );
  return generateToken(asn);
}

describe("User API", () => {
  let testToken: string;
  let testToken2: string;

  beforeAll(() => {
    loadConfig();
    initDatabase(":memory:");
    testToken = createTestToken("4242421234");
    testToken2 = createTestToken("6449612345");

    const db = getDatabase();
    db.prepare("INSERT INTO ns_servers (asn, server) VALUES (?, ?)").run(
      "4242421234",
      "ns1.test.dn42",
    );
    db.prepare("INSERT INTO ns_servers (asn, server) VALUES (?, ?)").run(
      "6449612345",
      "ns1.test.dn42",
    );
  });

  afterAll(() => {
    closeDatabase();
  });

  describe("GET /user/me", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/user/me");
      expect(response.status).toBe(401);
    });

    it("should return user info with valid token (424242 ASN)", async () => {
      const response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("asn", "4242421234");
      expect(response.body).toHaveProperty("prefix", "42401234");
      expect(response.body).toHaveProperty(
        "e164Zone",
        "4.3.2.1.0.4.2.4.e164.dn42",
      );
    });

    it("should return empty prefix for non-424242 ASN", async () => {
      const response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${testToken2}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("prefix", "");
    });
  });

  describe("GET /user/participants", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/user/participants");
      expect(response.status).toBe(401);
    });

    it("should return participants list with valid token", async () => {
      const response = await request(app)
        .get("/user/participants")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const participants = response.body;
      const p1 = participants.find((p: any) => p.asn === "4242421234");
      expect(p1).toBeDefined();
      expect(p1.prefix).toBe("42401234");

      const p2 = participants.find((p: any) => p.asn === "6449612345");
      expect(p2).toBeDefined();
      expect(p2.prefix).toBe("");
    });
  });

  describe("Edge Cases & Errors", () => {
    it("should return empty prefix for invalid ASN in participants list gracefully", async () => {
      const db = getDatabase();
      db.prepare(
        "INSERT INTO users (asn, enabled) VALUES ('invalid', 1)",
      ).run();
      db.prepare(
        "INSERT INTO ns_servers (asn, server) VALUES ('invalid', 'ns1.dn42')",
      ).run();

      const response = await request(app)
        .get("/user/participants")
        .set("Authorization", `Bearer ${testToken}`);
      expect(response.status).toBe(200);
      const invalidParticipant = response.body.find(
        (p: any) => p.asn === "invalid",
      );
      expect(invalidParticipant).toBeDefined();
      expect(invalidParticipant.prefix).toBe("N/A");
    });

    it("should trigger global error handler on unhandled exception", async () => {
      const db = getDatabase();
      db.prepare("DROP TABLE ns_servers").run();

      const response = await request(app)
        .get("/user/participants")
        .set("Authorization", `Bearer ${testToken}`);
      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");

      initDatabase(":memory:");
    });
  });
});
